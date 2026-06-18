import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { getAdminCourses } from "@/lib/queries/admin";
import { toCourseFunnel, type CourseFunnelView } from "./funnel";

/** 이벤트 1건 기록(anon insert). 트래킹 실패가 호출부를 깨지 않도록 예외를 삼킨다. */
export async function logEvent(
  name: string,
  opts?: { courseId?: string | null; props?: Record<string, unknown> },
): Promise<void> {
  try {
    const sb = createPublicClient();
    await sb.from("event_log").insert({
      name,
      course_id: opts?.courseId ?? null,
      props: (opts?.props ?? {}) as never,
    });
  } catch {
    // 트래킹은 비치명적
  }
}

/**
 * 과정별 퍼널(조회·신청·전환율). 관리자(authenticated) 전용 읽기.
 * 조회는 event_log(course_view), 신청은 application에서 집계.
 * event_log가 아직 없거나 조회 실패해도 과정 목록+신청수는 보이도록 graceful degrade.
 */
export async function getCourseFunnel(): Promise<CourseFunnelView[]> {
  const supabase = await createClient();
  const courses = await getAdminCourses();

  // 조회 수(과정 id별)
  const viewsById: Record<string, number> = {};
  try {
    const { data } = await supabase.from("event_log").select("course_id").eq("name", "course_view");
    for (const row of data ?? []) {
      if (row.course_id) viewsById[row.course_id] = (viewsById[row.course_id] ?? 0) + 1;
    }
  } catch {
    // event_log 미적용 시 조회수 0으로 처리
  }

  // 신청 수(과정명별)
  const appliesByName: Record<string, number> = {};
  const { data: apps } = await supabase.from("application").select("selected_courses");
  for (const a of apps ?? []) {
    for (const courseName of a.selected_courses) {
      appliesByName[courseName] = (appliesByName[courseName] ?? 0) + 1;
    }
  }

  return toCourseFunnel(courses, viewsById, appliesByName);
}
