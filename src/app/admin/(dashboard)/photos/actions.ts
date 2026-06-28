"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createUploadTarget as makeTarget, removeObjects } from "@/lib/storage/server";
import { trainingPhotoAddSchema, setFeaturedSchema } from "@/lib/validations/forms";
import type { UploadTarget } from "@/lib/storage/types";

export type PhotoResult = { ok: true } | { ok: false; error: string };

const GENERIC = "처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";

/** 업로드 대상 발급(브라우저 직접 업로드용). */
export async function createUploadTarget(
  contentType: string,
): Promise<{ ok: true; target: UploadTarget } | { ok: false; error: string }> {
  const target = await makeTarget(contentType);
  if (!target) return { ok: false, error: "JPG·PNG 이미지만 올릴 수 있습니다." };
  return { ok: true, target };
}

/** 업로드 완료된 사진들을 post 행으로 기록. */
export async function addTrainingPhotos(input: unknown): Promise<PhotoResult> {
  const parsed = trainingPhotoAddSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }
  const rows = parsed.data.photos.map((p) => ({
    category: "훈련사진" as const,
    gallery_category: parsed.data.galleryCategory,
    title: p.label || "훈련 현장 사진",
    images: [p.key],
  }));

  const supabase = await createClient();
  const { error } = await supabase.from("post").insert(rows);
  if (error) return { ok: false, error: GENERIC };

  revalidatePath("/admin/photos");
  revalidatePath("/photos");
  revalidatePath("/");
  return { ok: true };
}

/** 사진 삭제 — post 행 소프트삭제 + 버킷 객체 제거. */
export async function deleteTrainingPhoto(id: number): Promise<PhotoResult> {
  if (!Number.isInteger(id) || id <= 0) return { ok: false, error: "잘못된 요청입니다." };

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("post")
    .select("images")
    .eq("id", id)
    .eq("category", "훈련사진")
    .single();

  const { error } = await supabase
    .from("post")
    .update({ is_deleted: true })
    .eq("id", id)
    .eq("category", "훈련사진");
  if (error) return { ok: false, error: GENERIC };

  const key = row?.images?.[0];
  if (key) await removeObjects([key]);

  revalidatePath("/admin/photos");
  revalidatePath("/photos");
  revalidatePath("/");
  return { ok: true };
}

/** 메인 노출 사진 세트 저장 — 선택한 id만 featured, 나머지는 해제. */
export async function setFeaturedPhotos(input: unknown): Promise<PhotoResult> {
  const parsed = setFeaturedSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "잘못된 요청입니다." };
  }
  const { ids } = parsed.data;

  const supabase = await createClient();

  // 1) 기존 메인 노출 전부 해제
  const clear = await supabase
    .from("post")
    .update({ is_featured: false })
    .eq("category", "훈련사진")
    .eq("is_featured", true);
  if (clear.error) return { ok: false, error: GENERIC };

  // 2) 선택한 사진만 메인 노출
  if (ids.length > 0) {
    const set = await supabase
      .from("post")
      .update({ is_featured: true })
      .eq("category", "훈련사진")
      .in("id", ids);
    if (set.error) return { ok: false, error: GENERIC };
  }

  revalidatePath("/admin/photos");
  revalidatePath("/photos");
  revalidatePath("/");
  return { ok: true };
}
