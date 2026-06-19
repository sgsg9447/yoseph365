import { describe, it, expect } from "vitest";
import { parseCsvList } from "./parse";

describe("parseCsvList", () => {
  it("쉼표로 나누고 trim·빈 항목 제거", () => {
    expect(parseCsvList("벽설치, 천장설치 ,, 타일")).toEqual(["벽설치", "천장설치", "타일"]);
  });
  it("빈 문자열은 빈 배열", () => {
    expect(parseCsvList("  ")).toEqual([]);
  });
});
