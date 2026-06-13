"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const slides = [
  { img: "/banners/banner-01-fee.png", alt: "내일배움카드 자기부담금 훈련비 안내" },
  { img: "/banners/banner-02-grade.png", alt: "고용노동부 2025년 이수자평가 A등급" },
  { img: "/banners/banner-03-pension.png", alt: "기술이 곧 연금이다 — 도전하는 그대는 아름답다" },
  { img: "/banners/banner-04-courses.png", alt: "국비지원 훈련생 환영 — 평일·주말 과정 안내" },
  { img: "/banners/banner-05-starbucks.png", alt: "수료생 이벤트 — 취업인증 시 스타벅스 커피 증정" },
  { img: "/banners/banner-06-faq.png", alt: "자주 묻는 질문 — 집수리과정과 목공과정 차이점" },
];

const n = slides.length;

interface BannerProps {
  onConsult?: () => void;
  onSchedule?: () => void;
}

export function Banner({ onConsult, onSchedule }: BannerProps) {
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

  // Slide click handlers indexed to match handoff
  const slideActions = [onConsult, onSchedule, onConsult, onSchedule, onConsult, onSchedule];

  return (
    <section className="wrap pt-7">
      <div
        className="relative rounded-[24px] overflow-hidden border border-hairline"
      >
        {/* Track */}
        <div
          className="flex"
          style={{
            transform: `translateX(-${i * 100}%)`,
            transition: "transform .5s cubic-bezier(0.2,0,0,1)",
          }}
        >
          {slides.map((s, k) => (
            <button
              key={k}
              onClick={slideActions[k]}
              aria-label={s.alt}
              className="flex-[0_0_100%] block p-0 border-none bg-white cursor-pointer"
            >
              <Image
                src={s.img}
                alt={s.alt}
                width={1120}
                height={440}
                className="block w-full h-auto"
              />
            </button>
          ))}
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
        {slides.map((_, k) => (
          <button
            key={k}
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
