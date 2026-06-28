import { describe, it, expect } from "vitest";
import {
  LEAF_CATEGORIES,
  TABS,
  leafToTab,
  isLeafCategory,
  photosForTab,
  featuredLimitReached,
  FEATURED_MAX,
} from "./categories";

describe("LEAF_CATEGORIES / TABS", () => {
  it("leaf는 5종", () => {
    expect(LEAF_CATEGORIES).toEqual([
      "집수리",
      "인테리어목공",
      "인테리어필름",
      "목공기능사",
      "도장기능사",
    ]);
  });
  it("상단 탭은 전체 포함 5개, 전체가 처음", () => {
    expect(TABS[0]).toBe("전체");
    expect(TABS).toContain("기능사과정");
    expect(TABS).toHaveLength(5);
  });
});

describe("leafToTab", () => {
  it("기능사 두 leaf는 기능사과정으로 묶인다", () => {
    expect(leafToTab("목공기능사")).toBe("기능사과정");
    expect(leafToTab("도장기능사")).toBe("기능사과정");
  });
  it("나머지는 1:1 매핑", () => {
    expect(leafToTab("집수리")).toBe("집수리과정");
    expect(leafToTab("인테리어목공")).toBe("인테리어목공과정");
    expect(leafToTab("인테리어필름")).toBe("인테리어필름과정");
  });
});

describe("isLeafCategory", () => {
  it("허용값만 true", () => {
    expect(isLeafCategory("집수리")).toBe(true);
    expect(isLeafCategory("기능사과정")).toBe(false);
    expect(isLeafCategory(null)).toBe(false);
  });
});

describe("photosForTab", () => {
  const photos = [
    { category: "집수리" as const, url: "a" },
    { category: "목공기능사" as const, url: "b" },
    { category: "도장기능사" as const, url: "c" },
    { category: "인테리어필름" as const, url: "d" },
  ];
  it("전체는 모두 반환", () => {
    expect(photosForTab(photos, "전체")).toHaveLength(4);
  });
  it("일반 탭은 해당 leaf만", () => {
    expect(photosForTab(photos, "집수리과정").map((p) => p.url)).toEqual(["a"]);
  });
  it("기능사과정은 두 leaf 모두", () => {
    expect(photosForTab(photos, "기능사과정").map((p) => p.url)).toEqual(["b", "c"]);
  });
  it("기능사 하위 sub 지정 시 해당 leaf만", () => {
    expect(photosForTab(photos, "기능사과정", "도장기능사").map((p) => p.url)).toEqual(["c"]);
  });
});

describe("featuredLimitReached", () => {
  it("FEATURED_MAX는 6", () => {
    expect(FEATURED_MAX).toBe(6);
  });
  it("6 이상이면 true", () => {
    expect(featuredLimitReached(5)).toBe(false);
    expect(featuredLimitReached(6)).toBe(true);
    expect(featuredLimitReached(7)).toBe(true);
  });
});
