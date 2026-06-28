# 어드민 훈련사진 모자이크 편집 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 어드민 훈련사진 업로드 시 업로드 전에 브라우저에서 원하는 영역을 드래그로 모자이크(픽셀화) 처리할 수 있게 한다.

**Architecture:** 픽셀화는 의존성 없는 순수 함수(`src/lib/image/pixelate.ts`)로 분리해 TDD로 검증한다. 편집기(`MosaicEditor`)는 canvas + Pointer 이벤트로 영역을 그리고 `toBlob`으로 편집본을 만든다. 업로더(`PhotoUploader`)는 "즉시 업로드"에서 "staging 후 일괄 업로드"로 바꾸고, 편집본이 있으면 원본 대신 올린다. 서버 액션·스키마·스토리지 라이브러리는 무변경.

**Tech Stack:** Next.js(App Router) client component, Canvas 2D API, `createImageBitmap`(EXIF), Pointer Events, vitest.

---

## File Structure
- `src/lib/image/pixelate.ts` (신규) — 순수 함수 `pixelate`, `defaultBlockSize`, 타입 `Rect`.
- `src/lib/image/pixelate.test.ts` (신규) — 단위테스트.
- `src/components/admin/MosaicEditor.tsx` (신규) — 편집기 오버레이.
- `src/app/admin/(dashboard)/photos/PhotoUploader.tsx` (수정) — staging 모델 + 편집기 연동.

서버 측(`actions.ts`, `lib/storage/*`, `validations/forms.ts`)은 변경하지 않는다.

---

## Task 1: 픽셀화 순수 함수 (TDD)

**Files:**
- Create: `src/lib/image/pixelate.ts`
- Test: `src/lib/image/pixelate.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/image/pixelate.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { pixelate, defaultBlockSize, type Rect } from "./pixelate";

describe("defaultBlockSize", () => {
  it("큰 이미지는 긴 변/64 비례", () => {
    expect(defaultBlockSize(640, 480)).toBe(10); // round(640/64)=10
  });
  it("작은 이미지는 하한 8px", () => {
    expect(defaultBlockSize(100, 50)).toBe(8); // round(100/64)=2 → max(8,2)=8
  });
});

describe("pixelate", () => {
  it("영역 전체가 한 블록이면 블록 평균색으로 채운다", () => {
    // 2x2, 그레이값 0/100/200/100 → 평균 100
    const data = new Uint8ClampedArray([
      0, 0, 0, 255, 100, 100, 100, 255,
      200, 200, 200, 255, 100, 100, 100, 255,
    ]);
    const rect: Rect = { x: 0, y: 0, w: 2, h: 2 };
    pixelate(data, 2, 2, rect, 2);
    for (let i = 0; i < 4; i++) {
      expect(data[i * 4]).toBe(100);
      expect(data[i * 4 + 1]).toBe(100);
      expect(data[i * 4 + 2]).toBe(100);
      expect(data[i * 4 + 3]).toBe(255);
    }
  });

  it("블록이 영역보다 작으면 블록별 평균", () => {
    // 4x1, blockSize 2 → 블록0=(0,100)avg50, 블록1=(50,150)avg100
    const data = new Uint8ClampedArray([
      0, 0, 0, 255, 100, 100, 100, 255,
      50, 50, 50, 255, 150, 150, 150, 255,
    ]);
    pixelate(data, 4, 1, { x: 0, y: 0, w: 4, h: 1 }, 2);
    expect(Array.from(data)).toEqual([
      50, 50, 50, 255, 50, 50, 50, 255,
      100, 100, 100, 255, 100, 100, 100, 255,
    ]);
  });

  it("영역 밖 픽셀은 건드리지 않는다", () => {
    // 4x1, rect는 우측 2픽셀만
    const data = new Uint8ClampedArray([
      10, 10, 10, 255, 20, 20, 20, 255,
      50, 50, 50, 255, 150, 150, 150, 255,
    ]);
    pixelate(data, 4, 1, { x: 2, y: 0, w: 2, h: 1 }, 2);
    expect(Array.from(data)).toEqual([
      10, 10, 10, 255, 20, 20, 20, 255, // 그대로
      100, 100, 100, 255, 100, 100, 100, 255, // 평균 100
    ]);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm vitest run src/lib/image/pixelate.test.ts`
