"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { applicationMemoSchema } from "@/lib/validations/forms";

export type MemoResult = { ok: true } | { ok: false; error: string };

const GENERIC_ERROR = "메모 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";

/** 수강신청 메모(admin_memo) 갱신 — 관리자(authenticated)만. RLS가 권한을 강제. */
export async function updateApplicationMemo(input: unknown): Promise<MemoResult> {
  const parsed = applicationMemoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }
  const { id, memo } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("application")
    .update({ admin_memo: memo || null })
    .eq("id", id);
  if (error) return { ok: false, error: GENERIC_ERROR };

  revalidatePath("/admin/enroll");
  return { ok: true };
}

/**
 * 신규 신청을 "확인"(상담중) 처리 — 사이드바 '신규' 뱃지 카운트가 줄어든다.
 * 레이아웃까지 무효화해 사이드바 카운트를 다시 계산하게 한다.
 */
export async function confirmApplication(id: unknown): Promise<MemoResult> {
  if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "잘못된 요청입니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("application")
    .update({ status: "상담중" })
    .eq("id", id)
    .eq("status", "신규"); // 이미 처리된 건은 건드리지 않음
  if (error) return { ok: false, error: GENERIC_ERROR };

  revalidatePath("/admin", "layout");
  return { ok: true };
}
