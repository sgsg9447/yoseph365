import { createPublicClient } from "@/lib/supabase/public";
import { publicUrl } from "@/lib/storage/keys";
import { isLeafCategory, type LeafCategory } from "@/lib/gallery/categories";

export interface GalleryPhoto {
  category: LeafCategory;
  url: string;
}

/** 공개 훈련사진 — 카테고리 포함, 게시·미삭제, 최신 먼저. */
export async function getTrainingGalleryPhotos(): Promise<GalleryPhoto[]> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("post")
    .select("images,gallery_category,created_at")
    .eq("category", "훈련사진")
    .eq("is_published", true)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .map((p) => ({ key: p.images[0], cat: p.gallery_category }))
    .filter(
      (p): p is { key: string; cat: LeafCategory } =>
        Boolean(p.key) && isLeafCategory(p.cat),
    )
    .map((p) => ({ category: p.cat, url: publicUrl(p.key) }));
}

/** 홈 메인 노출 사진 — is_featured 최신순 최대 6장. 없으면 최신 6장 폴백. */
export async function getFeaturedTrainingPhotos(): Promise<string[]> {
  const sb = createPublicClient();
  const select = () =>
    sb
      .from("post")
      .select("images,created_at")
      .eq("category", "훈련사진")
      .eq("is_published", true)
      .eq("is_deleted", false);

  const featured = await select()
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(6);
  if (featured.error) throw featured.error;

  let rows = featured.data ?? [];
  if (rows.length === 0) {
    const fallback = await select()
      .order("created_at", { ascending: false })
      .limit(6);
    if (fallback.error) throw fallback.error;
    rows = fallback.data ?? [];
  }
  return rows
    .map((r) => r.images[0])
    .filter((k): k is string => Boolean(k))
    .map((k) => publicUrl(k));
}
