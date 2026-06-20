"use client";

// 훈련 사진 갤러리 — 보내주신 사진이 이미 여러 장을 한 장으로 합친 콜라주라,
// 카테고리로 나누지 않고 하나로 모아 보여준다. 비율이 1.2~4.1로 제각각이라
// 자르지 않고(justified rows) 행마다 높이를 맞춰 가로폭을 꽉 채운다. 클릭 시 확대.

import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";

// /public/photos/training-detail/1.JPG … 25.JPG
const PHOTOS = Array.from(
  { length: 25 },
  (_, i) => `/photos/training-detail/${i + 1}.JPG`,
);
const GAP = 10;
const FALLBACK_RATIO = 1.4; // 로드 전 임시 비율(레이아웃 점프 최소화)

type Cell = { i: number; w: number; h: number };

// 비율 목록을 받아 행 단위로 배치한다. 마지막 행은 늘리지 않고 목표 높이로 둔다.
function buildRows(
  ratios: number[],
  containerW: number,
  targetH: number,
): Cell[][] {
  const rows: Cell[][] = [];
  let row: number[] = [];
  let sumR = 0;
  for (let i = 0; i < ratios.length; i++) {
    row.push(i);
    sumR += ratios[i];
    const rowW = sumR * targetH + GAP * (row.length - 1);
    if (rowW >= containerW) {
      const h = (containerW - GAP * (row.length - 1)) / sumR;
      rows.push(row.map((idx) => ({ i: idx, w: ratios[idx] * h, h })));
      row = [];
      sumR = 0;
    }
  }
  if (row.length) {
    rows.push(row.map((idx) => ({ i: idx, w: ratios[idx] * targetH, h: targetH })));
  }
  return rows;
}

export function TrainingGallery() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [ratios, setRatios] = useState<number[]>(() =>
    PHOTOS.map(() => FALLBACK_RATIO),
  );
  const [zoom, setZoom] = useState<number | null>(null);

  // 컨테이너 너비 측정 + 리사이즈 추적
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onImgLoad = useCallback(
    (i: number, e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      const r = img.naturalWidth / img.naturalHeight;
      setRatios((prev) => {
        if (Math.abs(prev[i] - r) < 0.001) return prev;
        const next = [...prev];
        next[i] = r;
        return next;
      });
    },
    [],
  );

  const targetH = width < 560 ? 150 : width < 900 ? 200 : 240;
  const rows = width > 0 ? buildRows(ratios, width, targetH) : null;

  // 라이트박스: ESC 닫기 / 좌우 이동
  const go = useCallback(
    (d: number) =>
      setZoom((p) => (p === null ? p : (p + d + PHOTOS.length) % PHOTOS.length)),
    [],
  );
  useEffect(() => {
    if (zoom === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setZoom(null);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom, go]);

  return (
    <div ref={containerRef}>
      {/* justified rows: 너비를 알기 전엔 한 줄에 흘려보내며 자연 로드 → 측정되면 배치 */}
      <div style={{ display: "flex", flexDirection: "column", gap: GAP }}>
        {(rows ?? [PHOTOS.map((_, i) => ({ i, w: 0, h: 0 }))]).map((cells, ri) => (
          <div key={ri} style={{ display: "flex", gap: GAP }}>
            {cells.map(({ i, w, h }) => (
              <button
                key={i}
                type="button"
                onClick={() => setZoom(i)}
                aria-label={`훈련 현장 사진 ${i + 1} 크게 보기`}
                style={{
                  width: rows ? w : undefined,
                  height: rows ? h : undefined,
                  flexGrow: rows ? 0 : 1,
                  padding: 0,
                  border: "none",
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "var(--color-hairline-soft)",
                  cursor: "zoom-in",
                  display: "block",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={PHOTOS[i]}
                  alt={`훈련 현장 사진 ${i + 1}`}
                  loading="lazy"
                  onLoad={(e) => onImgLoad(i, e)}
                  style={{
                    width: "100%",
                    height: rows ? "100%" : "auto",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* 라이트박스 */}
      {zoom !== null && (
        <div
          onClick={() => setZoom(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.86)",
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
        >
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setZoom(null)}
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
            style={{ position: "relative", maxWidth: "min(94vw, 1100px)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PHOTOS[zoom]}
              alt={`훈련 현장 사진 ${zoom + 1}`}
              style={{
                display: "block",
                maxWidth: "100%",
                maxHeight: "84vh",
                width: "auto",
                height: "auto",
                margin: "0 auto",
                borderRadius: 10,
              }}
            />
            <NavButton dir="prev" onClick={() => go(-1)} />
            <NavButton dir="next" onClick={() => go(1)} />
            <p
              style={{
                color: "#fff",
                textAlign: "center",
                marginTop: 14,
                fontSize: 14,
              }}
            >
              {zoom + 1} / {PHOTOS.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function NavButton({
  dir,
  onClick,
}: {
  dir: "prev" | "next";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={dir === "prev" ? "이전 사진" : "다음 사진"}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={
        {
          position: "absolute",
          top: "50%",
          transform: "translateY(-50%)",
          [dir === "prev" ? "left" : "right"]: 10,
          width: 44,
          height: 44,
          display: "grid",
          placeItems: "center",
          borderRadius: 9999,
          border: "none",
          background: "rgba(255,255,255,0.92)",
          boxShadow: "0 4px 14px rgba(0,0,0,0.22)",
          cursor: "pointer",
          color: "var(--color-ink)",
        } as React.CSSProperties
      }
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d={dir === "prev" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
      </svg>
    </button>
  );
}
