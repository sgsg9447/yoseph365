import { createClient } from "@/lib/supabase/server";
import { makeObjectKey, TRAINING_PHOTOS_BUCKET } from "./keys";
import type { UploadTarget } from "./types";

/** 브라우저가 직접 올릴 업로드 대상 발급. 현재 드라이버: supabase. */
export async function createUploadTarget(contentType: string): Promise<UploadTarget | null> {
  const key = makeObjectKey(contentType);
  if (!key) return null;
  return { driver: "supabase", bucket: TRAINING_PHOTOS_BUCKET, key };
}

/** 버킷 객체 삭제(best-effort). 현재 드라이버: supabase. */
export async function removeObjects(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const sb = await createClient();
  await sb.storage.from(TRAINING_PHOTOS_BUCKET).remove(keys);
}
