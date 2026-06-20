import type { InquiryView } from "@/lib/queries/admin";

// 클라이언트에서도 쓰는 순수 필터 — 서버 전용 모듈(admin.ts의 createClient)을 끌어오지 않도록 분리.

/** 상담 상태 필터('전체'/'신규'/'완료'). */
export function filterInquiries(rows: InquiryView[], status: string): InquiryView[] {
  if (status === "전체") return rows;
  return rows.filter((r) => r.status === status);
}

/** 상단 요약(전체·신규·오늘) 집계. today는 "YYYY.MM.DD". */
export function summarizeInquiries(
  rows: { date: string; status: string }[],
  today: string,
): { total: number; pending: number; today: number } {
  return {
    total: rows.length,
    pending: rows.filter((r) => r.status === "신규").length,
    today: rows.filter((r) => r.date === today).length,
  };
}

/** 필터 바용 상태별 건수(전체·신규·완료). */
export function countInquiriesByStatus(rows: { status: string }[]): {
  전체: number;
  신규: number;
  완료: number;
} {
  return {
    전체: rows.length,
    신규: rows.filter((r) => r.status === "신규").length,
    완료: rows.filter((r) => r.status === "완료").length,
  };
}

/** 이름 부분일치 검색(대소문자 무시). 빈 검색어는 전체 반환. */
export function searchInquiriesByName<T extends { name: string }>(rows: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (q === "") return rows;
  return rows.filter((r) => r.name.toLowerCase().includes(q));
}

/** 선택한 연·월(month는 1~12)의 문의만 — date는 "YYYY.MM.DD". */
export function filterInquiriesByMonth<T extends { date: string }>(
  rows: T[],
  year: number,
  month: number,
): T[] {
  const prefix = `${year}.${String(month).padStart(2, "0")}.`;
  return rows.filter((r) => r.date.startsWith(prefix));
}

/** 월 이동(연도 넘김 처리). month는 1~12. */
export function stepMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const idx = year * 12 + (month - 1) + delta;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

/** 년 선택 옵션 — 데이터의 가장 이른 해 ~ 올해, 내림차순. 데이터 없으면 [올해]. */
export function inquiryYearRange(rows: { date: string }[], currentYear: number): number[] {
  let min = currentYear;
  for (const r of rows) {
    const y = Number(r.date.slice(0, 4));
    if (Number.isFinite(y) && y < min) min = y;
  }
  const years: number[] = [];
  for (let y = currentYear; y >= min; y--) years.push(y);
  return years;
}
