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

/** 상단 탭 = "전체" + 각 leaf(1:1). */
export type TabKey = "전체" | LeafCategory;
export const TABS: TabKey[] = ["전체", ...LEAF_CATEGORIES];

/** 어드민 드롭다운·카드 뱃지·공개 탭 라벨. */
export const LEAF_LABELS: Record<LeafCategory, string> = {
  집수리: "집수리과정",
  인테리어목공: "인테리어목공과정",
  인테리어필름: "인테리어필름과정",
  목공기능사: "기능사 · 목공기능사",
  도장기능사: "기능사 · 도장기능사",
};

/** 상단 탭 표시 라벨. */
export function tabLabel(tab: TabKey): string {
  return tab === "전체" ? "전체" : LEAF_LABELS[tab];
}

export function isLeafCategory(v: unknown): v is LeafCategory {
  return typeof v === "string" && (LEAF_CATEGORIES as readonly string[]).includes(v);
}

/** 활성 탭에 보일 사진만 거른다. */
export function photosForTab<T extends { category: LeafCategory }>(
  photos: T[],
  tab: TabKey,
): T[] {
  if (tab === "전체") return photos;
  return photos.filter((p) => p.category === tab);
}

/** 메인 노출 최대 장수. */
export const FEATURED_MAX = 6;
export function featuredLimitReached(currentCount: number): boolean {
  return currentCount >= FEATURED_MAX;
}

/** 저장 가능 여부 — 정확히 FEATURED_MAX장 선택했을 때만 저장 허용. */
export function canSaveFeatured(selectedCount: number): boolean {
  return selectedCount === FEATURED_MAX;
}

/**
 * 메인 노출 선택 토글. 이미 있으면 제거, 없으면 추가.
 * max에 도달한 상태에서 새로 추가하려 하면 변경 없이 같은 배열(ref)을 그대로 돌려준다.
 */
export function toggleSelection(
  selected: number[],
  id: number,
  max = FEATURED_MAX,
): number[] {
  if (selected.includes(id)) return selected.filter((x) => x !== id);
  if (selected.length >= max) return selected;
  return [...selected, id];
}
