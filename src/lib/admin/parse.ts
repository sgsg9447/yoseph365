/** 쉼표 구분 문자열 → 배열(각 항목 trim, 빈 항목 제거). */
export function parseCsvList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
