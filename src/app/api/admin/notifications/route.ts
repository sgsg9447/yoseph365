import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildNotificationItems } from "@/lib/admin/notifications";

// 관리자 데스크탑 알림 폴링용. authenticated만 접근(미들웨어 matcher가 /admin/*만 잡으므로 자체 체크).
// PII(이름·연락처·본문)는 조회·반환하지 않는다.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const serverTime = new Date().toISOString();
  const since = request.nextUrl.searchParams.get("since");

  // 첫 폴링(기준선 설정): 백로그를 알림으로 재생하지 않는다.
  if (!since) {
    return NextResponse.json({ serverTime, items: [] });
  }

  const [appsRes, inqRes] = await Promise.all([
    supabase.from("application").select("id, selected_courses").gt("created_at", since),
    supabase.from("inquiry").select("id, category, course_id").gt("created_at", since),
  ]);

  const apps = appsRes.data ?? [];
  const inquiries = inqRes.data ?? [];

  // 상담문의만 course_id → 과정명 매핑이 필요(수강신청 selected_courses는 이미 과정명).
  const courseIds = new Set<string>();
  for (const q of inquiries) if (q.course_id) courseIds.add(q.course_id);

  const courseNames: Record<string, string> = {};
  if (courseIds.size > 0) {
    const { data: courses } = await supabase
      .from("course")
      .select("id, name")
      .in("id", [...courseIds]);
    for (const c of courses ?? []) courseNames[c.id] = c.name;
  }

  const items = buildNotificationItems(apps, inquiries, courseNames);
  return NextResponse.json({ serverTime, items });
}
