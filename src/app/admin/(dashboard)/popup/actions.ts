"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { popupSettingsSchema } from "@/lib/validations/forms";

export type PopupResult = { ok: true } | { ok: false; error: string };

const GENERIC = "처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";

/** 팝업 노출 설정 저장 — 사이트 노출 on/off, 모바일 숨김. */
export async function updatePopupSettings(input: unknown): Promise<PopupResult> {
  const parsed = popupSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }
  const { id, isActive, hideOnMobile } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("popup")
    .update({ is_active: isActive, hide_on_mobile: hideOnMobile })
    .eq("id", id);
  if (error) return { ok: false, error: GENERIC };

  // 팝업은 (public) 레이아웃에서 조회되므로 레이아웃 단위로 전 공개 페이지를 갱신.
  revalidatePath("/", "layout");
  revalidatePath("/admin/popup");
  return { ok: true };
}
