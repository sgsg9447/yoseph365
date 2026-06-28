import { createPublicClient } from "@/lib/supabase/public";

export type PopupKind = "renewal" | "image";

export interface PopupConfig {
  id: number;
  kind: PopupKind;
  hideOnMobile: boolean;
  /** kind === "image"일 때만 사용. */
  imageUrl: string | null;
  mobileImageUrl: string | null;
  linkUrl: string | null;
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
    .select("id, kind, hide_on_mobile, image_url, mobile_image_url, link_url")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    kind: data.kind === "image" ? "image" : "renewal",
    hideOnMobile: data.hide_on_mobile,
    imageUrl: data.image_url,
    mobileImageUrl: data.mobile_image_url,
    linkUrl: data.link_url,
  };
}
