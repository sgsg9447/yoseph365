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
