"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { applicationMemoSchema, applicationStatusSchema } from "@/lib/validations/forms";

export type MemoResult = { ok: true } | { ok: false; error: string };

const GENERIC_ERROR = "처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";

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
 * 수강신청 상태 변경. '신규' → 다른 상태로 바꾸면 사이드바 '신규' 뱃지·이름 옆 점이 함께 사라진다.
 * 레이아웃까지 무효화해 사이드바 카운트를 다시 계산하게 한다.
 */
export async function updateApplicationStatus(input: unknown): Promise<MemoResult> {
  const parsed = applicationStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }
  const { id, status } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("application").update({ status }).eq("id", id);
  if (error) return { ok: false, error: GENERIC_ERROR };

  revalidatePath("/admin", "layout");
  return { ok: true };
}
