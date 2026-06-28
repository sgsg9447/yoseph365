# 훈련사진 카테고리 탭 + 메인 노출 선택 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공개 `/photos`를 과정별 탭 갤러리로 바꾸고, 어드민 업로드에 카테고리·메인노출 선택을 추가하며, 기존 DB 훈련사진을 새 134장으로 교체한다.

**Architecture:** `post(category='훈련사진')` 행에 `gallery_category`(leaf 5종)·`is_featured` 컬럼을 추가한다. 탭 구조·라벨·필터는 신규 `src/lib/gallery/categories.ts` 순수 모듈에 모아 공개/어드민이 공유한다. 메인(홈)의 6장은 정적 하드코딩에서 `is_featured` 기반 DB 조회로 전환한다. 사진 교체는 1회성 서비스롤 스크립트로 프로덕션에 적용한다.

**Tech Stack:** Next.js(App Router)·TypeScript·Tailwind·Supabase(Postgres+Storage)·zod·vitest. 이미지 축소는 어드민 업로드 시 브라우저 canvas, 일괄 교체 시 macOS `sips`.

**스펙:** `docs/superpowers/specs/2026-06-28-training-photo-categories-design.md`

---

## File Structure

신규:
- `src/lib/gallery/categories.ts` — leaf/탭 모델, 라벨, `photosForTab`, `FEATURED_MAX`, `featuredLimitReached`
- `src/lib/gallery/categories.test.ts` — 위 순수 함수 테스트
- `src/app/admin/(dashboard)/photos/FeaturedToggle.tsx` — 메인 노출 토글(client)
- `src/app/admin/(dashboard)/photos/PhotoGrid.tsx` — 카테고리 필터 + 그리드(client)
- `src/lib/storage/downscale.ts` — 브라우저 canvas 이미지 축소
- `scripts/replace-training-photos.mjs` — 기존 삭제 + 신규 업로드(서비스롤, 1회성)

변경:
- `supabase/migrations/20260628120000_post_gallery_category_featured.sql` (신규 마이그레이션)
- `src/lib/supabase/database.types.ts` — post Row/Insert/Update
- `src/lib/validations/forms.ts` (+ `forms.test.ts`)
- `src/lib/queries/photos.ts` — 공개 카테고리 반환 + featured 조회
- `src/lib/queries/admin.ts` — `getTrainingPhotos` 반환(category·isFeatured·count)
- `src/app/(public)/photos/page.tsx`, `TrainingGallery.tsx`
- `src/components/sections/SocialProof.tsx`, `src/app/(public)/page.tsx`
- `src/app/admin/(dashboard)/photos/page.tsx`, `PhotoUploader.tsx`, `actions.ts`

**테스트 방침(프로젝트 관행):** 순수 lib 함수·zod 스키마는 vitest로 TDD한다. 쿼리(Supabase 호출)·React 컴포넌트·canvas는 기존 코드베이스처럼 단위 테스트하지 않고 타입체크·빌드·로컬 수동 검증으로 확인한다.

---

### Task 1: 카테고리 모델 (순수 모듈 + 테스트)

**Files:**
- Create: `src/lib/gallery/categories.ts`
- Test: `src/lib/gallery/categories.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/gallery/categories.test.ts`:
```ts
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
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test src/lib/gallery/categories.test.ts`
Expected: FAIL ("Cannot find module './categories'")

- [ ] **Step 3: 최소 구현**

`src/lib/gallery/categories.ts`:
```ts
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
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm test src/lib/gallery/categories.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/lib/gallery/categories.ts src/lib/gallery/categories.test.ts
git commit -m "feat: 훈련사진 갤러리 카테고리 모델(leaf·탭·필터) 추가"
```

---

### Task 2: 마이그레이션 + DB 타입

**Files:**
- Create: `supabase/migrations/20260628120000_post_gallery_category_featured.sql`
- Modify: `src/lib/supabase/database.types.ts:562-595` (post Row/Insert/Update)

- [ ] **Step 1: 마이그레이션 작성**

`supabase/migrations/20260628120000_post_gallery_category_featured.sql`:
```sql
-- 훈련사진 갤러리: leaf 카테고리 + 메인 노출 플래그.
-- gallery_category 는 nullable text(허용값은 앱 zod 에서 검증). is_featured 기본 false.
alter table post
  add column if not exists gallery_category text,
  add column if not exists is_featured boolean not null default false;

-- 메인 노출 사진 최신순 조회 가속(선택).
create index if not exists post_featured_idx
  on post (is_featured, created_at desc)
  where category = '훈련사진' and is_deleted = false;
```

- [ ] **Step 2: DB 타입 수정**

`src/lib/supabase/database.types.ts` post 블록의 Row/Insert/Update에 두 필드를 추가한다.

Row(`images: string[]` 다음 줄에 추가):
```ts
          gallery_category: string | null
          is_featured: boolean
```
Insert(`images?: string[]` 다음 줄에 추가):
```ts
          gallery_category?: string | null
          is_featured?: boolean
```
Update(`images?: string[]` 다음 줄에 추가):
```ts
          gallery_category?: string | null
          is_featured?: boolean
```

- [ ] **Step 3: 타입체크**

Run: `pnpm exec tsc --noEmit`
Expected: 에러 없음(post 타입에 새 필드 인식)

- [ ] **Step 4: 커밋**

```bash
git add supabase/migrations/20260628120000_post_gallery_category_featured.sql src/lib/supabase/database.types.ts
git commit -m "feat: post에 gallery_category·is_featured 컬럼 + 타입"
```

---

### Task 3: zod 스키마 (업로드 카테고리 + 메인 토글)

**Files:**
- Modify: `src/lib/validations/forms.ts:205-217` (trainingPhotoAddSchema) + 끝에 featuredToggleSchema 추가
- Modify: `src/lib/validations/forms.test.ts:311-330` (기존 trainingPhotoAddSchema 테스트 갱신 + 신규)