Expected: FAIL — `pixelate`/`defaultBlockSize` 미존재.

- [ ] **Step 3: 최소 구현**

`src/lib/image/pixelate.ts`:

```ts
// 이미지 픽셀화(모자이크) 순수 함수. 의존성 없음 — 어디서든 import 가능.
export type Rect = { x: number; y: number; w: number; h: number };

/** 이미지 크기 비례 기본 블록 크기. 작은 사진도 가려지도록 하한 8px. */
export function defaultBlockSize(width: number, height: number): number {
  return Math.max(8, Math.round(Math.max(width, height) / 64));
}

/**
 * RGBA 픽셀 배열의 사각형 영역을 blockSize 단위 블록 평균색으로 채운다(in-place).
 * data: 길이 width*height*4 의 Uint8ClampedArray.
 */
export function pixelate(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  rect: Rect,
  blockSize: number,
): void {
  const x0 = Math.max(0, Math.floor(rect.x));
  const y0 = Math.max(0, Math.floor(rect.y));
  const x1 = Math.min(width, Math.floor(rect.x + rect.w));
  const y1 = Math.min(height, Math.floor(rect.y + rect.h));
  const bs = Math.max(1, Math.floor(blockSize));

  for (let by = y0; by < y1; by += bs) {
    for (let bx = x0; bx < x1; bx += bs) {
      const bxEnd = Math.min(bx + bs, x1);
      const byEnd = Math.min(by + bs, y1);
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      for (let y = by; y < byEnd; y++) {
        for (let x = bx; x < bxEnd; x++) {
          const i = (y * width + x) * 4;
          r += data[i]; g += data[i + 1]; b += data[i + 2]; a += data[i + 3];
          count++;
        }
      }
      if (count === 0) continue;
      const rr = Math.round(r / count);
      const gg = Math.round(g / count);
      const bb = Math.round(b / count);
      const aa = Math.round(a / count);
      for (let y = by; y < byEnd; y++) {
        for (let x = bx; x < bxEnd; x++) {
          const i = (y * width + x) * 4;
          data[i] = rr; data[i + 1] = gg; data[i + 2] = bb; data[i + 3] = aa;
        }
      }
    }
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm vitest run src/lib/image/pixelate.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: 커밋**

```bash
git add src/lib/image/pixelate.ts src/lib/image/pixelate.test.ts
git commit -m "feat: 이미지 픽셀화(모자이크) 순수 함수 + 테스트"
```

---

## Task 2: 편집기 오버레이 컴포넌트

**Files:**
- Create: `src/components/admin/MosaicEditor.tsx`

캔버스 인터랙션은 단위테스트가 비실용적 → 빌드/린트 통과 + Task 4 앱 검증으로 확인.

- [ ] **Step 1: 컴포넌트 작성**

`src/components/admin/MosaicEditor.tsx`:

```tsx
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
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onCancel(); }
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
        if (cancelled) { bitmap.close(); return; }
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
    return () => { cancelled = true; };
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
          img.data, dispW, dispH,
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

  useEffect(() => { if (ready) redraw(); }, [ready, redraw]);

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
    startRef.current = pos(e);
    setDragRect({ ...startRef.current, w: 0, h: 0 });
  }
  function onMove(e: React.PointerEvent) {
    if (!startRef.current) return;
    const p = pos(e);
    const s = startRef.current;
    setDragRect({
      x: Math.min(s.x, p.x), y: Math.min(s.y, p.y),
      w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y),
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
      if (!blob) { setError("편집본을 만들지 못했습니다."); setBusy(false); return; }
      onDone(blob);
    } catch {
      setError("처리 중 오류가 발생했습니다.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="모자이크 편집">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-hairline bg-surface-card shadow-pop">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-hairline">
          <h2 className="text-[16px] font-bold text-ink">모자이크 편집</h2>
          <button type="button" onClick={onCancel} aria-label="닫기" className="text-muted hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <div className="scrollbar-clean overflow-y-auto p-5">
          <p className="text-muted text-[13px] mb-3">가릴 부분을 드래그해서 사각형으로 지정하세요. 여러 곳을 지정할 수 있습니다.</p>
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
            <Button variant="outline" size="sm" type="button" disabled={busy || regions.length === 0}
              onClick={() => setRegions((p) => p.slice(0, -1))}>
              되돌리기
            </Button>
            <Button variant="outline" size="sm" type="button" disabled={busy || regions.length === 0}
              onClick={() => setRegions([])}>
              전체 지우기
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" type="button" disabled={busy} onClick={onCancel}>
              취소
            </Button>
            <Button variant="primary" size="sm" type="button" disabled={busy || !ready} onClick={apply}>
              {busy ? "적용 중…" : "적용"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 타입체크/린트 확인**

Run: `pnpm lint`
Expected: 새 파일 관련 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add src/components/admin/MosaicEditor.tsx
git commit -m "feat: 훈련사진 모자이크 편집기 컴포넌트(MosaicEditor)"
```

---

## Task 3: 업로더 staging 전환 + 편집기 연동

**Files:**
- Modify: `src/app/admin/(dashboard)/photos/PhotoUploader.tsx` (전체 교체)

- [ ] **Step 1: 컴포넌트 전체 교체**

`src/app/admin/(dashboard)/photos/PhotoUploader.tsx`:

```tsx
"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, X } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { validatePhotoFile } from "@/lib/storage/keys";
import { uploadToTarget } from "@/lib/storage/client";
import { createUploadTarget, addTrainingPhotos } from "./actions";
import { MosaicEditor } from "@/components/admin/MosaicEditor";

type Staged = {
  id: string;
  file: File;
  edited: Blob | null;
  previewUrl: string;
};

export function PhotoUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [staged, setStaged] = useState<Staged[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 언마운트 시 미리보기 URL 정리
  const stagedRef = useRef<Staged[]>([]);
  stagedRef.current = staged;
  useEffect(() => () => stagedRef.current.forEach((s) => URL.revokeObjectURL(s.previewUrl)), []);

  function addFiles(fileList: FileList | null) {
    setError(null);
    if (!fileList || fileList.length === 0) return;
    const incoming = Array.from(fileList);
    for (const f of incoming) {
      const msg = validatePhotoFile(f);
      if (msg) { setError(msg); return; }
    }
    setStaged((prev) => [
      ...prev,
      ...incoming.map((f) => ({
        id: crypto.randomUUID(),
        file: f,
        edited: null as Blob | null,
        previewUrl: URL.createObjectURL(f),
      })),
    ]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeItem(id: string) {
    setStaged((prev) => {
      const item = prev.find((s) => s.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((s) => s.id !== id);
    });
  }

  function handleEditDone(id: string, blob: Blob) {
    setStaged((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        URL.revokeObjectURL(s.previewUrl);
        return { ...s, edited: blob, previewUrl: URL.createObjectURL(blob) };
      }),
    );
    setEditingId(null);
  }

  async function uploadAll() {
    if (staged.length === 0 || busy) return;
    setError(null);
    setBusy(true);
    try {
      const photos: { key: string; label: string }[] = [];
      for (const s of staged) {
        const up = s.edited ?? s.file;
        const msg = validatePhotoFile(up);
        if (msg) { setError(msg); setBusy(false); return; }
        const t = await createUploadTarget(up.type);
        if (!t.ok) { setError(t.error); setBusy(false); return; }
        await uploadToTarget(t.target, up);
        photos.push({ key: t.target.key, label: s.file.name.replace(/\.[^.]+$/, "") });
      }
      const res = await addTrainingPhotos({ photos });
      if (!res.ok) { setError(res.error); setBusy(false); return; }
      staged.forEach((s) => URL.revokeObjectURL(s.previewUrl));
      setStaged([]);
      router.refresh();
    } catch {
      setError("업로드 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  const editing = staged.find((s) => s.id === editingId) ?? null;

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
        disabled={busy}
        className={`w-full border-2 border-dashed rounded-lg py-12 flex flex-col items-center justify-center gap-2 bg-primary-softer disabled:opacity-60 ${drag ? "border-primary" : "border-primary-border"}`}
      >
        <ImageIcon size={28} className="text-primary" />
        <p className="text-body-strong text-[15px] font-bold">사진을 끌어다 놓거나 클릭해서 추가</p>
        <p className="text-muted text-[13px]">JPG·PNG 최대 10MB · 업로드 전 모자이크 편집 가능</p>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        hidden
        onChange={(e) => addFiles(e.target.files)}
      />

      {error && <p className="text-error text-[13px] mt-2">{error}</p>}

      {staged.length > 0 && (
        <>
          <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {staged.map((s) => (
              <li key={s.id} className="rounded-lg border border-hairline overflow-hidden bg-surface-card">
                <div className="relative aspect-[4/3] bg-[#0c0c0c]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.previewUrl} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeItem(s.id)}
                    disabled={busy}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 inline-flex items-center justify-center hover:bg-error-soft hover:text-error"
                    aria-label="제거"
                  >
                    <X size={14} />
                  </button>
                  {s.edited && (
                    <span className="absolute bottom-2 left-2 text-[11px] font-semibold text-white bg-primary/90 rounded px-1.5 py-0.5">
                      모자이크 적용됨
                    </span>
                  )}
                </div>
                <div className="p-2">
                  <Button variant="outline" size="sm" type="button" fullWidth disabled={busy}
                    onClick={() => setEditingId(s.id)}>
                    모자이크 편집
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex justify-end">
            <Button variant="primary" size="sm" type="button" disabled={busy} onClick={uploadAll}>
              {busy ? "업로드 중…" : `${staged.length}장 업로드`}
            </Button>
          </div>
        </>
      )}

      {editing && (
        <MosaicEditor
          file={editing.file}
          onDone={(blob) => handleEditDone(editing.id, blob)}
          onCancel={() => setEditingId(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: 린트 확인**

Run: `pnpm lint`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add "src/app/admin/(dashboard)/photos/PhotoUploader.tsx"
git commit -m "feat: 훈련사진 업로드 전 모자이크 편집 staging 흐름"
```

---

## Task 4: 전체 검증

**Files:** 없음(검증 + 필요 시 수정).

- [ ] **Step 1: 테스트 전체**

Run: `pnpm test`
Expected: 기존 211 + 신규 5 = 216 PASS.

- [ ] **Step 2: 빌드**

Run: `pnpm build`
Expected: 성공.

- [ ] **Step 3: dev 앱 수동 검증**

`pnpm dev` 후 `/admin/photos`:
1. 사진 선택 → 썸네일 staging 표시(즉시 업로드 안 됨).
2. `모자이크 편집` → 편집기에서 드래그로 영역 지정 → 미리보기 모자이크 → `적용`.
3. 썸네일에 "모자이크 적용됨" 표시 + 미리보기 갱신.
4. `N장 업로드` → 성공 후 목록 갱신.
5. 공개 `/photos`에서 모자이크된 사진 확인.
6. (가능하면) 세로 휴대폰 사진으로 EXIF 회전 정상 확인.

- [ ] **Step 4: 스펙 검증 항목 충족 확인 후 마무리**

문제 발견 시 해당 Task로 돌아가 수정·재검증.

---

## Self-Review 결과
- **스펙 커버리지:** 수동 영역 지정(Task2 pointer), 모자이크 1종(Task1 pixelate), 미니멀 편집기 4버튼(Task2), 업로드 전 staging(Task3), EXIF/JPEG/재검증/URL 정리(Task2·3) 모두 태스크에 매핑됨.
- **Placeholder:** 없음(모든 코드 실물).
- **타입 일관성:** `Rect`는 `pixelate.ts`에서 정의·전역 재사용. `pixelate(data,width,height,rect,blockSize)`/`defaultBlockSize(w,h)` 시그니처 Task1·2 일치. `Staged` 타입 Task3 내부 일관.
