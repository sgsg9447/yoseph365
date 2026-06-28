// 리치 텍스트 글자 크기 스테퍼용 순수 로직. 기본 크기는 .rich-content 본문(15px) 기준.

export const BASE_FONT_SIZE = 15;
export const MIN_FONT_SIZE = 12;
export const MAX_FONT_SIZE = 40;
const STEP = 1;

/** "20px" → 20. 값이 없거나 숫자로 못 읽으면 기본 크기. */
export function parseFontSize(value: string | undefined): number {
  if (!value) return BASE_FONT_SIZE;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : BASE_FONT_SIZE;
}

/** 현재 크기에서 delta(±1) 단계 이동, [MIN, MAX]로 클램프. */
export function stepFontSize(current: number, delta: number): number {
  const next = current + delta * STEP;
  return Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, next));
}