- [ ] **Step 1: 실패하는 테스트로 갱신**

`src/lib/validations/forms.test.ts` 상단 import에 `featuredToggleSchema` 추가:
```ts
import {
  // ...기존 import 유지...
  trainingPhotoAddSchema,
  featuredToggleSchema,
} from "./forms";
```
`describe("trainingPhotoAddSchema", ...)` 블록 전체를 아래로 교체:
```ts
describe("trainingPhotoAddSchema", () => {
  const ok = {
    galleryCategory: "집수리",
    photos: [{ key: "a.jpg", label: "현장" }],
  };
  it("카테고리+사진이 있으면 통과", () => {
    expect(trainingPhotoAddSchema.safeParse(ok).success).toBe(true);
  });
  it("카테고리 누락은 실패", () => {
    const { galleryCategory, ...rest } = ok;
    void galleryCategory;
    expect(trainingPhotoAddSchema.safeParse(rest).success).toBe(false);
  });
  it("허용 외 카테고리는 실패", () => {
    expect(
      trainingPhotoAddSchema.safeParse({ ...ok, galleryCategory: "기능사과정" }).success,
    ).toBe(false);
  });
  it("사진이 없으면 실패", () => {
    expect(trainingPhotoAddSchema.safeParse({ ...ok, photos: [] }).success).toBe(false);
  });
  it("key 없으면 실패", () => {
    expect(
      trainingPhotoAddSchema.safeParse({ ...ok, photos: [{ label: "x" }] }).success,
    ).toBe(false);
  });
});

describe("featuredToggleSchema", () => {
  it("정상 입력 통과", () => {
    expect(featuredToggleSchema.safeParse({ id: 1, on: true }).success).toBe(true);
  });
  it("id가 양의 정수가 아니면 실패", () => {
    expect(featuredToggleSchema.safeParse({ id: 0, on: true }).success).toBe(false);
  });
  it("on이 불리언이 아니면 실패", () => {
    expect(featuredToggleSchema.safeParse({ id: 1, on: "yes" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test src/lib/validations/forms.test.ts`
Expected: FAIL (`featuredToggleSchema` 미정의, 카테고리 검증 없음)

- [ ] **Step 3: 스키마 구현**

`src/lib/validations/forms.ts` 상단 import에 추가:
```ts
import { LEAF_CATEGORIES } from "@/lib/gallery/categories";
```
`trainingPhotoAddSchema`를 아래로 교체:
```ts
// 관리자 — 훈련사진 추가(업로드 완료된 객체 키 목록 + 카테고리)
export const trainingPhotoAddSchema = z.object({
  galleryCategory: z.enum(LEAF_CATEGORIES),
  photos: z
    .array(
      z.object({
        key: z.string().trim().min(1).max(200),
        label: z.string().trim().max(100).default(""),
      }),
    )
    .min(1, "업로드할 사진이 없습니다")
    .max(50, "한 번에 최대 50장까지 올릴 수 있습니다"),
});
export type TrainingPhotoAddInput = z.infer<typeof trainingPhotoAddSchema>;

// 관리자 — 훈련사진 메인 노출 토글
export const featuredToggleSchema = z.object({
  id: z.number().int().positive(),
  on: z.boolean(),
});
export type FeaturedToggleInput = z.infer<typeof featuredToggleSchema>;
```
(주: `z.enum(LEAF_CATEGORIES)`가 readonly 튜플로 타입 에러를 내면 `z.enum([...LEAF_CATEGORIES])`로 대체.)

- [ ] **Step 4: 통과 확인**

Run: `pnpm test src/lib/validations/forms.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/lib/validations/forms.ts src/lib/validations/forms.test.ts
git commit -m "feat: 훈련사진 업로드 카테고리 검증 + 메인 토글 스키마"
```

---

### Task 4: 공개 쿼리 (카테고리 갤러리 + 메인 featured)

**Files:**
- Modify: `src/lib/queries/photos.ts` (전체 교체)

- [ ] **Step 1: 구현 교체**

`src/lib/queries/photos.ts`:
```ts
import { createPublicClient } from "@/lib/supabase/public";
import { publicUrl } from "@/lib/storage/keys";
import { isLeafCategory, type LeafCategory } from "@/lib/gallery/categories";

export interface GalleryPhoto {
  category: LeafCategory;
  url: string;
}

/** 공개 훈련사진 — 카테고리 포함, 게시·미삭제, 최신 먼저. */
export async function getTrainingGalleryPhotos(): Promise<GalleryPhoto[]> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("post")
    .select("images,gallery_category,created_at")
    .eq("category", "훈련사진")
    .eq("is_published", true)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .map((p) => ({ key: p.images[0], cat: p.gallery_category }))
    .filter(
      (p): p is { key: string; cat: LeafCategory } =>
        Boolean(p.key) && isLeafCategory(p.cat),
    )
    .map((p) => ({ category: p.cat, url: publicUrl(p.key) }));
}

/** 홈 메인 노출 사진 — is_featured 최신순 최대 6장. 없으면 최신 6장 폴백. */
export async function getFeaturedTrainingPhotos(): Promise<string[]> {
  const sb = createPublicClient();
  const select = () =>
    sb
      .from("post")
      .select("images,created_at")
      .eq("category", "훈련사진")
      .eq("is_published", true)
      .eq("is_deleted", false);

  const featured = await select()
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(6);
  if (featured.error) throw featured.error;

  let rows = featured.data ?? [];
  if (rows.length === 0) {
    const fallback = await select()
      .order("created_at", { ascending: false })
      .limit(6);
    if (fallback.error) throw fallback.error;
    rows = fallback.data ?? [];
  }
  return rows
    .map((r) => r.images[0])
    .filter((k): k is string => Boolean(k))
    .map((k) => publicUrl(k));
}
```

- [ ] **Step 2: 타입체크**

