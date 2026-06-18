export interface CourseFunnelView {
  id: string;
  name: string;
  /** 과정 상세 페이지 조회 수(course_view 이벤트) */
  views: number;
  /** 해당 과정 신청 수(application) */
  applies: number;
  /** 전환율(%) = 신청/조회 */
  conversionPct: number;
}

/** 전환율(%). 조회 0이면 0. */
export function conversionRate(applies: number, views: number): number {
  if (views <= 0) return 0;
  return Math.round((applies / views) * 100);
}

/** 최다 조회 대비 막대 비율(0~100). */
export function viewBarPct(views: number, maxViews: number): number {
  return maxViews > 0 ? Math.round((views / maxViews) * 100) : 0;
}

/**
 * 과정별 퍼널 뷰. 조회는 과정 id로, 신청은 과정명으로 집계한 맵을 받아 합친다.
 * (신청은 application.selected_courses에 과정명이 저장되므로 이름으로 매칭)
 * 조회수 내림차순 정렬.
 */
export function toCourseFunnel(
  courses: { id: string; name: string }[],
  viewsById: Record<string, number>,
  appliesByName: Record<string, number>,
): CourseFunnelView[] {
  return courses
    .map((c) => {
      const views = viewsById[c.id] ?? 0;
      const applies = appliesByName[c.name] ?? 0;
      return { id: c.id, name: c.name, views, applies, conversionPct: conversionRate(applies, views) };
    })
    .sort((a, b) => b.views - a.views);
}
