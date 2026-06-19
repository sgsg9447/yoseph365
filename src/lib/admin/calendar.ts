// 경량 월간 캘린더 헬퍼(순수). 날짜는 "YYYY.MM.DD"(상담 date 형식)로 맞춘다.

export function countByDate(rows: { date: string }[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const r of rows) m[r.date] = (m[r.date] ?? 0) + 1;
  return m;
}

export interface CalCell {
  date: string | null;
  day: number;
  inMonth: boolean;
}

function ds(year: number, month: number, day: number): string {
  return `${year}.${String(month).padStart(2, "0")}.${String(day).padStart(2, "0")}`;
}

/** year, month(1-12)의 월 그리드(앞뒤 빈칸 포함, 7의 배수). */
export function buildMonth(year: number, month: number): CalCell[] {
  const startDow = new Date(year, month - 1, 1).getDay(); // 0=일
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: CalCell[] = [];
  for (let i = 0; i < startDow; i++) cells.push({ date: null, day: 0, inMonth: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ date: ds(year, month, d), day: d, inMonth: true });
  while (cells.length % 7 !== 0) cells.push({ date: null, day: 0, inMonth: false });
  return cells;
}
