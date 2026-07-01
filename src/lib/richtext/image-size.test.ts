import { describe, it, expect } from "vitest";
import { nextWidthPercent, MIN_IMAGE_WIDTH, MAX_IMAGE_WIDTH } from "./image-size";

describe("nextWidthPercent", () => {
  it("드래그한 픽셀을 컨테이너 대비 %로 변환한다", () => {
    // 200px에서 +200px, 컨테이너 800px → 400/800 = 50%
    expect(nextWidthPercent(200, 200, 800)).toBe(50);
  });

  it("정수 %로 반올림한다", () => {
    // 300/800 = 37.5% → 38%
    expect(nextWidthPercent(200, 100, 800)).toBe(38);
  });

  it("최대 100%로 제한한다", () => {
    expect(nextWidthPercent(700, 400, 800)).toBe(MAX_IMAGE_WIDTH);
  });

  it("최소 10%로 제한한다", () => {
    expect(nextWidthPercent(100, -300, 800)).toBe(MIN_IMAGE_WIDTH);
  });
});
