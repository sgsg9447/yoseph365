import { createClient } from "@/lib/supabase/client";
import type { UploadTarget } from "./types";

/** 업로드 대상에 파일을 직접 업로드. 드라이버별 분기. */
export async function uploadToTarget(target: UploadTarget, file: File): Promise<void> {
  switch (target.driver) {
    case "supabase": {
      const sb = createClient();
      const { error } = await sb.storage
        .from(target.bucket)
        .upload(target.key, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      return;
    }
    default:
      throw new Error(
        `지원하지 않는 스토리지 드라이버: ${(target as { driver: string }).driver}`,
      );
  }
}
