// 훈련사진 갤러리 카테고리 모델 — 공개/어드민 공유 단일 소스.

/** 저장 단위(leaf). DB post.gallery_category 에 저장된다. */
export const LEAF_CATEGORIES = [
  "집수리",
  "인테리어목공",
  "인테리어필름",
  "목공기능사",
  "도장기능사",
] as const;
export type LeafCategory = (typeof LEAF_CATEGORIES)[number];

/** 사용자 화면 상단 탭. "전체"는 모든 카테고리를 모으는 가상 탭. */
export type TabKey =
  | "전체"
  | "집수리과정"
  | "인테리어목공과정"
  | "인테리어필름과정"
  | "기능사과정";

export const TABS: TabKey[] = [
  "전체",
  "집수리과정",
  "인테리어목공과정",
  "인테리어필름과정",
  "기능사과정",
];

/** 기능사 탭 하위 칩(leaf). */
export const GINEUNGSA_SUBS: LeafCategory[] = ["목공기능사", "도장기능사"];

const LEAF_TO_TAB: Record<LeafCategory, Exclude<TabKey, "전체">> = {
  집수리: "집수리과정",
  인테리어목공: "인테리어목공과정",
  인테리어필름: "인테리어필름과정",
  목공기능사: "기능사과정",
  도장기능사: "기능사과정",
};

/** 어드민 드롭다운·카드 뱃지용 라벨. */
export const LEAF_LABELS: Record<LeafCategory, string> = {
  집수리: "집수리과정",
  인테리어목공: "인테리어목공과정",
  인테리어필름: "인테리어필름과정",
  목공기능사: "기능사 · 목공기능사",
  도장기능사: "기능사 · 도장기능사",
};

export function leafToTab(leaf: LeafCategory): Exclude<TabKey, "전체"> {
  return LEAF_TO_TAB[leaf];
}

export function isLeafCategory(v: unknown): v is LeafCategory {
  return typeof v === "string" && (LEAF_CATEGORIES as readonly string[]).includes(v);
}

/** 활성 탭(+기능사 하위)에 보일 사진만 거른다. */
export function photosForTab<T extends { category: LeafCategory }>(
  photos: T[],
  tab: TabKey,
  sub?: LeafCategory | null,
): T[] {
  if (tab === "전체") return photos;
  if (tab === "기능사과정") {
    if (sub) return photos.filter((p) => p.category === sub);
    return photos.filter((p) => GINEUNGSA_SUBS.includes(p.category));
  }
  return photos.filter((p) => leafToTab(p.category) === tab);
}

/** 메인 노출 최대 장수. */
export const FEATURED_MAX = 6;
export function featuredLimitReached(currentCount: number): boolean {
  return currentCount >= FEATURED_MAX;
}
