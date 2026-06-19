"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { inquiryStatusSchema } from "@/lib/validations/forms";

export type InquiryResult = { ok: true } | { ok: false; error: string };

/** 상담문의 상태 변경(완료 처리 등). 사이드바 '신규' 뱃지도 갱신되도록 레이아웃 재검증. */
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
  return { ok: true };
}
