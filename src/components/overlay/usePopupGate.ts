"use client";

import { useCallback, useEffect, useState } from "react";
import { shouldShowPopup, hideUntilTimestamp } from "@/lib/popup/visibility";

const HIDE_KEY = "renewalPopupHideUntil";
const MOBILE_QUERY = "(max-width: 480px)";

// 팝업 공통 게이트 — 마운트 후 노출 판정, 닫기, "오늘 하루 열지 않기" 24h 억제, Esc.
// 리뉴얼/이미지 팝업이 공유. 노출 여부 판정은 shouldShowPopup 순수함수에 위임.
export function usePopupGate(hideOnMobile: boolean) {
  const [open, setOpen] = useState(false);
  const [hideForToday, setHideForToday] = useState(false);

  const close = useCallback(() => {
    if (hideForToday) {
      localStorage.setItem(HIDE_KEY, String(hideUntilTimestamp(Date.now())));
    }
    setOpen(false);
  }, [hideForToday]);

  // 마운트 후 브라우저 전용 상태(matchMedia·localStorage)를 읽어 1회 판정.
  // SSR과 동일한 기본값(false)으로 첫 렌더 후 갱신해 hydration 불일치를 피하는
  // 의도된 패턴이라 set-state-in-effect 규칙을 이 효과에 한해 끈다.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const isMobile = window.matchMedia(MOBILE_QUERY).matches;
    const raw = localStorage.getItem(HIDE_KEY);
    const parsed = raw !== null ? Number(raw) : NaN;
    const show = shouldShowPopup({
      isActive: true,
      hideOnMobile,
      isMobile,
      hideUntil: Number.isFinite(parsed) ? parsed : null,
      now: Date.now(),
    });
    if (show) setOpen(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [hideOnMobile]);

  // Esc로 닫기.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  return { open, close, hideForToday, setHideForToday };
}
