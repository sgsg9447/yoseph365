// 이미지 팝업 — 화면 폭에 맞는 이미지 URL 선택(순수).

export interface PopupImageInput {
  desktopUrl: string;
  /** 모바일 전용 이미지. 없으면 데스크톱으로 대체. */
  mobileUrl: string | null;
  isMobile: boolean;
}

/** 모바일이면 모바일 이미지(있을 때), 아니면 데스크톱 이미지. */
export function pickPopupImage(input: PopupImageInput): string {
  if (input.isMobile && input.mobileUrl) return input.mobileUrl;
  return input.desktopUrl;
}