Run: `pnpm exec tsc --noEmit`
Expected: 에러 없음 (호출부는 후속 Task에서 갱신 — 여기선 photos.ts 자체만 컴파일 확인. 호출부 타입 에러가 나면 Task 5·6에서 정리되므로 일단 photos.ts 문법만 확인)

- [ ] **Step 3: 커밋**

```bash
git add src/lib/queries/photos.ts
git commit -m "feat: 공개 훈련사진 쿼리 카테고리 반환 + 메인 featured 조회"
```

---

### Task 5: 공개 갤러리 UI (탭 + 기능사 하위 필터)

**Files:**
- Modify: `src/app/(public)/photos/TrainingGallery.tsx` (전체 교체)
- Modify: `src/app/(public)/photos/page.tsx`

- [ ] **Step 1: TrainingGallery 교체**

URL이 아니라 `GalleryPhoto[]`를 받고, 탭/하위칩 상태로 필터한다. 비율은 URL 키로 보관해 탭 전환에도 유지한다. `src/app/(public)/photos/TrainingGallery.tsx`:
```tsx
"use client";

// 훈련사진 갤러리 — 상단 탭(전체/집수리/인테리어목공/인테리어필름/기능사) + 기능사 하위칩.
// 비율을 URL 키로 보관해 탭 전환 시에도 justified 배치가 유지된다. 클릭 시 확대.

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import {
  TABS,
  GINEUNGSA_SUBS,
  LEAF_LABELS,
  photosForTab,
  type TabKey,
  type LeafCategory,
} from "@/lib/gallery/categories";
import type { GalleryPhoto } from "@/lib/queries/photos";

const GAP = 10;
const FALLBACK_RATIO = 1.4;
const SINGLE_COL_BP = 560;

type Cell = { i: number; w: number; h: number };

function buildRows(ratios: number[], containerW: number, targetH: number): Cell[][] {
  const rows: Cell[][] = [];
  let row: number[] = [];
  let sumR = 0;
  for (let i = 0; i < ratios.length; i++) {
    row.push(i);
    sumR += ratios[i];
    const rowW = sumR * targetH + GAP * (row.length - 1);
    if (rowW >= containerW) {
      const h = (containerW - GAP * (row.length - 1)) / sumR;
      rows.push(row.map((idx) => ({ i: idx, w: ratios[idx] * h, h })));
      row = [];
      sumR = 0;
    }
  }
  if (row.length) {
    rows.push(row.map((idx) => ({ i: idx, w: ratios[idx] * targetH, h: targetH })));
  }
  return rows;
}

export function TrainingGallery({ photos }: { photos: GalleryPhoto[] }) {
  const [tab, setTab] = useState<TabKey>("전체");
  const [sub, setSub] = useState<LeafCategory | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [ratioByUrl, setRatioByUrl] = useState<Record<string, number>>({});
  const [zoom, setZoom] = useState<number | null>(null);

  const visible = photosForTab(photos, tab, tab === "기능사과정" ? sub : null);
  const urls = visible.map((p) => p.url);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onImgLoad = useCallback(
    (url: string, e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      const r = img.naturalWidth / img.naturalHeight;
      setRatioByUrl((prev) =>
        Math.abs((prev[url] ?? -1) - r) < 0.001 ? prev : { ...prev, [url]: r },
      );
    },
    [],
  );

  const ratios = urls.map((u) => ratioByUrl[u] ?? FALLBACK_RATIO);
  const targetH = width < 900 ? 200 : 240;
  const rows =
    width > 0
      ? width < SINGLE_COL_BP
        ? ratios.map((r, i) => [{ i, w: width, h: width / r }])
        : buildRows(ratios, width, targetH)
      : null;

  const go = useCallback(
    (d: number) => setZoom((p) => (p === null ? p : (p + d + urls.length) % urls.length)),
    [urls.length],
  );
  useEffect(() => {
    if (zoom === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setZoom(null);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom, go]);

  function selectTab(t: TabKey) {
    setTab(t);
    setSub(null);
    setZoom(null);
  }

  return (
    <div>
      {/* 상단 탭 */}
      <div
        role="tablist"
        aria-label="훈련사진 분류"
        style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 14 }}
      >
        {TABS.map((t) => (
          <Chip key={t} active={t === tab} onClick={() => selectTab(t)}>
            {t}
          </Chip>
        ))}
      </div>

      {/* 기능사 하위 칩 */}
      {tab === "기능사과정" && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <Chip small active={sub === null} onClick={() => setSub(null)}>
            전체
          </Chip>
          {GINEUNGSA_SUBS.map((s) => (
            <Chip key={s} small active={sub === s} onClick={() => setSub(s)}>
              {LEAF_LABELS[s].replace("기능사 · ", "")}
            </Chip>
          ))}
        </div>
      )}

      {urls.length === 0 ? (
        <p className="text-muted text-[15px] text-center" style={{ padding: "40px 0" }}>
          이 분류에는 아직 등록된 사진이 없습니다.
        </p>
      ) : (
        <div ref={containerRef}>
          <div style={{ display: "flex", flexDirection: "column", gap: GAP }}>
            {(rows ?? [urls.map((_, i) => ({ i, w: 0, h: 0 }))]).map((cells, ri) => (
              <div key={ri} style={{ display: "flex", gap: GAP }}>
                {cells.map(({ i, w, h }) => (
                  <button
                    key={urls[i]}
                    type="button"
                    onClick={() => setZoom(i)}
                    aria-label={`훈련 현장 사진 ${i + 1} 크게 보기`}
                    style={{
                      width: rows ? w : undefined,
                      height: rows ? h : undefined,
                      flexGrow: rows ? 0 : 1,
                      padding: 0,
                      border: "none",
                      borderRadius: 12,
                      overflow: "hidden",
                      background: "var(--color-hairline-soft)",
                      cursor: "zoom-in",
                      display: "block",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={urls[i]}
                      alt={`훈련 현장 사진 ${i + 1}`}
                      loading="lazy"
                      onLoad={(e) => onImgLoad(urls[i], e)}
                      style={{
                        width: "100%",
                        height: rows ? "100%" : "auto",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 라이트박스 */}
      {zoom !== null && urls[zoom] && (
        <div
          onClick={() => setZoom(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.86)",
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
        >
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setZoom(null)}
            style={{
              position: "absolute",
              top: 18,
              right: 18,
              width: 44,
              height: 44,
              borderRadius: 9999,
              border: "none",
              background: "rgba(255,255,255,0.16)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 22,
              lineHeight: 1,
            }}
          >
            ×
          </button>
          <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", maxWidth: "min(94vw, 1100px)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={urls[zoom]}
              alt={`훈련 현장 사진 ${zoom + 1}`}
              style={{
                display: "block",
                maxWidth: "100%",
                maxHeight: "84vh",
                width: "auto",
                height: "auto",
                margin: "0 auto",
                borderRadius: 10,
              }}
            />
            <NavButton dir="prev" onClick={() => go(-1)} />
            <NavButton dir="next" onClick={() => go(1)} />
            <p style={{ color: "#fff", textAlign: "center", marginTop: 14, fontSize: 14 }}>
              {zoom + 1} / {urls.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({
  children,
  active,
  small,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  small?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="whitespace-nowrap font-semibold transition active:scale-[0.98]"
      style={{
        height: small ? 38 : 44,
        padding: small ? "0 16px" : "0 20px",
        fontSize: small ? 14 : 15.5,
        borderRadius: 9999,
        border: active ? "1px solid var(--color-ink)" : "1px solid var(--color-hairline-strong)",
        background: active ? "var(--color-ink)" : "transparent",
        color: active ? "#fff" : "var(--color-ink)",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function NavButton({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={dir === "prev" ? "이전 사진" : "다음 사진"}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={
        {
          position: "absolute",
          top: "50%",
          transform: "translateY(-50%)",
          [dir === "prev" ? "left" : "right"]: 10,
          width: 44,
          height: 44,
          display: "grid",
          placeItems: "center",
          borderRadius: 9999,
          border: "none",
          background: "rgba(255,255,255,0.92)",
          boxShadow: "0 4px 14px rgba(0,0,0,0.22)",
          cursor: "pointer",
          color: "var(--color-ink)",
        } as React.CSSProperties
      }
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={dir === "prev" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
      </svg>
    </button>
  );
}
```

