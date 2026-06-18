import type { NextRequest } from "next/server";
import { updateAdminSession } from "@/lib/supabase/middleware";

// Next.js 16: 'proxy' named export (middleware export deprecated)
export async function proxy(request: NextRequest) {
  return updateAdminSession(request);
}

// /admin 과 그 하위만 가로챈다(정적 자원 제외).
export const config = {
  matcher: ["/admin/:path*"],
};
