// 스토리지 순수 헬퍼 — node/cookie 의존 없이 서버·클라이언트 양쪽에서 import 가능.
export const TRAINING_PHOTOS_BUCKET = "training-photos";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png" };

/** content-type → 확장자. 허용 외 타입은 null. */
export function extFromContentType(contentType: string): string | null {
  return ALLOWED[contentType] ?? null;
}

/** 업로드용 객체 키 생성(uuid.ext). 허용 외 타입이면 null. */
export function makeObjectKey(contentType: string): string | null {
  const ext = extFromContentType(contentType);
  return ext ? `${crypto.randomUUID()}.${ext}` : null;
}

/** Supabase 공개 버킷 객체 URL 조립(순수). */
export function supabasePublicUrl(baseUrl: string, bucket: string, key: string): string {
  return `${baseUrl.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${key}`;
}

/** 객체 키 → 공개 URL. 현재 드라이버: supabase. */
export function publicUrl(key: string): string {
  return supabasePublicUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    TRAINING_PHOTOS_BUCKET,
    key,
  );
}

/** 업로드 전 파일 검증. 통과 시 null, 실패 시 사용자용 메시지. */
export function validatePhotoFile(file: { type: string; size: number }): string | null {
  if (!extFromContentType(file.type)) return "JPG·PNG 이미지만 올릴 수 있습니다.";
  if (file.size > MAX_BYTES) return "한 장당 최대 10MB까지 올릴 수 있습니다.";
  return null;
}
