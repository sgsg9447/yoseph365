"use client";

import { useState, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { BANNER_SLIDES } from "./BannerSlides";

const n = BANNER_SLIDES.length;
const SWIPE_THRESHOLD = 50; // px — 이만큼 끌면 다음/이전 슬라이드로 스냅

export function Banner() {
  const [i, setI] = useState(0);
  const [dx, setDx] = useState(0); // 드래그 중 손가락 따라 이동한 거리(px)
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const dxRef = useRef(0); // 최신 드래그 거리 — 스냅 판정 시 stale state 방지
  const draggingRef = useRef(false);
  const movedRef = useRef(false); // 실제 드래그가 일어났는지(클릭과 구분)

  // 활성 dot의 진행바 애니메이션(5s)이 끝나면 다음 슬라이드로 — 진행바가 곧 타이머.
  // prefers-reduced-motion이면 CSS가 애니메이션을 끄므로 이 핸들러도 호출되지 않는다.
  function onProgressEnd() {
    setI((p) => (p + 1) % n);
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    startX.current = e.clientX;
    draggingRef.current = true;
    movedRef.current = false;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    let delta = e.clientX - startX.current;
    if (Math.abs(delta) > 8) movedRef.current = true;
    // 양 끝에서는 고무줄 저항 — 빈 영역이 크게 드러나지 않도록
    if ((i === 0 && delta > 0) || (i === n - 1 && delta < 0)) delta /= 3;
    dxRef.current = delta;
    setDx(delta);
  }

  function endDrag() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    const delta = dxRef.current;
    dxRef.current = 0;
    setDx(0);
    setI((p) => {
      if (delta <= -SWIPE_THRESHOLD) return Math.min(p + 1, n - 1);
      if (delta >= SWIPE_THRESHOLD) return Math.max(p - 1, 0);
      return p;
    });
  }

  return (
    <section className="wrap pt-7">
      <div
        data-testid="banner-track"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDragStart={(e) => e.preventDefault()}
        onClickCapture={(e) => {
          // 드래그 후 슬라이드 내부 링크가 눌리는 것을 방지
          if (movedRef.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        className="relative rounded-[24px] overflow-hidden border border-hairline shadow-card cursor-grab active:cursor-grabbing select-none touch-pan-y"
      >
        {/* 가로 트랙 — translateX로 슬라이드 이동, 드래그 중엔 손가락을 따라감 */}
        <div
          className="flex"
          style={{
            transform: `translateX(calc(${-i * 100}% + ${dx}px))`,
            transition: dragging ? "none" : "transform 400ms ease",
          }}
        >
          {BANNER_SLIDES.map((s, k) => {
            const Comp = s.Comp;
            return (
              <div key={s.key} className="w-full flex-none" aria-hidden={k !== i}>
                <Comp />
              </div>
            );
          })}
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

      {/* Dot navigation — 활성 dot은 다음 슬라이드까지 남은 시간을 진행바로 표시 */}
      <div className="flex justify-center gap-[10px] pt-[18px]">
        {BANNER_SLIDES.map((s, k) => {
          const active = k === i;
          return (
            <button
              key={s.key}
              aria-label={`슬라이드 ${k + 1}`}
              onClick={() => setI(k)}
              className="w-11 h-[14px] p-0 border-none bg-none cursor-pointer flex items-center"
            >
              <span
                className="relative block w-full rounded-full overflow-hidden transition-all duration-300"
                style={{
                  height: active ? 4 : 3,
                  background: "rgba(26,26,24,0.16)",
                }}
              >
                {active && (
                  <span
                    key={i}
                    data-testid="banner-progress"
                    onAnimationEnd={onProgressEnd}
                    className="dot-progress block h-full rounded-full"
                    style={{
                      // 기본 100%(reduced-motion이면 꽉 찬 dot). 애니메이션이 0→100%로 덮어씀
                      width: "100%",
                      background: "var(--color-ink)",
                      animationPlayState: dragging ? "paused" : "running",
                    }}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
