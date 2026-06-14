import { createPublicClient } from "@/lib/supabase/public";
import type { ApplyCourse, CatalogCourse, ScheduleCourse } from "./types";
import {
  patternToDay,
  patternToStartDate,
  curriculumToTable,
  trackToView,
  applyInfoRowToView,
  courseRecruitStatus,
  courseDays,
} from "./mappers";

export async function getCatalogCourses(): Promise<CatalogCourse[]> {
  const sb = createPublicClient();
  const [{ data: courses }, { data: curricula }, { data: tracks }, { data: exams }] =
    await Promise.all([
      sb.from("course").select("*").eq("is_deleted", false),
      sb.from("curriculum_item").select("*"),
      sb.from("course_track").select("*").order("sort_order"),
      sb.from("exam_schedule").select("*").order("sort_order"),
    ]);

  return (courses ?? []).map((c) => {
    const isCert = c.category === "기능사";
    const courseTracks = (tracks ?? []).filter((t) => t.course_id === c.id);
    const table = isCert
      ? []
      : curriculumToTable((curricula ?? []).filter((q) => q.course_id === c.id));
    const trackViews = isCert
      ? courseTracks.map((t) =>
          trackToView(
            t,
            (exams ?? []).filter((e) => e.track_id === t.id),
          ),
        )
      : undefined;
    const metaParts = [
      c.sessions_total ? `총 ${c.sessions_total}회차` : null,
      c.session_hours ? `회차당 ${c.session_hours}` : null,
    ].filter(Boolean);
    return {
      id: c.id,
      day: patternToDay(c.schedule_pattern),
      days: courseDays(isCert, patternToDay(c.schedule_pattern)),
      name: c.name,
      tags: c.skills ?? [],
      desc: c.summary ?? "",
      meta: metaParts.join(" · ") || (isCert ? "자격증 실기 속성 대비" : ""),
      recruitStatus: courseRecruitStatus(c.recruit_status, trackViews),
      funding: c.funding_type,
      table,
      tracks: trackViews,
    } satisfies CatalogCourse;
  });
}

export async function getCourseById(id: string): Promise<CatalogCourse | null> {
  const all = await getCatalogCourses();
  return all.find((c) => c.id === id) ?? null;
}

export async function getScheduleCourses(): Promise<ScheduleCourse[]> {
  const sb = createPublicClient();
  const { data } = await sb
    .from("course")
    .select("id, name, schedule_pattern, summary, recruit_status, is_deleted")
    .eq("is_deleted", false);
  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    startDate: patternToStartDate(c.schedule_pattern),
    meta: c.summary ?? "",
    open: c.recruit_status === "모집중",
  }));
}

export async function getApplyCourses(): Promise<ApplyCourse[]> {
  const sb = createPublicClient();
  const [{ data: courses }, { data: infos }] = await Promise.all([
    sb
      .from("course")
      .select("id, name, recruit_status")
      .eq("is_deleted", false)
      .neq("category", "기능사"), // 자격증은 트랙별 신청(상세 페이지에서 처리)
    sb.from("course_apply_info").select("*"),
  ]);

  return (courses ?? []).map((c) => {
    const info = (infos ?? []).find((i) => i.course_id === c.id);
    return {
      id: c.id,
      name: c.name,
      recruitStatus: c.recruit_status,
      applyInfo: info ? applyInfoRowToView(info) : null,
    };
  });
}
