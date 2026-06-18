import { describe, it, expect } from "vitest";
import { parseRows, parseLines, makeDefaultBanner } from "./banner";

describe("parseRows", () => {
  it("'항목 | 가격' 줄을 [label, price]로 파싱", () => {
    expect(parseRows("수강료 | 0원\n교재비 | 5만원")).toEqual([
      ["수강료", "0원"], ["교재비", "5만원"],
    ]);
  });
  it("빈 줄/공백 줄 무시", () => {
    expect(parseRows("a | 1\n\n  \nb | 2")).toEqual([["a", "1"], ["b", "2"]]);
  });
  it("구분자 없으면 가격은 빈 문자열", () => {
    expect(parseRows("항목만")).toEqual([["항목만", ""]]);
  });
});

describe("parseLines", () => {
  it("줄 단위 배열, 빈 줄 제거", () => {
    expect(parseLines("첫째\n둘째\n\n셋째")).toEqual(["첫째", "둘째", "셋째"]);
  });
});

describe("makeDefaultBanner", () => {
  it("center/sky 기본 배너를 고유 id로 생성", () => {
    const b = makeDefaultBanner();
    expect(b.mode).toBe("template");
    expect(b.template).toBe("center");
    expect(b.tint).toBe("sky");
    expect(b.active).toBe(true);
    expect(typeof b.id).toBe("string");
  });
});
