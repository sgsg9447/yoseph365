"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { inquiryStatusSchema, inquiryMemoSchema } from "@/lib/validations/forms";
import { sanitizeRichHtml, isBlankHtml } from "@/lib/richtext/sanitize";

export type InquiryResult = { ok: true } | { ok: false; error: string };

/** 답변 입력 검증 — 빈 문자열 허용(비우면 답변 취소). */
const inquiryAnswerSchema = z.object({
  id: z.number().int().positive(),
  answer: z.string(),
});

/** 상담문의 상태 변경(완료 처리 등). 사이드바 '신규' 뱃지 + 공개 페이지(직접답변 안내) 갱신. */
export async function updateInquiryStatus(input: unknown): Promise<InquiryResult> {
  const parsed = inquiryStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }
  const { id, status } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("inquiry").update({ status }).eq("id", id);
  if (error) return { ok: false, error: "처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." };

  revalidatePath("/admin", "layout");
  revalidatePath("/inquiry");
  revalidatePath(`/inquiry/${id}`);
  return { ok: true };
}

/** 상담문의 메모(admin_memo) 갱신 — 관리자(authenticated)만. RLS가 권한을 강제. */
export async function updateInquiryMemo(input: unknown): Promise<InquiryResult> {
  const parsed = inquiryMemoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }
  const { id, memo } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("inquiry").update({ admin_memo: memo || null }).eq("id", id);
  if (error) return { ok: false, error: "처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." };

  revalidatePath("/admin/consult");
  return { ok: true };
}

/** 공개 게시판 글 숨김/공개 토글 — 관리자(authenticated)만. */
export async function updateInquiryPublished(id: number, published: boolean): Promise<InquiryResult> {
  const sb = await createClient();
  const { error } = await sb.from("inquiry").update({ is_published: published }).eq("id", id);
  if (error) return { ok: false as const, error: "변경에 실패했습니다." };
  revalidatePath("/admin/consult");
  return { ok: true as const };
}

/** 답변 모달 prefill용 — 현재 저장된 답변 HTML 조회. 관리자(authenticated)만. */
export async function getInquiryAnswer(
  id: number,
): Promise<{ ok: true; answer: string } | { ok: false; error: string }> {
  if (!Number.isInteger(id) || id <= 0) return { ok: false, error: "잘못된 요청입니다." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("inquiry").select("answer").eq("id", id).single();
  if (error) return { ok: false, error: "답변을 불러오지 못했습니다." };
  return { ok: true, answer: data?.answer ?? "" };
}

/**
 * 상담문의 답변 저장 — 답변 HTML은 서버에서 sanitize.
 * 내용이 있으면 status='답변완료', 비우면 answer=null·status='답변대기'(되돌리기).
 */
export async function answerInquiry(input: unknown): Promise<InquiryResult> {
  const parsed = inquiryAnswerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }
  const { id, answer } = parsed.data;
  const clean = sanitizeRichHtml(answer);
  const blank = isBlankHtml(clean);

  const supabase = await createClient();
  const { error } = await supabase
    .from("inquiry")
    .update({ answer: blank ? null : clean, status: blank ? "답변대기" : "답변완료" })
    .eq("id", id);
  if (error) return { ok: false, error: "처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." };

  revalidatePath("/admin", "layout");
  revalidatePath("/inquiry");
  revalidatePath(`/inquiry/${id}`);
  return { ok: true };
}
