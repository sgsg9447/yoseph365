"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { defaultBlockSize, pixelate, type Rect } from "@/lib/image/pixelate";

type Props = {
  file: File;
  onDone: (blob: Blob) => void;
  onCancel: () => void;
};

const MAX_DISPLAY_W = 1000; // 캔버스 내부 해상도 상한
const MIN_DRAG_PX = 6; // 이보다 작은 드래그(오클릭)는 무시

export function MosaicEditor({ file, onDone, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceRef = useRef<HTMLCanvasElement | null>(null); // 원본 해상도 픽셀
  const dispRef = useRef({ w: 0, h: 0, natPerDisp: 1 });
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const [ready, setReady] = useState(false);
  const [regions, setRegions] = useState<Rect[]>([]); // 원본 좌표계
  const [dragRect, setDragRect] = useState<Rect | null>(null); // 표시 좌표계
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Esc 닫기 + body 스크롤 락 (Modal과 동일 패턴)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onCancel]);

  // 파일 → 원본 캔버스 (EXIF 회전 방어)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
        if (cancelled) {
          bitmap.close();
          return;
        }
        const src = document.createElement("canvas");
        src.width = bitmap.width;
        src.height = bitmap.height;
        src.getContext("2d")!.drawImage(bitmap, 0, 0);
        bitmap.close();
        sourceRef.current = src;
        setReady(true);
      } catch {
        setError("이미지를 불러오지 못했습니다.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file]);

  // 미리보기 다시 그리기
  const redraw = useCallback(() => {
    const src = sourceRef.current;
    const canvas = canvasRef.current;
    if (!src || !canvas) return;

    const scale = src.width > MAX_DISPLAY_W ? MAX_DISPLAY_W / src.width : 1;
    const dispW = Math.max(1, Math.round(src.width * scale));
    const dispH = Math.max(1, Math.round(src.height * scale));
    const natPerDisp = src.width / dispW;
    dispRef.current = { w: dispW, h: dispH, natPerDisp };

    canvas.width = dispW;
    canvas.height = dispH;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(src, 0, 0, dispW, dispH);

    if (regions.length > 0) {
      const img = ctx.getImageData(0, 0, dispW, dispH);
      const natBlock = defaultBlockSize(src.width, src.height);
      const dispBlock = Math.max(1, Math.round(natBlock / natPerDisp));
      for (const r of regions) {
        pixelate(
          img.data,
          dispW,
          dispH,
          { x: r.x / natPerDisp, y: r.y / natPerDisp, w: r.w / natPerDisp, h: r.h / natPerDisp },
          dispBlock,
        );
      }
      ctx.putImageData(img, 0, 0);
    }

    if (dragRect) {
      ctx.strokeStyle = "#1d4ed8";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(dragRect.x, dragRect.y, dragRect.w, dragRect.h);
      ctx.setLineDash([]);
    }
  }, [regions, dragRect]);

  useEffect(() => {
    if (ready) redraw();
  }, [ready, redraw]);

  function pos(e: React.PointerEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  }

  function onDown(e: React.PointerEvent) {
    if (!ready || busy) return;
    canvasRef.current!.setPointerCapture(e.pointerId);
    const p = pos(e);
    startRef.current = p;
    setDragRect({ x: p.x, y: p.y, w: 0, h: 0 });
  }

  function onMove(e: React.PointerEvent) {
    const s = startRef.current;
    if (!s) return;
    const p = pos(e);
    setDragRect({
      x: Math.min(s.x, p.x),
      y: Math.min(s.y, p.y),
      w: Math.abs(p.x - s.x),
      h: Math.abs(p.y - s.y),
    });
  }

  function onUp() {
    const d = dragRect;
    startRef.current = null;
    setDragRect(null);
    if (!d || d.w < MIN_DRAG_PX || d.h < MIN_DRAG_PX) return;
    const k = dispRef.current.natPerDisp;
    setRegions((prev) => [...prev, { x: d.x * k, y: d.y * k, w: d.w * k, h: d.h * k }]);
  }

  async function apply() {
    const src = sourceRef.current;
    if (!src) return;
    setBusy(true);
    try {
      const out = document.createElement("canvas");
      out.width = src.width;
      out.height = src.height;
      const ctx = out.getContext("2d")!;
      ctx.drawImage(src, 0, 0);
      if (regions.length > 0) {
        const img = ctx.getImageData(0, 0, src.width, src.height);
        const block = defaultBlockSize(src.width, src.height);
        for (const r of regions) pixelate(img.data, src.width, src.height, r, block);
        ctx.putImageData(img, 0, 0);
      }
      const blob = await new Promise<Blob | null>((res) =>
        out.toBlob((b) => res(b), "image/jpeg", 0.9),
      );
      if (!blob) {
        setError("편집본을 만들지 못했습니다.");
        setBusy(false);
        return;
      }
      onDone(blob);
    } catch {
      setError("처리 중 오류가 발생했습니다.");
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="모자이크 편집"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-hairline bg-surface-card shadow-pop">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-hairline">
          <h2 className="text-[16px] font-bold text-ink">모자이크 편집</h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="닫기"
            className="text-muted hover:text-ink"
          >
            <X size={20} />
          </button>
        </div>

        <div className="scrollbar-clean overflow-y-auto p-5">
          <p className="text-muted text-[13px] mb-3">
            가릴 부분을 드래그해서 사각형으로 지정하세요. 여러 곳을 지정할 수 있습니다.
          </p>
          <div className="flex justify-center bg-[#0c0c0c] rounded-lg overflow-hidden">
            {ready ? (
              <canvas
                ref={canvasRef}
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                className="max-w-full h-auto touch-none cursor-crosshair"
              />
            ) : (
              <div className="py-20 text-white/70 text-[14px]">{error ?? "불러오는 중…"}</div>
            )}
          </div>
          {error && ready && <p className="text-error text-[13px] mt-2">{error}</p>}
        </div>

        <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-hairline">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              disabled={busy || regions.length === 0}
              onClick={() => setRegions((p) => p.slice(0, -1))}
            >
              되돌리기
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              disabled={busy || regions.length === 0}
              onClick={() => setRegions([])}
            >
              전체 지우기
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" type="button" disabled={busy} onClick={onCancel}>
              취소
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="button"
              disabled={busy || !ready}
              onClick={apply}
            >
              {busy ? "적용 중…" : "적용"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
