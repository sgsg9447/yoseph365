"use client";

import { useState, useEffect } from "react";
import { BANNER_SLIDES } from "./BannerSlides";

const n = BANNER_SLIDES.length;

export function Banner() {
  const [i, setI] = useState(0);

  // 5s autoplay — skip under prefers-reduced-motion
  useEffect(() => {
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const t = setInterval(() => setI((p) => (p + 1) % n), 5000);
    return () => clearInterval(t);
  }, []);

  const Active = BANNER_SLIDES[i].Comp;

  return (
    <section className="wrap pt-7">
      <div className="relative rounded-[24px] overflow-hidden border border-hairline shadow-card">
        {/* 활성 슬라이드 — 전환 시 짧은 페이드 (reduced-motion 존중). key로 리마운트해 애니메이션 재생 */}
        <div key={i} className="banner-fade">
          <Active />
        </div>

        {/* Indicator */}
        <span
          className="absolute right-[18px] bottom-4 z-[2] text-[13px] font-semibold text-body-strong rounded-full px-[13px] py-[5px] tracking-[0.5px] tabular-nums"
          style={{
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(4px)",
          }}
        >
          {i + 1} / {n}
        </span>
      </div>

      {/* Dot navigation */}
      <div className="flex justify-center gap-[10px] pt-[18px]">
        {BANNER_SLIDES.map((s, k) => (
          <button
            key={s.key}
            aria-label={`슬라이드 ${k + 1}`}
            onClick={() => setI(k)}
            className="w-11 h-[14px] p-0 border-none bg-none cursor-pointer flex items-center"
          >
            <span
              className="block w-full rounded-full transition-all duration-300"
              style={{
                height: k === i ? 4 : 3,
                background: k === i ? "var(--color-ink)" : "rgba(26,26,24,0.16)",
              }}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
