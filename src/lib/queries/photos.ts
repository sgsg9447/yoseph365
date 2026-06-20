import { createPublicClient } from "@/lib/supabase/public";
import { publicUrl } from "@/lib/storage/keys";

/** 공개 훈련사진 갤러리 — 게시·미삭제 사진 URL 목록(최신 먼저). */
export async function getTrainingGalleryPhotos(): Promise<string[]> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("post")
    .select("images,created_at")
    .eq("category", "훈련사진")
    .eq("is_published", true)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .map((p) => p.images[0])
    .filter((k): k is string => Boolean(k))
    .map((k) => publicUrl(k));
}
