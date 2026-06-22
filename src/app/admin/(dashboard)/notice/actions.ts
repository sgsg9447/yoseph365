"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sanitizeRichHtml } from "@/lib/richtext/sanitize";
import { noticeCreateSchema, noticeUpdateSchema } from "@/lib/validations/forms";

export type NoticeResult = { ok: true } | { ok: false; error: string };

const GENERIC = "처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";

/** 공지 작성 — 본문 HTML은 서버에서 새니타이즈 후 저장. */
export async function createNotice(input: unknown): Promise<NoticeResult> {
  const parsed = noticeCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }
  const { title, body, pinned } = parsed.data;
  const cleanBody = sanitizeRichHtml(body);

  const supabase = await createClient();
  const { error } = await supabase.from("notice").insert({
    title,
    body: cleanBody,
    is_pinned: pinned,
    published_at: new Date().toISOString().slice(0, 10),
  });
  if (error) return { ok: false, error: GENERIC };

  revalidatePath("/admin/notice");
  revalidatePath("/notice");
  return { ok: true };
}

/** 공지 수정 — 본문 HTML은 서버에서 새니타이즈 후 저장. published_at은 유지. */
export async function updateNotice(input: unknown): Promise<NoticeResult> {
  const parsed = noticeUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }
  const { id, title, body, pinned } = parsed.data;
  const cleanBody = sanitizeRichHtml(body);

  const supabase = await createClient();
  const { error } = await supabase
    .from("notice")
    .update({ title, body: cleanBody, is_pinned: pinned })
    .eq("id", id);
  if (error) return { ok: false, error: GENERIC };

  revalidatePath("/admin/notice");
  revalidatePath("/notice");
  revalidatePath(`/notice/${id}`);
  return { ok: true };
}

/** 공지 삭제(소프트 삭제). */
export async function deleteNotice(id: number): Promise<NoticeResult> {
  if (!Number.isInteger(id) || id <= 0) return { ok: false, error: "잘못된 요청입니다." };

  const supabase = await createClient();
  const { error } = await supabase.from("notice").update({ is_deleted: true }).eq("id", id);
  if (error) return { ok: false, error: GENERIC };

  revalidatePath("/admin/notice");
  revalidatePath("/notice");
  return { ok: true };
}