- [ ] **Step 2: page.tsx 갱신**

`src/app/(public)/photos/page.tsx`의 빈 판정은 그대로 두고, `photos`(GalleryPhoto[])를 그대로 전달한다. `getTrainingGalleryPhotos()`가 이제 객체 배열을 반환하므로 `photos.length === 0` 판정·`<TrainingGallery photos={photos} />`는 변경 없이 동작한다. (별도 수정 불필요 — 타입만 자동으로 GalleryPhoto[]로 흐른다. 확인만.)

- [ ] **Step 3: 타입체크 + 빌드**

Run: `pnpm exec tsc --noEmit && pnpm build`
Expected: 성공

- [ ] **Step 4: 커밋**

```bash
git add src/app/\(public\)/photos/TrainingGallery.tsx src/app/\(public\)/photos/page.tsx
git commit -m "feat: 훈련사진 공개 갤러리 카테고리 탭 + 기능사 하위 필터"
```

---

### Task 6: 홈 메인 6장 DB 연동

**Files:**
- Modify: `src/components/sections/SocialProof.tsx`
- Modify: `src/app/(public)/page.tsx`

- [ ] **Step 1: SocialProof를 props 기반으로**

`src/components/sections/SocialProof.tsx`에서 하드코딩 `photos` 배열과 `PhotoSlot` import를 제거하고, `photos: string[]` prop을 받아 캡션 없는 4/3 그리드(raw img)로 렌더한다. 사진이 없으면 그리드와 "전체보기" 버튼 섹션을 숨기고 인증 패널만 남긴다.

`import { PhotoSlot } from "@/components/ui/PhotoSlot";` 줄 삭제. 상단 하드코딩 `const photos = [...]` 블록(75~82행) 삭제.

함수 시그니처와 사진 영역 교체:
```tsx
export function SocialProof({ photos }: { photos: string[] }) {
  return (
    <section className="wrap band">
      <SectionHeading
        align="center"
        eyebrow="훈련 현장"
        title={<>현장과 같은 실습 환경</>}
        sub={
          <span className="text-[16px] sm:text-[17px]">
            보여주기식 실습이 아닙니다.{" "}
            <br className="only-mobile" />
            실제와 같은 장비·공정으로,
            <br />
            수료 후 바로 현장에서 일할 수 있게 가르칩니다.
          </span>
        }
      />
      {photos.length > 0 && (
        <>
          <div className="grid g-3" style={{ margin: "36px 0 12px" }}>
            {photos.map((src, i) => (
              <div
                key={i}
                className="relative overflow-hidden bg-surface-strong border border-hairline"
                style={{ aspectRatio: "4 / 3", borderRadius: 12 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt="훈련 현장"
                  loading="lazy"
                  className="w-full h-full object-cover block"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-center" style={{ margin: "4px 0 34px" }}>
            <Link
              href="/photos"
              className="inline-flex items-center justify-center gap-2 rounded-button font-semibold leading-none tracking-[-0.2px] whitespace-nowrap transition active:scale-[0.98] h-12 px-[22px] text-[17px] bg-transparent text-ink border border-hairline-strong"
            >
              훈련 사진 전체보기
            </Link>
          </div>
        </>
      )}

      {/* 인증(awards) 패널 — 기존 그대로 유지 */}
```
(인증 패널 `<div className="relative overflow-hidden" ...>`부터 끝까지는 변경 없음. `Image` import는 AwardHighlight에서 계속 쓰므로 유지.)

- [ ] **Step 2: 홈 page.tsx에서 featured 주입**

