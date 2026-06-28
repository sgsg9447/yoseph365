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
