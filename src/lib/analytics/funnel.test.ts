import { describe, it, expect } from "vitest";
import { conversionRate, viewBarPct, toCourseFunnel } from "./funnel";

describe("conversionRate", () => {
  it("조회 대비 신청 비율(%)을 반올림해 반환", () => {
    expect(conversionRate(5, 10)).toBe(50);
    expect(conversionRate(1, 3)).toBe(33);
  });
  it("조회가 0이면 0(0으로 나누기 방지)", () => {
    expect(conversionRate(0, 0)).toBe(0);
    expect(conversionRate(3, 0)).toBe(0);
  });
});

describe("viewBarPct", () => {
  it("최다 조회 대비 비율", () => {
    expect(viewBarPct(50, 100)).toBe(50);
    expect(viewBarPct(100, 100)).toBe(100);
  });
  it("최댓값이 0이면 0", () => {
    expect(viewBarPct(0, 0)).toBe(0);
  });
});

describe("toCourseFunnel", () => {
  const courses = [
    { id: "a", name: "목공 기초" },
    { id: "b", name: "집수리" },
  ];

  it("조회는 id로, 신청은 과정명으로 매칭해 전환율 산출", () => {
    const f = toCourseFunnel(courses, { a: 100, b: 50 }, { "목공 기초": 25, 집수리: 5 });
    const a = f.find((x) => x.id === "a")!;
    expect(a).toMatchObject({ views: 100, applies: 25, conversionPct: 25 });
    const b = f.find((x) => x.id === "b")!;
    expect(b).toMatchObject({ views: 50, applies: 5, conversionPct: 10 });
  });

  it("데이터 없는 과정은 0으로 채운다", () => {
    const f = toCourseFunnel(courses, {}, {});
    expect(f.every((x) => x.views === 0 && x.applies === 0 && x.conversionPct === 0)).toBe(true);
  });

  it("조회수 내림차순 정렬", () => {
    const f = toCourseFunnel(courses, { a: 10, b: 80 }, {});
    expect(f.map((x) => x.id)).toEqual(["b", "a"]);
  });

  it("조회 표본이 임계 이상일 때만 전환율을 신뢰(rateReliable)", () => {
    const f = toCourseFunnel(courses, { a: 100, b: 50 }, {});
    expect(f.find((x) => x.id === "a")!.rateReliable).toBe(true); // 100건 → 신뢰
    expect(f.find((x) => x.id === "b")!.rateReliable).toBe(false); // 50건 → 표본 적음
  });
});
