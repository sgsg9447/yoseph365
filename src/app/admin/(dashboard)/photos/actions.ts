"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createUploadTarget as makeTarget, removeObjects } from "@/lib/storage/server";
import { trainingPhotoAddSchema, featuredToggleSchema } from "@/lib/validations/forms";
import { featuredLimitReached } from "@/lib/gallery/categories";
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

/** 메인 노출 토글 — 켤 때 최대 6장 cap 검증. */
export async function toggleFeatured(input: unknown): Promise<PhotoResult> {
  const parsed = featuredToggleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "잘못된 요청입니다." };
  const { id, on } = parsed.data;

  const supabase = await createClient();

  if (on) {
    const { count, error: cErr } = await supabase
      .from("post")
      .select("id", { count: "exact", head: true })
      .eq("category", "훈련사진")
      .eq("is_deleted", false)
      .eq("is_featured", true);
    if (cErr) return { ok: false, error: GENERIC };
    if (featuredLimitReached(count ?? 0)) {
      return {
        ok: false,
        error: "메인 사진은 최대 6장까지 선택할 수 있습니다. 다른 사진을 먼저 해제해 주세요.",
      };
    }
  }

  const { error } = await supabase
    .from("post")
    .update({ is_featured: on })
    .eq("id", id)
    .eq("category", "훈련사진");
  if (error) return { ok: false, error: GENERIC };

  revalidatePath("/admin/photos");
  revalidatePath("/photos");
  revalidatePath("/");
  return { ok: true };
}
