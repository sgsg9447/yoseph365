import type { EnrollmentView } from "@/lib/queries/admin";

// 클라이언트에서도 쓰는 순수 함수 — 서버 전용 모듈(admin.ts의 createClient)을 끌어오지 않도록 분리.

/**
 * 상태·과정·이름 필터. '전체'는 해당 조건 무시. 과정은 선택 과정(courses)에 포함되면 통과.
 * query는 신청자 이름 부분일치(대소문자 무시), 공백이면 무시.
 */
export function filterEnrollments(
  rows: EnrollmentView[],
  filters: { status: string; course: string; query?: string },
): EnrollmentView[] {
  const q = (filters.query ?? "").trim().toLowerCase();
  return rows.filter((r) => {
    const statusOk = filters.status === "전체" || r.status === filters.status;
    const courseOk = filters.course === "전체" || r.courses.includes(filters.course);
    const queryOk = q === "" || r.name.toLowerCase().includes(q);
    return statusOk && courseOk && queryOk;
  });
}

export interface Page<T> {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
}

/** 1-기반 페이지네이션. page는 [1, totalPages]로 클램프. 빈 목록도 totalPages 1. */
export function paginate<T>(rows: T[], page: number, perPage = 10): Page<T> {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(1, Math.floor(page)), totalPages);
  const start = (current - 1) * perPage;
  return {
    items: rows.slice(start, start + perPage),
    page: current,
    totalPages,
    total,
  };
}
