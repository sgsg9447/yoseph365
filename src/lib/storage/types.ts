// 스토리지 백엔드 어댑터 타입. 백엔드 특이사항은 이 디렉터리 안에만 존재한다.
export type StorageDriver = "supabase" | "s3";

// 브라우저가 백엔드로 직접 업로드하기 위한 정보(드라이버별 형태가 다르다).
export type UploadTarget =
  | { driver: "supabase"; bucket: string; key: string }
  | { driver: "s3"; key: string; uploadUrl: string; headers: Record<string, string> }; // 미래