`src/app/(public)/page.tsx` 수정:
```tsx
import { getScheduleCourses } from "@/lib/queries/courses";
import { getFeaturedTrainingPhotos } from "@/lib/queries/photos";
import type { ScheduleCourse } from "@/lib/queries/types";

export const revalidate = 3600;

export default async function HomePage() {
  let scheduleCourses: ScheduleCourse[];
  try {
    scheduleCourses = await getScheduleCourses();
  } catch {
    scheduleCourses = [];
  }
  let featuredPhotos: string[];
  try {
    featuredPhotos = await getFeaturedTrainingPhotos();
  } catch {
    featuredPhotos = [];
  }
  return (
    <>
      <Banner />
      <AwardsStrip />
      <HomeIntentSchedule courses={scheduleCourses} />
      <Barriers />
      <SocialProof photos={featuredPhotos} />
      <Videos />
      <ClosingCTA />
    </>
  );
}
```

- [ ] **Step 3: 타입체크 + 빌드**

Run: `pnpm exec tsc --noEmit && pnpm build`
Expected: 성공

- [ ] **Step 4: 커밋**

```bash
git add src/components/sections/SocialProof.tsx src/app/\(public\)/page.tsx
git commit -m "feat: 홈 훈련사진 6장 DB(featured) 연동 + 폴백"
```

---

### Task 7: 어드민 쿼리 (카테고리·메인 + 카운트)

**Files:**
- Modify: `src/lib/queries/admin.ts` (`AdminPhotoView`, `getTrainingPhotos`)

- [ ] **Step 1: 반환 타입·쿼리 수정**

import에 추가:
```ts
import { isLeafCategory, type LeafCategory } from "@/lib/gallery/categories";
```
`AdminPhotoView`와 `getTrainingPhotos`를 교체:
```ts
export interface AdminPhotoView {
  id: number;
  label: string;
  image: string | null;
  category: LeafCategory | null;
  isFeatured: boolean;
}

export interface AdminPhotosResult {
  photos: AdminPhotoView[];
  featuredCount: number;
}

export async function getTrainingPhotos(): Promise<AdminPhotosResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("post")
    .select("id,title,images,gallery_category,is_featured,is_deleted,created_at")
    .eq("category", "훈련사진")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const photos = (data ?? []).map((p) => ({
    id: p.id,
    label: p.title,
    image: p.images[0] ? publicUrl(p.images[0]) : null,
    category: isLeafCategory(p.gallery_category) ? p.gallery_category : null,
    isFeatured: p.is_featured,
  }));
  return { photos, featuredCount: photos.filter((p) => p.isFeatured).length };
}
```

- [ ] **Step 2: 타입체크**

Run: `pnpm exec tsc --noEmit`
Expected: 호출부(admin photos page) 타입 에러가 날 수 있음 — Task 9에서 해소. admin.ts 자체 문법만 확인하고 진행.

- [ ] **Step 3: 커밋**

```bash
git add src/lib/queries/admin.ts
git commit -m "feat: 어드민 훈련사진 쿼리 카테고리·메인노출·카운트 반환"
```

---

### Task 8: 어드민 액션 (카테고리 업로드 + 메인 토글)

**Files:**
- Modify: `src/app/admin/(dashboard)/photos/actions.ts`

- [ ] **Step 1: 액션 수정**

import 교체/추가:
```ts
import { trainingPhotoAddSchema, featuredToggleSchema } from "@/lib/validations/forms";
import { featuredLimitReached } from "@/lib/gallery/categories";
```
`addTrainingPhotos`의 insert에 `gallery_category` 추가:
```ts
  const rows = parsed.data.photos.map((p) => ({
    category: "훈련사진" as const,
    gallery_category: parsed.data.galleryCategory,
    title: p.label || "훈련 현장 사진",
    images: [p.key],
  }));
```
(나머지 `addTrainingPhotos` 본문은 그대로. revalidate에 홈 추가는 아래 toggle과 동일하게 `revalidatePath("/")` 한 줄 추가.)

파일 끝에 `toggleFeatured` 추가:
```ts
/** 메인 노출 토글 — 켤 때 최대 6장 cap 검증. */
export async function toggleFeatured(input: unknown): Promise<PhotoResult> {
  const parsed = featuredToggleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "잘못된 요청입니다." };
  const { id, on } = parsed.data;

  const supabase = await createClient();

  if (on) {
    const { count, error: cErr } = await supabase
      .from("post")
      .select("id", { count: "exact", head: true })
      .eq("category", "훈련사진")
      .eq("is_deleted", false)
      .eq("is_featured", true);
    if (cErr) return { ok: false, error: GENERIC };
    if (featuredLimitReached(count ?? 0)) {
      return {
        ok: false,
        error: "메인 사진은 최대 6장까지 선택할 수 있습니다. 다른 사진을 먼저 해제해 주세요.",
      };
    }
  }

  const { error } = await supabase
    .from("post")
    .update({ is_featured: on })
    .eq("id", id)
    .eq("category", "훈련사진");
  if (error) return { ok: false, error: GENERIC };

  revalidatePath("/admin/photos");
  revalidatePath("/photos");
  revalidatePath("/");
  return { ok: true };
}
```
`addTrainingPhotos`·`deleteTrainingPhoto`의 revalidate 목록에도 `revalidatePath("/")`를 추가(메인 반영).

- [ ] **Step 2: 타입체크**

Run: `pnpm exec tsc --noEmit`
Expected: actions.ts 문법 OK (page/uploader는 Task 9에서)

- [ ] **Step 3: 커밋**

```bash
git add src/app/admin/\(dashboard\)/photos/actions.ts
git commit -m "feat: 어드민 사진 업로드 카테고리 저장 + 메인 토글 액션(6장 cap)"
```

---

### Task 9: 어드민 UI (카테고리 선택 업로드 + 축소 + 필터·토글)

