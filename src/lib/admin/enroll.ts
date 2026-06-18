import type { EnrollmentView } from "@/lib/queries/admin";

// 클라이언트에서도 쓰는 순수 필터 — 서버 전용 모듈(admin.ts의 createClient)을 끌어오지 않도록 분리.

/** 상태·과정 필터. '전체'는 해당 조건 무시. 과정은 선택 과정(courses)에 포함되면 통과. */
export function filterEnrollments(
  rows: EnrollmentView[],
  filters: { status: string; course: string },
): EnrollmentView[] {
  return rows.filter((r) => {
    const statusOk = filters.status === "전체" || r.status === filters.status;
    const courseOk = filters.course === "전체" || r.courses.includes(filters.course);
    return statusOk && courseOk;
  });
}
