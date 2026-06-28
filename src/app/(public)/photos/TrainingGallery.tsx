"use client";

// 훈련사진 갤러리 — 상단 탭(전체/집수리/인테리어목공/인테리어필름/기능사) + 기능사 하위칩.
// 비율을 URL 키로 보관해 탭 전환 시에도 justified 배치가 유지된다. 클릭 시 확대.

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import {
  TABS,
  GINEUNGSA_SUBS,
  LEAF_LABELS,
  photosForTab,
  type TabKey,
  type LeafCategory,
} from "@/lib/gallery/categories";
import type { GalleryPhoto } from "@/lib/queries/photos";

const GAP = 10;
const FALLBACK_RATIO = 1.4;
const SINGLE_COL_BP = 560;

type Cell = { i: number; w: number; h: number };

function buildRows(ratios: number[], containerW: number, targetH: number): Cell[][] {
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

export function TrainingGallery({ photos }: { photos: GalleryPhoto[] }) {
  const [tab, setTab] = useState<TabKey>("전체");
  const [sub, setSub] = useState<LeafCategory | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [ratioByUrl, setRatioByUrl] = useState<Record<string, number>>({});
  const [zoom, setZoom] = useState<number | null>(null);

  const visible = photosForTab(photos, tab, tab === "기능사과정" ? sub : null);
  const urls = visible.map((p) => p.url);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onImgLoad = useCallback(
    (url: string, e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      const r = img.naturalWidth / img.naturalHeight;
      setRatioByUrl((prev) =>
        Math.abs((prev[url] ?? -1) - r) < 0.001 ? prev : { ...prev, [url]: r },
      );
    },
    [],
  );

  const ratios = urls.map((u) => ratioByUrl[u] ?? FALLBACK_RATIO);
  const targetH = width < 900 ? 200 : 240;
  const rows =
    width > 0
      ? width < SINGLE_COL_BP
        ? ratios.map((r, i) => [{ i, w: width, h: width / r }])
        : buildRows(ratios, width, targetH)
      : null;

  const go = useCallback(
    (d: number) => setZoom((p) => (p === null ? p : (p + d + urls.length) % urls.length)),
    [urls.length],
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

  function selectTab(t: TabKey) {
    setTab(t);
    setSub(null);
    setZoom(null);
  }

  return (
    <div>
      {/* 상단 탭 */}
      <div
        role="tablist"
        aria-label="훈련사진 분류"
        style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 14 }}
      >
        {TABS.map((t) => (
          <Chip key={t} active={t === tab} onClick={() => selectTab(t)}>
            {t}
          </Chip>
        ))}
      </div>

      {/* 기능사 하위 칩 */}
      {tab === "기능사과정" && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <Chip small active={sub === null} onClick={() => setSub(null)}>
            전체
          </Chip>
          {GINEUNGSA_SUBS.map((s) => (
            <Chip key={s} small active={sub === s} onClick={() => setSub(s)}>
              {LEAF_LABELS[s].replace("기능사 · ", "")}
            </Chip>
          ))}
        </div>
      )}

      {urls.length === 0 ? (
        <p className="text-muted text-[15px] text-center" style={{ padding: "40px 0" }}>
          이 분류에는 아직 등록된 사진이 없습니다.
        </p>
      ) : (
        <div ref={containerRef}>
          <div style={{ display: "flex", flexDirection: "column", gap: GAP }}>
            {(rows ?? [urls.map((_, i) => ({ i, w: 0, h: 0 }))]).map((cells, ri) => (
              <div key={ri} style={{ display: "flex", gap: GAP }}>
                {cells.map(({ i, w, h }) => (
                  <button
                    key={urls[i]}
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
                      src={urls[i]}
                      alt={`훈련 현장 사진 ${i + 1}`}
                      loading="lazy"
                      onLoad={(e) => onImgLoad(urls[i], e)}
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
        </div>
      )}

      {/* 라이트박스 */}
      {zoom !== null && urls[zoom] && (
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
          <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", maxWidth: "min(94vw, 1100px)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={urls[zoom]}
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
            <p style={{ color: "#fff", textAlign: "center", marginTop: 14, fontSize: 14 }}>
              {zoom + 1} / {urls.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({
  children,
  active,
  small,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  small?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="whitespace-nowrap font-semibold transition active:scale-[0.98]"
      style={{
        height: small ? 38 : 44,
        padding: small ? "0 16px" : "0 20px",
        fontSize: small ? 14 : 15.5,
        borderRadius: 9999,
        border: active ? "1px solid var(--color-ink)" : "1px solid var(--color-hairline-strong)",
        background: active ? "var(--color-ink)" : "transparent",
        color: active ? "#fff" : "var(--color-ink)",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function NavButton({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
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
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={dir === "prev" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
      </svg>
    </button>
  );
}