**Files:**
- Create: `src/lib/storage/downscale.ts`
- Create: `src/app/admin/(dashboard)/photos/FeaturedToggle.tsx`
- Create: `src/app/admin/(dashboard)/photos/PhotoGrid.tsx`
- Modify: `src/app/admin/(dashboard)/photos/PhotoUploader.tsx`
- Modify: `src/app/admin/(dashboard)/photos/page.tsx`

- [ ] **Step 1: 이미지 축소 헬퍼**

`src/lib/storage/downscale.ts`:
```ts
// 브라우저 canvas로 긴 변 maxEdge 이하로 축소 + JPEG 재인코딩. 실패 시 원본 반환.
const MAX_EDGE = 1600;
const QUALITY = 0.8;

export async function downscaleImage(file: File): Promise<Blob> {
  if (typeof document === "undefined") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", QUALITY),
    );
    return blob ?? file;
  } catch {
    return file;
  }
}
```

- [ ] **Step 2: PhotoUploader에 카테고리 선택 + 축소**

`src/app/admin/(dashboard)/photos/PhotoUploader.tsx`를 교체:
```tsx
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon } from "@/components/icons";
import { validatePhotoFile } from "@/lib/storage/keys";
import { uploadToTarget } from "@/lib/storage/client";
import { downscaleImage } from "@/lib/storage/downscale";
import { LEAF_CATEGORIES, LEAF_LABELS, type LeafCategory } from "@/lib/gallery/categories";
import { createUploadTarget, addTrainingPhotos } from "./actions";

export function PhotoUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<LeafCategory | "">("");
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    setError(null);
    if (!category) {
      setError("먼저 카테고리를 선택해 주세요.");
      return;
    }
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    for (const f of files) {
      const msg = validatePhotoFile(f);
      if (msg) {
        setError(msg);
        return;
      }
    }

    setBusy(true);
    try {
      const photos: { key: string; label: string }[] = [];
      for (const f of files) {
        const blob = await downscaleImage(f);
        const t = await createUploadTarget(blob.type || "image/jpeg");
        if (!t.ok) {
          setError(t.error);
          return;
        }
        await uploadToTarget(t.target, blob);
        photos.push({ key: t.target.key, label: f.name.replace(/\.[^.]+$/, "") });
      }
      const res = await addTrainingPhotos({ galleryCategory: category, photos });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    } catch {
      setError("업로드 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="block text-[14px] font-bold text-body-strong mb-2">
        카테고리 선택
      </label>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as LeafCategory | "")}
        className="w-full mb-3 h-11 rounded-lg border border-hairline-strong px-3 text-[15px] bg-white"
      >
        <option value="">카테고리를 선택하세요</option>
        {LEAF_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {LEAF_LABELS[c]}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handleFiles(e.dataTransfer.files);
        }}
        disabled={busy || !category}
        className={`w-full border-2 border-dashed rounded-lg py-12 flex flex-col items-center justify-center gap-2 bg-primary-softer disabled:opacity-60 ${drag ? "border-primary" : "border-primary-border"}`}
      >
        <ImageIcon size={28} className="text-primary" />
        <p className="text-body-strong text-[15px] font-bold">
          {busy ? "업로드 중…" : "사진을 끌어다 놓거나 클릭해서 업로드"}
        </p>
        <p className="text-muted text-[13px]">JPG·PNG · 업로드 시 자동 축소</p>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && <p className="text-error text-[13px] mt-2">{error}</p>}
    </div>
  );
}
```
(주: `uploadToTarget`이 `File`만 받는다면 `Blob`도 받도록 시그니처를 `File | Blob`로 넓힌다 — 다음 단계에서 확인.)

- [ ] **Step 3: uploadToTarget가 Blob 허용하는지 확인**

Run: `sed -n '1,40p' src/lib/storage/client.ts`
필요 시 `file: File` 매개변수를 `file: Blob`로 변경(원본 호출부는 File도 Blob이므로 호환).

- [ ] **Step 4: FeaturedToggle 컴포넌트**

`src/app/admin/(dashboard)/photos/FeaturedToggle.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFeatured } from "./actions";

export function FeaturedToggle({ id, on }: { id: number; on: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onClick() {
    setErr(null);
    start(async () => {
      const res = await toggleFeatured({ id, on: !on });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={on}
      title={err ?? (on ? "메인에서 내리기" : "메인에 올리기")}
      className="absolute top-2 left-2 rounded-md px-2 py-1 text-[12px] font-bold disabled:opacity-60"
      style={{
        background: on ? "var(--color-primary)" : "rgba(0,0,0,0.55)",
        color: "#fff",
      }}
    >
      {on ? "메인 노출 ✓" : "메인 올리기"}
    </button>
  );
}
```
(err가 있으면 title로 노출. cap 초과 시 그 메시지가 title에 뜬다.)

- [ ] **Step 5: PhotoGrid (카테고리 필터 + 그리드)**

