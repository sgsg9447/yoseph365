import { describe, it, expect } from "vitest";
import {
  BASE_FONT_SIZE,
  MIN_FONT_SIZE,
  MAX_FONT_SIZE,
  parseFontSize,
  stepFontSize,
} from "./font-size";

describe("parseFontSize", () => {
  it("'20px' → 20", () => {
    expect(parseFontSize("20px")).toBe(20);
  });
  it("값이 없으면 기본 크기", () => {
    expect(parseFontSize(undefined)).toBe(BASE_FONT_SIZE);
  });
  it("숫자로 못 읽으면 기본 크기", () => {
    expect(parseFontSize("abc")).toBe(BASE_FONT_SIZE);
  });
});

describe("stepFontSize", () => {
  it("+1 단계 키운다", () => {
    expect(stepFontSize(16, 1)).toBe(17);
  });
  it("-1 단계 줄인다", () => {
    expect(stepFontSize(16, -1)).toBe(15);
  });
  it("최대값을 넘지 않는다", () => {
    expect(stepFontSize(MAX_FONT_SIZE, 1)).toBe(MAX_FONT_SIZE);
  });
  it("최소값 아래로 내려가지 않는다", () => {
    expect(stepFontSize(MIN_FONT_SIZE, -1)).toBe(MIN_FONT_SIZE);
  });
});
