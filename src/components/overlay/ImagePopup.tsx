"use client";

import { useEffect, useState } from "react";
import { X, Check } from "@/components/icons";
import { usePopupGate } from "./usePopupGate";
import { pickPopupImage } from "@/lib/popup/image";
import type { PopupConfig } from "@/lib/queries/popup";

const MOBILE_QUERY = "(max-width: 480px)";

// 이미지 팝업 — 운영자가 업로드한 포스터. 데스크톱/모바일 이미지·선택 링크.
// 노출/닫기/24h억제는 usePopupGate 공유. 이미지 선택은 pickPopupImage 순수함수.
export function ImagePopup({ config }: { config: PopupConfig }) {
  const { open, close, hideForToday, setHideForToday } = usePopupGate(config.hideOnMobile);
  const [isMobile, setIsMobile] = useState(false);

  // 화면 폭 추적(리사이즈 시 모바일/데스크톱 이미지 전환).
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (!open || !config.imageUrl) return null;

  const src = pickPopupImage({
    desktopUrl: config.imageUrl,
    mobileUrl: config.mobileImageUrl,
    isMobile,
  });
  const link = config.linkUrl?.trim() || null;

  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="안내 이미지" className="block w-full h-auto max-h-[78vh] object-contain" />
  );

  return (
    <div
      onClick={close}
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-auto p-[22px] bg-[rgba(12,10,9,0.52)] backdrop-blur-[3px]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="안내 팝업"
        onClick={(e) => e.stopPropagation()}
        className="rp-card relative w-full max-w-[440px] bg-surface-card rounded-[20px] overflow-hidden shadow-pop"
      >
        <button
          type="button"
          onClick={close}
          aria-label="닫기"
          className="absolute top-[12px] right-[12px] z-10 w-9 h-9 grid place-items-center rounded-full bg-white/70 backdrop-blur-[4px] text-muted hover:bg-white hover:text-ink transition"
        >
          <X size={20} strokeWidth={2.1} />
        </button>

        {link ? (
          <a href={link} onClick={close} className="block">
            {image}
          </a>
        ) : (
          image
        )}

        {/* Bottom bar */}
        <div className="flex items-center justify-between gap-3 px-[18px] py-3 border-t border-hairline">
          <button
            type="button"
            onClick={() => setHideForToday((v) => !v)}
            className="flex items-center gap-2 text-[13.5px] text-muted"
          >
            <span
              className={[
                "w-5 h-5 rounded-[6px] grid place-items-center border-[1.5px] transition",
                hideForToday
                  ? "bg-primary border-primary text-white"
                  : "border-hairline-strong text-transparent",
              ].join(" ")}
            >
              <Check size={13} strokeWidth={3} />
            </span>
            오늘 하루 열지 않기
          </button>
          <button
            type="button"
            onClick={close}
            className="text-[13.5px] font-semibold text-muted hover:text-ink hover:underline underline-offset-2 transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