`src/app/admin/(dashboard)/photos/PhotoGrid.tsx`:
```tsx
"use client";

import { useState } from "react";
import { LEAF_CATEGORIES, LEAF_LABELS, type LeafCategory } from "@/lib/gallery/categories";
import type { AdminPhotoView } from "@/lib/queries/admin";
import { DeletePhotoButton } from "./DeletePhotoButton";
import { FeaturedToggle } from "./FeaturedToggle";

type Filter = "전체" | LeafCategory;

export function PhotoGrid({ photos }: { photos: AdminPhotoView[] }) {
  const [filter, setFilter] = useState<Filter>("전체");
  const visible = filter === "전체" ? photos : photos.filter((p) => p.category === filter);

  return (
    <div className="mt-6">
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 14 }}>
        {(["전체", ...LEAF_CATEGORIES] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className="whitespace-nowrap font-semibold rounded-full"
            style={{
              height: 38,
              padding: "0 14px",
              fontSize: 13.5,
              border: filter === f ? "1px solid var(--color-ink)" : "1px solid var(--color-hairline-strong)",
              background: filter === f ? "var(--color-ink)" : "transparent",
              color: filter === f ? "#fff" : "var(--color-ink)",
              cursor: "pointer",
            }}
          >
            {f === "전체" ? "전체" : LEAF_LABELS[f]}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-muted text-[14px] text-center mt-6">해당 카테고리 사진이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {visible.map((photo) => (
            <div key={photo.id} className="relative aspect-[4/3] rounded-[14px] overflow-hidden">
              {photo.image !== null ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.image} alt={photo.label} className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full"
                  style={{
                    background:
                      "repeating-linear-gradient(45deg, #eef1f4 0, #eef1f4 10px, #f7f9fb 10px, #f7f9fb 20px)",
                  }}
                />
              )}
              <FeaturedToggle id={photo.id} on={photo.isFeatured} />
              <span className="absolute bottom-2 left-2 bg-black/55 text-white text-[12px] font-medium rounded-md px-2 py-1">
                {photo.category ? LEAF_LABELS[photo.category] : "미분류"}
              </span>
              <DeletePhotoButton id={photo.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: page.tsx에서 결과 분해 + 카운터**

`src/app/admin/(dashboard)/photos/page.tsx`:
```tsx
import { getTrainingPhotos } from "@/lib/queries/admin";
import { FEATURED_MAX } from "@/lib/gallery/categories";
import { PhotoUploader } from "./PhotoUploader";
import { PhotoGrid } from "./PhotoGrid";

export default async function PhotosPage() {
  const { photos, featuredCount } = await getTrainingPhotos();

  return (
    <div>
      <PhotoUploader />

      <p className="text-muted text-[13px] mt-4">
        메인 노출 {featuredCount}/{FEATURED_MAX}
      </p>

      {photos.length === 0 ? (
        <p className="text-muted text-[14px] mt-6 text-center">
          아직 업로드된 사진이 없습니다.
        </p>
      ) : (
        <PhotoGrid photos={photos} />
      )}
    </div>
  );
}
```

- [ ] **Step 7: 타입체크 + 빌드**

Run: `pnpm exec tsc --noEmit && pnpm build`
Expected: 성공

- [ ] **Step 8: 커밋**

```bash
git add src/lib/storage/downscale.ts src/lib/storage/client.ts src/app/admin/\(dashboard\)/photos/
git commit -m "feat: 어드민 사진 업로드 카테고리 선택·자동축소 + 필터·메인토글 UI"
```

---

### Task 10: 사진 교체 스크립트 (1회성)

**Files:**
- Create: `scripts/replace-training-photos.mjs`

- [ ] **Step 1: 스크립트 작성**

스테이징 디렉터리(leaf별 폴더에 압축 완료된 jpg)를 인자로 받아: 기존 훈련사진 행·버킷 객체 전부 삭제 → leaf별 업로드 + insert.
`scripts/replace-training-photos.mjs`:
```js
// 기존 훈련사진(post category='훈련사진') 행 + training-photos 버킷 객체를 전부 지우고,
// 스테이징 디렉터리(leaf별 폴더, 이미 sips로 축소된 jpg)를 업로드하며 gallery_category 를 채운다.
// 1회성. 실행:
//   node --env-file=.env.local scripts/replace-training-photos.mjs <staging-dir>
// staging 구조: <dir>/집수리/*.jpg, /인테리어목공, /인테리어필름, /목공기능사, /도장기능사
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
const stagingDir = process.argv[2];
if (!url || !key) {
  console.error("환경변수 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY 가 필요합니다.");
  process.exit(1);
}
if (!stagingDir) {
  console.error("사용법: node ... replace-training-photos.mjs <staging-dir>");
  process.exit(1);
}

const BUCKET = "training-photos";
const LEAVES = ["집수리", "인테리어목공", "인테리어필름", "목공기능사", "도장기능사"];

const sb = createClient(url, key, { auth: { persistSession: false } });

console.log(`대상: ${url}`);

// 1) 기존 행 삭제
const del = await sb.from("post").delete().eq("category", "훈련사진");
if (del.error) {
  console.error("기존 행 삭제 실패:", del.error.message);
  process.exit(1);
}
console.log("기존 훈련사진 행 삭제 완료");

// 2) 버킷 객체 전부 삭제
const list = await sb.storage.from(BUCKET).list("", { limit: 1000 });
if (list.error) {
  console.error("버킷 목록 실패:", list.error.message);
  process.exit(1);
}
const names = (list.data ?? []).filter((o) => o.name).map((o) => o.name);
if (names.length) {
  const rm = await sb.storage.from(BUCKET).remove(names);
  if (rm.error) {
    console.error("버킷 객체 삭제 실패:", rm.error.message);
    process.exit(1);
  }
}
console.log(`기존 객체 ${names.length}개 삭제 완료`);

