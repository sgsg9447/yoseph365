import { createPublicClient } from "@/lib/supabase/public";

export interface PopupConfig {
  id: number;
  hideOnMobile: boolean;
}

/**
 * 공개 사이트에 노출할 활성 팝업 1건.
 * RLS(popup public read)가 이미 활성·노출기간 내 행만 허용하므로,
 * 반환된 행은 곧 노출 대상이다. 없으면 null.
 */
export async function getActivePopup(): Promise<PopupConfig | null> {
  const sb = createPublicClient();
  const { data } = await sb
    .from("popup")
    .select("id, hide_on_mobile")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return { id: data.id, hideOnMobile: data.hide_on_mobile };
}
