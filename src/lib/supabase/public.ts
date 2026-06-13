import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * 공개 콘텐츠 읽기 전용 클라이언트.
 * 쿠키를 쓰지 않으므로 서버 컴포넌트의 ISR/정적 렌더가 가능하다.
 * anon 키를 사용하므로 RLS(공개 SELECT 정책)가 적용된다.
 */
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
}
