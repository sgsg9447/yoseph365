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
