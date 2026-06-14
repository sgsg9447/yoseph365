"use client";

// 사진 캐러셀 — 좌우 이동·점 네비게이션, 클릭 시 라이트박스로 확대.
// 실제 사진은 src로 주입(추후). src 없으면 PhotoSlot 플레이스홀더.

import { useState, useEffect, useCallback } from "react";
import { PhotoSlot } from "./PhotoSlot";

export interface CarouselSlide {
  src?: string;
  label: string;
}

function Slide({
  slide,
  ratio,
  radius,
}: {
  slide: CarouselSlide;
  ratio: string;
  radius: number;
}) {
  if (slide.src) {
    return (
      // 실제 사진(추후 주입). 비율 고정 컨테이너에 채움.
      <div style={{ aspectRatio: ratio, borderRadius: radius, overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slide.src}
          alt={slide.label}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
    );
  }
  return <PhotoSlot ratio={ratio} label={slide.label} radius={radius} />;
}

function NavButton({
  dir,
  onClick,
}: {
  dir: "prev" | "next";
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      aria-label={dir === "prev" ? "이전 사진" : "다음 사진"}
      onClick={onClick}
      style={{
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        [dir === "prev" ? "left" : "right"]: 10,
        width: 40,
        height: 40,
        display: "grid",
        placeItems: "center",
        borderRadius: 9999,
        border: "none",
        background: "rgba(255,255,255,0.92)",
        boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
        cursor: "pointer",
        color: "var(--color-ink)",
      } as React.CSSProperties}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={dir === "prev" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
      </svg>
    </button>
  );
}

export function PhotoCarousel({
  slides,
  ratio = "4 / 3",
  radius = 18,
}: {
  slides: CarouselSlide[];
  ratio?: string;
  radius?: number;
}) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);

  const count = slides.length;
  const go = useCallback(
    (d: number) => setIndex((p) => (p + d + count) % count),
    [count],
  );

  // 라이트박스: ESC 닫기 / 좌우 이동
  useEffect(() => {
    if (!zoom) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setZoom(false);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom, go]);

  if (count === 0) return null;
  const cur = slides[index];

  return (
    <div>
      {/* 뷰포트 */}
      <div
        style={{ position: "relative", cursor: "zoom-in" }}
        onClick={() => setZoom(true)}
        role="button"
        aria-label={`${cur.label} 크게 보기`}
      >
        <Slide slide={cur} ratio={ratio} radius={radius} />
        {count > 1 && (
          <>
            <NavButton
              dir="prev"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
            />
            <NavButton
              dir="next"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
            />
          </>
        )}
      </div>

      {/* 점 네비게이션 */}
      {count > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 14 }}>
          {slides.map((s, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i + 1}번째 사진`}
              onClick={() => setIndex(i)}
              style={{
                width: i === index ? 22 : 8,
                height: 8,
                borderRadius: 9999,
                border: "none",
                background: i === index ? "var(--color-primary)" : "var(--color-hairline-strong)",
                cursor: "pointer",
                transition: "width .2s",
                padding: 0,
              }}
            />
          ))}
        </div>
      )}

      {/* 라이트박스 */}
      {zoom && (
        <div
          onClick={() => setZoom(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.82)",
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
        >
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setZoom(false)}
            style={{
              position: "absolute",
              top: 18,
              right: 18,
              width: 44,
              height: 44,
              borderRadius: 9999,
              border: "none",
              background: "rgba(255,255,255,0.16)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 22,
              lineHeight: 1,
            }}
          >
            ×
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: "relative", width: "min(92vw, 980px)" }}
          >
            <Slide slide={cur} ratio={ratio} radius={12} />
            {count > 1 && (
              <>
                <NavButton dir="prev" onClick={() => go(-1)} />
                <NavButton dir="next" onClick={() => go(1)} />
              </>
            )}
            <p style={{ color: "#fff", textAlign: "center", marginTop: 14, fontSize: 14 }}>
              {cur.label} · {index + 1} / {count}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
