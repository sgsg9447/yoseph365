import { describe, it, expect } from "vitest";
import {
  LEAF_CATEGORIES,
  TABS,
  tabLabel,
  isLeafCategory,
  photosForTab,
  featuredLimitReached,
  FEATURED_MAX,
  toggleSelection,
  canSaveFeatured,
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
  it("상단 탭은 전체 + 각 leaf (6개), 전체가 처음", () => {
    expect(TABS[0]).toBe("전체");
    expect(TABS).toHaveLength(6);
    expect(TABS).toContain("목공기능사");
    expect(TABS).toContain("도장기능사");
  });
});

describe("tabLabel", () => {
  it("전체는 그대로", () => {
    expect(tabLabel("전체")).toBe("전체");
  });
  it("기능사 leaf는 '기능사 · ' 접두사 라벨", () => {
    expect(tabLabel("목공기능사")).toBe("기능사 · 목공기능사");
    expect(tabLabel("도장기능사")).toBe("기능사 · 도장기능사");
  });
  it("나머지 leaf는 '과정' 라벨", () => {
    expect(tabLabel("집수리")).toBe("집수리과정");
    expect(tabLabel("인테리어목공")).toBe("인테리어목공과정");
    expect(tabLabel("인테리어필름")).toBe("인테리어필름과정");
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
  it("leaf 탭은 해당 카테고리만", () => {
    expect(photosForTab(photos, "집수리").map((p) => p.url)).toEqual(["a"]);
    expect(photosForTab(photos, "목공기능사").map((p) => p.url)).toEqual(["b"]);
    expect(photosForTab(photos, "도장기능사").map((p) => p.url)).toEqual(["c"]);
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

describe("toggleSelection", () => {
  it("없으면 추가(맨 뒤)", () => {
    expect(toggleSelection([1, 2], 3, 6)).toEqual([1, 2, 3]);
  });
  it("있으면 제거", () => {
    expect(toggleSelection([1, 2, 3], 2, 6)).toEqual([1, 3]);
  });
  it("max에 도달했으면 추가 안 하고 같은 배열(ref) 반환", () => {
    const full = [1, 2, 3, 4, 5, 6];
    expect(toggleSelection(full, 7, 6)).toBe(full);
  });
  it("max여도 이미 있는 건 제거 가능", () => {
    expect(toggleSelection([1, 2, 3, 4, 5, 6], 3, 6)).toEqual([1, 2, 4, 5, 6]);
  });
});

describe("canSaveFeatured", () => {
  it("정확히 FEATURED_MAX(6)장일 때만 true", () => {
    expect(canSaveFeatured(6)).toBe(true);
  });
  it("6장 미만은 false", () => {
    expect(canSaveFeatured(0)).toBe(false);
    expect(canSaveFeatured(5)).toBe(false);
  });
  it("6장 초과는 false", () => {
    expect(canSaveFeatured(7)).toBe(false);
  });
});
