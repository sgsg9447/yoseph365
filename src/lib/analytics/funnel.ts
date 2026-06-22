/**
 * 전환율(%)을 표시할 최소 조회 표본. 이보다 조회가 적으면 신청 1건에 %가 크게 출렁여
 * 수치가 오해를 부르므로, 전환율 대신 "표본 적음"으로 처리한다.
 */
export const MIN_VIEWS_FOR_RATE = 100;

export interface CourseFunnelView {
  id: string;
  name: string;
  /** 과정 상세 페이지 조회 수(course_view 이벤트) */
  views: number;
  /** 해당 과정 신청 수(application) */
  applies: number;
  /** 전환율(%) = 신청/조회 */
  conversionPct: number;
  /** 전환율을 믿을 만한 표본(조회 ≥ MIN_VIEWS_FOR_RATE)인지 */
  rateReliable: boolean;
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
      return {
        id: c.id,
        name: c.name,
        views,
        applies,
        conversionPct: conversionRate(applies, views),
        rateReliable: views >= MIN_VIEWS_FOR_RATE,
      };
    })
    .sort((a, b) => b.views - a.views);
}
