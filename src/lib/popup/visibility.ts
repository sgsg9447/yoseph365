// 팝업 노출 판정 — 순수 로직(브라우저·서버 어디서나 import 가능).

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export interface PopupVisibilityInput {
  isActive: boolean;
  hideOnMobile: boolean;
  isMobile: boolean;
  /** "오늘 하루 열지 않기" 만료 epoch(ms). 없으면 null. */
  hideUntil: number | null;
  now: number;
}

/** 팝업을 지금 보여줄지 판정. */
export function shouldShowPopup(input: PopupVisibilityInput): boolean {
  if (!input.isActive) return false;
  if (input.hideUntil !== null && input.now < input.hideUntil) return false;
  if (input.hideOnMobile && input.isMobile) return false;
  return true;
}

/** "오늘 하루 열지 않기" 만료 시각(현재 + 24h). */
export function hideUntilTimestamp(now: number): number {
  return now + ONE_DAY_MS;
}
