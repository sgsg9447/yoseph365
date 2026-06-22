"use server";

import { createUploadTarget as makeTarget } from "./server";
import type { UploadTarget } from "./types";

/** 리치 에디터 본문 이미지 업로드 대상 발급(브라우저 직접 업로드용). */
export async function createImageUploadTarget(
  contentType: string,
): Promise<{ ok: true; target: UploadTarget } | { ok: false; error: string }> {
  const target = await makeTarget(contentType);
  if (!target) return { ok: false, error: "JPG·PNG 이미지만 올릴 수 있습니다." };
  return { ok: true, target };
}