// 3) leaf별 업로드 + insert
let total = 0;
for (const leaf of LEAVES) {
  const dir = join(stagingDir, leaf);
  let files;
  try {
    files = (await readdir(dir)).filter((f) => /\.jpe?g$/i.test(f)).sort();
  } catch {
    console.warn(`(건너뜀) 폴더 없음: ${dir}`);
    continue;
  }
  for (const f of files) {
    const buf = await readFile(join(dir, f));
    const objectKey = `${randomUUID()}.jpg`;
    const up = await sb.storage
      .from(BUCKET)
      .upload(objectKey, buf, { contentType: "image/jpeg", upsert: false });
    if (up.error) {
      console.error(`업로드 실패 ${leaf}/${f}:`, up.error.message);
      process.exit(1);
    }
    const ins = await sb.from("post").insert({
      category: "훈련사진",
      gallery_category: leaf,
      title: "훈련 현장 사진",
      images: [objectKey],
      is_featured: false,
    });
    if (ins.error) {
      console.error(`행 생성 실패 ${leaf}/${f}:`, ins.error.message);
      process.exit(1);
    }
    total++;
  }
  console.log(`✓ ${leaf}: ${files.length}장`);
}
console.log(`완료: 총 ${total}장 업로드`);
```

- [ ] **Step 2: 커밋(실행은 데이터 단계에서)**

```bash
git add scripts/replace-training-photos.mjs
git commit -m "chore: 훈련사진 일괄 교체 스크립트(카테고리별 업로드)"
```

---

### Task 11: 전체 검증 (테스트·빌드·린트)

- [ ] **Step 1: 전체 테스트**

Run: `pnpm test`
Expected: 전부 PASS (신규 categories·forms 포함)

- [ ] **Step 2: 빌드 + 린트**

Run: `pnpm build && pnpm lint`
Expected: 성공, 린트 에러 없음

- [ ] **Step 3: 로컬 수동 검증 (preview)**

dev 서버로 다음을 확인(로컬 Supabase에 임시 사진 몇 장 또는 staging 일부 업로드 후):
- `/photos`: 탭 전환(전체/집수리/인테리어목공/인테리어필름/기능사), 기능사 하위칩(전체/목공기능사/도장기능사), 라이트박스 좌우·ESC.
- `/admin/photos`: 카테고리 선택 없이는 업로드 비활성, 선택 후 업로드되며 자동 축소(네트워크 응답 크기 확인), 카테고리 필터, 메인 토글 6장 초과 시 차단 메시지(title), `메인 N/6` 카운터.
- `/`(홈): featured 사진 6장 노출, featured 0개일 때 최신 6장 폴백, 0장이면 사진 영역 숨김·인증 패널 유지.

---

### Task 12: 프로덕션 데이터 교체 (게이트 — 사용자 승인 후 실행)

> **파괴적 작업.** 코드/UI 로컬 검증 + 사용자 승인 후에만 실행.

- [ ] **Step 1: zip 추출 + 축소 (스테이징 생성)**

스크래치패드에서 cp949 파일명 디코딩하여 leaf 폴더로 추출 후 `sips`로 축소:
```bash
PY_OUT=/private/tmp/claude-501/.../scratchpad/staging_raw
ST=/private/tmp/claude-501/.../scratchpad/staging
python3 - <<'PY'
import zipfile, os, collections
z = zipfile.ZipFile(os.path.expanduser("~/Downloads/훈련사진_요셉학원.zip"))
MAP = {"1. 집수리":"집수리","2. 목공":"인테리어목공","3. 필름":"인테리어필름"}
SUB = {"목공기능사":"목공기능사","도장기능사":"도장기능사"}
out = os.environ["PY_OUT"]
cnt = collections.Counter()
def dec(info):
    if info.flag_bits & 0x800: return info.filename
    return info.filename.encode('cp437','replace').decode('cp949')
for info in z.infolist():
    if info.is_dir(): continue
    name = dec(info); parts = name.split('/')
    top = parts[0]
    if top.startswith("4. 기능사"):
        leaf = SUB.get(parts[1]) if len(parts) > 2 else None
    else:
        leaf = MAP.get(top)
    if not leaf: continue
    d = os.path.join(out, leaf); os.makedirs(d, exist_ok=True)
    cnt[leaf]+=1
    with open(os.path.join(d, f"{cnt[leaf]:03d}.jpg"), "wb") as fh:
        fh.write(z.read(info))
print(dict(cnt))
PY
# sips 축소(긴 변 1600, 품질 80) → staging
for leaf in 집수리 인테리어목공 인테리어필름 목공기능사 도장기능사; do
  mkdir -p "$ST/$leaf"
  for f in "$PY_OUT/$leaf"/*.jpg; do
    sips -s format jpeg -s formatOptions 80 -Z 1600 "$f" --out "$ST/$leaf/$(basename "$f")" >/dev/null
  done
done
du -sh "$ST"
```
Expected: 집수리 34 / 인테리어목공 23 / 인테리어필름 27 / 목공기능사+도장기능사 합 50, 총 134장. staging 총 용량이 원본(~400MB)보다 대폭 작음.

- [ ] **Step 2: 프로덕션 교체 실행**

`.env.local`이 프로덕션을 가리키는지 확인 후:
```bash
node --env-file=.env.local scripts/replace-training-photos.mjs "$ST"
```
Expected: "대상: <prod url>" 출력 → 기존 행·객체 삭제 → leaf별 업로드 로그 → "완료: 총 134장".

- [ ] **Step 3: 프로덕션 확인**

`/photos`·`/`에서 새 사진과 탭이 정상 노출되는지 확인. 운영자에게 메인 6장 선택 안내.

---

## Self-Review

**스펙 커버리지:**
- 카테고리 탭(전체+4) → Task 1·5 ✓
- 기능사 하위 분리 → Task 1·5 ✓
- 기존 DB 사진 삭제 + 134장 업로드(프로덕션) → Task 10·12 ✓
- 어드민 카테고리 선택 업로드 → Task 3·8·9 ✓
- 어드민 메인 노출 선택(6장 cap) → Task 1·3·8·9 ✓
- 메인 6장 DB 연동 + 폴백 → Task 4·6 ✓
- 자동 축소 → Task 9(어드민)·12(일괄) ✓
- 이미지 perf/캡션 제거 → Task 6 ✓
- DB 마이그레이션·타입 → Task 2 ✓

**플레이스홀더:** 없음(모든 코드·명령 기재). Task 12의 scratchpad 경로는 실행 시 실제 세션 경로로 치환.

**타입 일관성:** `LeafCategory`·`TabKey`·`GalleryPhoto`·`AdminPhotoView`·`AdminPhotosResult`·`photosForTab`·`featuredLimitReached`·`FEATURED_MAX`·`toggleFeatured`·`trainingPhotoAddSchema(galleryCategory)`·`featuredToggleSchema` 가 정의(Task 1·2·3·4·7·8)와 사용처(Task 5·6·9)에서 일치.

**주의:** 중간 Task의 `tsc --noEmit`은 호출부 미갱신으로 일시적 에러가 날 수 있음(각 Task에 명시). 최종 일관성은 Task 11에서 보장.
