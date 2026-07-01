/** 본문 이미지 드래그 리사이즈 — 너비(%) 범위. */
export const MIN_IMAGE_WIDTH = 10;
export const MAX_IMAGE_WIDTH = 100;

/**
 * 드래그로 바뀐 픽셀 너비를 컨테이너 대비 정수 %로 환산하고 10~100% 로 제한한다.
 * @param startPx  드래그 시작 시점의 이미지 픽셀 너비
 * @param deltaPx  드래그로 늘린(+)/줄인(−) 픽셀
 * @param containerPx  기준 컨테이너(본문) 픽셀 너비
 */
export function nextWidthPercent(startPx: number, deltaPx: number, containerPx: number): number {
  const pct = Math.round(((startPx + deltaPx) / containerPx) * 100);
  return Math.min(MAX_IMAGE_WIDTH, Math.max(MIN_IMAGE_WIDTH, pct));
}
