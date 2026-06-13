import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트.
 * 공개 폼(수강신청·문의·대기) 제출 등 anon 권한 작업에 사용.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
