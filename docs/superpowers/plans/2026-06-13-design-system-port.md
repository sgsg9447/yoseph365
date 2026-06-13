# 디자인 핸드오프 → 프론트엔드 UI 포팅 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 클로드 디자인 핸드오프(인라인 스타일 React)를 Next.js 16 + TS + Tailwind v4 스택의 디자인 시스템·재사용 컴포넌트·페이지로 충실히 이식한다(UI만, 백엔드 미연결).

**Architecture:** 토큰을 `globals.css`의 Tailwind v4 `@theme`로 등록하고 복합 레이아웃은 `@layer components`로 1:1 이식. 컴포넌트는 `components/{icons,ui,layout,overlay,sections}`로 분리, 페이지는 `app/(public)/*`. 서버 컴포넌트 기본, 상호작용(캐러셀·시트·메뉴·위저드)만 `'use client'`. 표시 데이터는 `lib/data`에 타입과 함께 하드코딩.

**Tech Stack:** Next.js 16(App Router, React 19), TypeScript strict, Tailwind v4, Pretendard, Vitest + React Testing Library(jsdom) — 로직 있는 client 컴포넌트만 TDD.

**Spec:** `docs/superpowers/specs/2026-06-13-design-system-port-design.md`

**핸드오프 경로(읽기 전용 참조 = source of truth):** `/Users/seulgi/Documents/성요셉/design_handoff_seongyoseph_site` (이하 `HANDOFF/`)

---

## 변환 규칙 (모든 포팅 태스크 공통)

핸드오프 JSX의 인라인 스타일을 아래 규칙으로 Tailwind v4 유틸리티/토큰으로 치환한다. **임의 재디자인 금지 — 값은 그대로, 표현만 변환.**

- `var(--color-X)` 색 → 유틸리티(`bg-primary`, `text-ink`, `border-hairline` 등 Task 1에서 등록된 토큰명). 토큰에 없는 1회성 값(파스텔 orb의 `--color-gradient-*`, rgba 오버레이)만 `[...]` arbitrary value.
- 픽셀 단위 → Tailwind 단위(`gap: 14 → gap-3.5`, 임의값은 `gap-[14px]`). 4px 스케일에 안 맞으면 `[14px]` 허용.
- `borderRadius: 12 → rounded-button`(=12px), `16 → rounded-lg`, `9999 → rounded-full`.
- `boxShadow: var(--shadow-card)` → `shadow-card`(Task 1에서 `--shadow-*` 등록).
- `fontFamily: var(--font-display)` → `font-display`; body는 기본(상속).
- `clamp(...)` 폰트/패딩 → `[clamp(...)]` arbitrary value 또는 반응형 유틸 조합. 동일 시각 결과를 우선.
- `className="wrap"`, `"band"`, `"grid g-3"`, `"steps"`, `"ncs-row"`, `"board-row"` 등 핸드오프 클래스 → Task 1에서 `@layer components`에 동일 이름으로 이식했으므로 **그대로 사용**.
- 핸드오프의 JS 기반 hover state(예: `Card`의 `useState(h)`) → CSS `:hover` + `transition`으로 대체해 서버 컴포넌트 유지.
- `window.location.href = "courses.html"` 류 네비게이션 → `next/link`의 `<Link href="/courses">` 또는 `router.push`. 라우트 매핑: `index.html→/`, `courses.html→/courses`, `apply.html→/apply`, `funding.html→/funding`, `about.html→/about`, `inquiry.html→/inquiry`, `photos.html→/photos`.
- `<img src="assets/...">` → `next/image`의 `<Image>` (로고·배너·수상·영상 썸네일). `public/` 경로로.
- 한국어 카피·데이터 문자열은 **글자 그대로** 옮긴다.

---

## Phase 0 — 기반 (토큰·폰트·에셋·테스트 인프라)

### Task 1: globals.css — 토큰 `@theme` + base 리셋 + 레이아웃 헬퍼

**Files:**
- Modify: `src/app/globals.css` (전체 교체)

- [ ] **Step 1: globals.css 전체를 아래로 교체**

```css
@import "tailwindcss";

@theme {
  /* Primary = 로열 블루 */
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-primary-active: #1e40af;
  --color-primary-soft: #eaf0fe;
  --color-primary-softer: #f5f8ff;
  --color-primary-border: #cedcf9;
  --color-on-primary: #ffffff;

  /* Surfaces */
  --color-canvas: #ffffff;
  --color-canvas-soft: #fcfcfb;
  --color-canvas-deep: #0c0a09;
  --color-surface-card: #ffffff;
  --color-surface-strong: #f4f1ec;
  --color-surface-dark: #0c0a09;
  --color-surface-dark-elevated: #1c1917;

  /* Hairlines */
  --color-hairline: #ece9e3;
  --color-hairline-soft: #f3f1ec;
  --color-hairline-strong: #dcd6cd;

  /* Text */
  --color-ink: #1a1a18;
  --color-body: #4e4e4e;
  --color-body-strong: #2a2a28;
  --color-muted: #777169;
  --color-muted-soft: #a8a29e;
  --color-on-dark: #ffffff;
  --color-on-dark-soft: #b8b3ab;

  /* Atmospheric pastel orbs */
  --color-gradient-mint: #b8ead8;
  --color-gradient-peach: #f6d2b9;
  --color-gradient-lavender: #d3c6e6;
  --color-gradient-sky: #bcd6ee;
  --color-gradient-rose: #eec6d0;

  /* Semantic */
  --color-success: #1b8a4c;
  --color-success-soft: #e8f4ed;
  --color-error: #c4392b;
  --color-error-soft: #fbecea;
  --color-info: #2563eb;
  --color-info-soft: #eaf0fe;

  /* Fonts */
  --font-sans: "Pretendard Variable", "Pretendard", -apple-system, BlinkMacSystemFont,
    "Apple SD Gothic Neo", "Malgun Gothic", "맑은 고딕", sans-serif;
  --font-display: var(--font-sans);

  /* Radius */
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-button: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;

  /* Shadow */
  --shadow-card: 0 1px 2px rgba(28, 26, 24, 0.04);
  --shadow-card-hover: 0 6px 20px rgba(28, 26, 24, 0.08);
  --shadow-sticky: 0 -2px 12px rgba(28, 26, 24, 0.08);
  --shadow-pop: 0 12px 32px rgba(28, 26, 24, 0.14);

  /* Custom breakpoints (핸드오프 미디어쿼리) */
  --breakpoint-sm: 640px;
  --breakpoint-md: 760px;
  --breakpoint-board: 860px;
  --breakpoint-sub: 900px;
  --breakpoint-lg: 1000px;
  --breakpoint-xl: 1100px;
}

@layer base {
  *, *::before, *::after { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
  body {
    margin: 0;
    font-family: var(--font-sans);
    font-size: 17px;
    line-height: 1.7;
    font-weight: 400;
    color: var(--color-body);
    background: var(--color-canvas);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    word-break: keep-all;
    overflow-wrap: break-word;
  }
  h1, h2, h3, h4, h5, h6, p, figure { margin: 0; }
  h1, h2, h3, h4, h5, h6 { color: var(--color-ink); font-weight: 700; letter-spacing: -0.4px; }
  a { color: var(--color-primary); text-decoration: none; }
  img { max-width: 100%; display: block; }
  button { font-family: inherit; cursor: pointer; }
  :focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
}

@layer components {
  /* HANDOFF/ui_kits/website/app.css 를 토큰 변수 그대로 이식 */
  .wrap { max-width: 1120px; margin: 0 auto; padding: 0 clamp(24px, 5vw, 72px); }
  .band { padding-top: 56px; padding-bottom: 56px; }
  .band-lg { padding-top: 64px; padding-bottom: 64px; }
  .panel { position: relative; overflow: hidden; border-radius: 28px; padding: clamp(36px, 5.5vw, 72px) clamp(22px, 4.5vw, 64px); }
  .grid { display: grid; gap: 14px; }
  .steps { display: grid; grid-template-columns: 1fr; gap: 22px; }
  .step { display: flex; align-items: flex-start; gap: 14px; }
  .step-top { display: flex; align-items: center; flex: 0 0 auto; }
  .step-text { display: flex; flex-direction: column; gap: 5px; }
  .g-intent { grid-template-columns: 1fr; }
  .g-2 { grid-template-columns: 1fr; }
  .g-3 { grid-template-columns: 1fr; }
  .g-4 { grid-template-columns: 1fr 1fr; }
  .orb { position: absolute; border-radius: 9999px; filter: blur(60px); opacity: 0.5; pointer-events: none; z-index: 0; }
  .nav-menu { display: none; }
  .only-mobile { display: block; }
  .only-desktop { display: none; }
  .hero-head { font-size: clamp(28px, 4.6vw, 46px); }
  .sub-oneline { white-space: normal; }
  .ncs-row { display: grid; grid-template-columns: 44px 1fr; gap: 4px 12px; padding: 15px 20px; border-bottom: 1px solid var(--color-hairline); font-size: 14.5px; line-height: 1.6; word-break: keep-all; }
  .ncs-row > :nth-child(3) { grid-column: 2; }
  .ncs-row:last-child { border-bottom: none; }
  .ncs-head { display: none; }
  .ncs-sub { display: none; }
  .board-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
  .board-search { width: 100%; }
  .board-row { display: grid; grid-template-columns: 1fr; gap: 8px; padding: 17px 4px; border-bottom: 1px solid var(--color-hairline); }
  .board-head { display: none; }
  .board-cat { display: none; }
  .board-link { transition: background .14s; }
  .board-link:hover { background: var(--color-canvas-soft); }
  .board-link:hover .board-title { color: var(--color-primary); text-decoration: underline; text-underline-offset: 3px; }
  .awards-strip { display: flex; align-items: center; gap: 16px; padding-top: 14px; padding-bottom: 14px; }
  .awards-divider { display: block; width: 1px; height: 26px; background: var(--color-hairline-strong); }
  .awards-list { display: flex; align-items: center; gap: 22px; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; padding: 4px 2px; }
  .awards-list::-webkit-scrollbar { display: none; }
  .fund-tabs { display: flex; gap: 8px; overflow-x: auto; padding: 4px 2px; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
  .fund-tabs::-webkit-scrollbar { display: none; }
  .drop-link:hover { background: var(--color-primary-soft); }
  .pay-row { display: grid; grid-template-columns: 1fr; gap: 4px; }
  .footer-grid { display: grid; grid-template-columns: 1fr; gap: 22px; align-items: start; }
  .footer-logo { height: 72px; width: auto; justify-self: start; }
  .banner-art { display: none; position: absolute; right: clamp(28px, 8vw, 110px); top: 50%; transform: translateY(-50%); width: clamp(160px, 22vw, 250px); aspect-ratio: 1 / 1; border-radius: 9999px; background: rgba(255,255,255,0.55); box-shadow: 0 18px 40px rgba(26,26,24,0.10), inset 0 1px 0 rgba(255,255,255,0.85); place-items: center; z-index: 1; pointer-events: none; user-select: none; }

  @media (min-width: 640px) { .banner-art { display: grid; } }
  @media (min-width: 760px) {
    .steps { grid-template-columns: repeat(4, 1fr); gap: 0; }
    .step { flex-direction: column; align-items: center; text-align: center; gap: 14px; }
    .step-top { width: 100%; justify-content: center; position: relative; }
    .step-top::before, .step-top::after { content: ""; position: absolute; top: 50%; height: 2px; background: var(--color-hairline); border-radius: 1px; width: 50%; }
    .step-top::before { right: 50%; margin-right: 23px; }
    .step-top::after { left: 50%; margin-left: 23px; }
    .step:first-child .step-top::before { display: none; }
    .step:last-child .step-top::after { display: none; }
    .step-text { align-items: center; padding: 0 8px; }
    .band { padding-top: 80px; padding-bottom: 80px; }
    .band-lg { padding-top: 96px; padding-bottom: 96px; }
    .g-2 { grid-template-columns: 1fr 1fr; }
    .g-3 { grid-template-columns: 1fr 1fr 1fr; }
    .g-4 { grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px; }
    .g-intent { grid-template-columns: 1fr 1fr; gap: 16px; }
    .sticky-bar { display: none !important; }
    .nav-menu { display: flex; }
    .only-mobile { display: none; }
    .only-desktop { display: inline; }
    .board-search { width: 300px; }
    .board-row { grid-template-columns: 1fr 110px 110px; align-items: center; gap: 14px; }
    .board-head { display: grid; background: var(--color-canvas-soft); padding: 13px 4px; }
    .board-cat { display: block; }
    .fund-tabs { justify-content: center; }
    .pay-row { grid-template-columns: 320px 1fr; gap: 16px; align-items: baseline; }
    .footer-grid { grid-template-columns: auto 1fr; gap: 44px; align-items: center; }
    .footer-logo { height: 96px; }
  }
  @media (min-width: 860px) {
    .ncs-row { grid-template-columns: 56px 220px 1fr 56px 96px; gap: 16px; align-items: center; padding: 14px 24px; }
    .ncs-row > :nth-child(3) { grid-column: auto; }
    .ncs-head { display: grid; background: var(--color-canvas-soft); font-weight: 700; color: var(--color-body-strong); font-size: 13.5px; padding: 12px 24px; }
    .ncs-sub { display: block; color: var(--color-muted); font-size: 13.5px; }
  }
  @media (min-width: 900px) { .sub-oneline { white-space: nowrap; } }
  @media (min-width: 1000px) { .g-intent { grid-template-columns: 1fr 1fr 1fr 1fr; } }
  @media (min-width: 1100px) { .awards-list { justify-content: space-between; flex: 1; } }

  @keyframes menuDown { from { transform: translateY(-14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  @media (prefers-reduced-motion: no-preference) {
    .rise { animation: rise .5s cubic-bezier(0.2,0,0,1) both; }
    @keyframes rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
  }
}
```

- [ ] **Step 2: 빌드 확인** — Run: `pnpm build` · Expected: 성공(아직 페이지는 기본 page.tsx). 에러 없으면 OK.
- [ ] **Step 3: Commit** — `git add src/app/globals.css && git commit -m "feat: 디자인 토큰 Tailwind @theme 등록 및 레이아웃 헬퍼 이식"`

### Task 2: layout.tsx — Pretendard + 한국어 + 메타

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: layout.tsx 교체** (Geist 제거, Pretendard CDN, `lang="ko"`, 셸은 Task 18에서 추가하므로 일단 children만)

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "성요셉목수학교 — 국비지원 목공·집수리·인테리어 직업훈련",
  description:
    "내일배움카드(국민내일배움카드) 국비지원 목공·집수리·인테리어 직업훈련. 자격 확인부터 과정 안내까지 전화 한 통으로.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: 빌드** — Run: `pnpm build` · Expected: 성공.
- [ ] **Step 3: Commit** — `git commit -am "feat: 루트 레이아웃 Pretendard·한국어·메타 적용"`

### Task 3: 에셋 복사

**Files:** Create under `public/`

- [ ] **Step 1: 로고/이미지 복사**

```bash
cd /Users/seulgi/workspace/yoseph365
mkdir -p public/logo public/banners public/awards public/videos
cp "/Users/seulgi/Documents/성요셉/design_handoff_seongyoseph_site/assets/logo-primary.png" public/logo/
cp "/Users/seulgi/Documents/성요셉/design_handoff_seongyoseph_site/assets/logo-on-dark.png" public/logo/
cp "/Users/seulgi/Documents/성요셉/design_handoff_seongyoseph_site/ui_kits/website/assets/"banner-*.png public/banners/
cp "/Users/seulgi/Documents/성요셉/design_handoff_seongyoseph_site/ui_kits/website/assets/"award-*.png public/awards/
cp "/Users/seulgi/Documents/성요셉/design_handoff_seongyoseph_site/ui_kits/website/assets/"video-*.png public/videos/
```

- [ ] **Step 2: 확인** — Run: `ls public/logo public/banners public/awards public/videos` · Expected: 로고 2, 배너 6, 수상 2, 영상 2.
- [ ] **Step 3: Commit** — `git add public && git commit -m "chore: 디자인 핸드오프 로고·배너·이미지 에셋 복사"`

### Task 4: Vitest + RTL 설정

**Files:**
- Modify: `package.json` (deps + test script)
- Create: `vitest.config.ts`, `vitest.setup.ts`

- [ ] **Step 1: 의존성 설치**

```bash
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: `vitest.config.ts` 생성**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: { alias: { "@": resolve(__dirname, "./src") } },
});
```

- [ ] **Step 3: `vitest.setup.ts` 생성**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: `package.json` scripts에 추가** — `"test": "vitest run"`, `"test:watch": "vitest"`
- [ ] **Step 5: 동작 확인** — Run: `pnpm test` · Expected: "No test files found" (정상, 아직 테스트 없음).
- [ ] **Step 6: Commit** — `git add -A && git commit -m "chore: Vitest + React Testing Library 테스트 인프라 구성"`

---

## Phase 1 — 아이콘 & 프리미티브

### Task 5: 아이콘 세트 (`components/icons/`)

**Files:**
- Create: `src/components/icons/index.tsx`

**참조:** `HANDOFF/ui_kits/website/icons.jsx` — 각 Icon 컴포넌트의 SVG path를 그대로 옮긴다. 21종: Phone, Users, Home, Award, Wallet, CheckCircle, Check, Clipboard, MapPin, ChevronRight, Calendar, Image, Quote, X, Hammer, Armchair, TrendingUp, Star, Clock, FileText, Message, Menu.

- [ ] **Step 1: 공통 타입 + 아이콘 작성** — 각 아이콘은 `({ size = 24, strokeWidth = 1.9, className }: IconProps)` 시그니처, `<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>` 안에 해당 path. 핸드오프의 `sw` prop은 `strokeWidth`로 매핑. SVG 내용은 `HANDOFF/ui_kits/website/icons.jsx`에서 그대로 복사.

```tsx
export interface IconProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}
// 예: Phone
export function Phone({ size = 24, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {/* HANDOFF icons.jsx 의 Phone path */}
    </svg>
  );
}
// …나머지 20종 동일 패턴
```

- [ ] **Step 2: 빌드** — Run: `pnpm build` · Expected: 성공.
- [ ] **Step 3: Commit** — `git add src/components/icons && git commit -m "feat: Lucide 인라인 아이콘 세트 추가"`

### Task 6: Button (`components/ui/Button.tsx`)

**Files:**
- Create: `src/components/ui/Button.tsx`

**참조:** `HANDOFF/ui_kits/website/ui.jsx:4-26`

- [ ] **Step 1: 작성** — `variant: "primary"|"outline"|"ghost"|"dark"`, `size: "sm"|"md"|"lg"`, `fullWidth?`, `leftIcon?`, 그 외 `ButtonHTMLAttributes` 스프레드. 사이즈: sm `h-10 px-4 text-[15px]`, md `h-12 px-[22px] text-[17px]`, lg `h-14 px-[26px] text-[18px]`. variant: primary `bg-primary text-white border border-primary hover:bg-primary-hover`, outline `bg-transparent text-ink border border-hairline-strong`, ghost `text-primary border border-transparent`, dark `bg-white text-ink border border-white`. 공통 `inline-flex items-center justify-center gap-2 rounded-button font-semibold leading-none tracking-[-0.2px] whitespace-nowrap transition active:scale-[0.98]`. `fullWidth` → `w-full`.

```tsx
import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "outline" | "ghost" | "dark";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
}
// className 조합은 위 규칙대로. clsx 없이 템플릿 문자열 + 조건부로 충분.
```

- [ ] **Step 2: 빌드** — `pnpm build` · Expected: 성공.
- [ ] **Step 3: Commit** — `git commit -am "feat: Button 프리미티브 추가"`

### Task 7: Badge & Card (`components/ui/`)

**Files:** Create `src/components/ui/Badge.tsx`, `src/components/ui/Card.tsx`

**참조:** Badge `ui.jsx:28-44`, Card `ui.jsx:46-57`.

- [ ] **Step 1: Badge** — `tone: "neutral"|"ink"|"success"|"solid"`, `dot?`. neutral `bg-surface-strong text-body-strong`, ink `bg-surface-strong text-ink`, success `bg-success-soft text-success`, solid `bg-primary text-white`. 공통 `inline-flex items-center gap-1.5 text-[13px] font-semibold leading-[1.3] px-3 py-[5px] rounded-full whitespace-nowrap`. `dot` → 6px 원 `bg-current`.
- [ ] **Step 2: Card** — `interactive?`, `padding?`(기본 20), children + 기타 div props. `bg-surface-card border border-hairline rounded-lg shadow-card`. interactive면 `transition hover:-translate-y-0.5 hover:border-hairline-strong hover:shadow-card-hover cursor-pointer`. padding은 인라인 `style={{ padding }}` 허용(가변값).
- [ ] **Step 3: 빌드** — `pnpm build` · Expected: 성공.
- [ ] **Step 4: Commit** — `git commit -am "feat: Badge·Card 프리미티브 추가"`

### Task 8: 콘텐츠 프리미티브 (`components/ui/`)

**Files:** Create `IntentCard.tsx`, `CourseRow.tsx`, `TrustBadge.tsx`, `ProcessStep.tsx`, `SectionHeading.tsx`, `PhotoSlot.tsx` (모두 `src/components/ui/`)

**참조:** `ui.jsx:59-150`. IntentCard tint 맵(none/rose/peach/lavender/sky)·CourseRow(name/startDate/meta/status/open/last + Link or onClick)·TrustBadge·ProcessStep·SectionHeading(eyebrow/title:ReactNode/sub/align, h2 `font-display [clamp(26px,3.4vw,36px)]`)·PhotoSlot(ratio/label/radius, `bg-surface-strong border border-hairline`)를 변환 규칙대로 이식.

- [ ] **Step 1: 6개 컴포넌트 작성** — IntentCard·CourseRow는 클릭 시 네비게이션이 필요하면 `href`(Link) 또는 `onClick` 둘 다 받도록 optional props. CourseRow는 `<button>` 유지(onClick) — 홈에서 apply 시트/페이지 트리거.
- [ ] **Step 2: 빌드** — `pnpm build` · Expected: 성공.
- [ ] **Step 3: Commit** — `git commit -am "feat: IntentCard·CourseRow·TrustBadge·ProcessStep·SectionHeading·PhotoSlot 추가"`

### Task 9: Input / Field (`components/ui/Field.tsx`)

**Files:** Create `src/components/ui/Field.tsx`

**참조:** `HANDOFF/components/forms/Input.jsx` + `App.jsx:23-42`(Field, ReqLabel).

- [ ] **Step 1: 작성** — `Field({ label, hint?, error?, required?, ...inputProps })` + `ReqLabel`(필수 `*` 표시). 52px 높이, `rounded-button`, focus 시 `focus:border-2 focus:border-primary`. error면 빨강 hint. 별도 `Textarea` variant 또는 `as="textarea"` 지원.
- [ ] **Step 2: 빌드** — `pnpm build` · Expected: 성공.
- [ ] **Step 3: Commit** — `git commit -am "feat: Field·ReqLabel 폼 프리미티브 추가"`

---

## Phase 2 — 레이아웃 & 오버레이 (로직은 TDD)

### Task 10: Container & Section (`components/layout/`)

**Files:** Create `src/components/layout/Container.tsx`, `Section.tsx`

- [ ] **Step 1:** `Container`는 `<div className="wrap">{children}</div>`(추가 className 머지). `Section`은 `band`/`band-lg` variant + 배경 토큰 prop. 둘 다 서버 컴포넌트.
- [ ] **Step 2: 빌드** — `pnpm build` · Expected: 성공.
- [ ] **Step 3: Commit** — `git commit -am "feat: Container·Section 레이아웃 래퍼 추가"`

### Task 11: BottomSheet (TDD, `components/overlay/`)

**Files:** Create `src/components/overlay/BottomSheet.tsx`, Test `src/components/overlay/BottomSheet.test.tsx`

**참조:** `App.jsx:3-21`.

- [ ] **Step 1: 실패 테스트 작성**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { BottomSheet } from "./BottomSheet";

describe("BottomSheet", () => {
  it("open=false면 내용이 렌더되지 않는다", () => {
    render(<BottomSheet open={false} onClose={() => {}} title="제목">내용</BottomSheet>);
    expect(screen.queryByText("내용")).not.toBeInTheDocument();
  });
  it("open=true면 제목과 내용을 보여준다", () => {
    render(<BottomSheet open onClose={() => {}} title="제목">내용</BottomSheet>);
    expect(screen.getByText("제목")).toBeInTheDocument();
    expect(screen.getByText("내용")).toBeInTheDocument();
  });
  it("닫기 버튼 클릭 시 onClose 호출", async () => {
    const onClose = vi.fn();
    render(<BottomSheet open onClose={onClose} title="제목">내용</BottomSheet>);
    await userEvent.click(screen.getByRole("button", { name: /닫기/ }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: 실패 확인** — Run: `pnpm test BottomSheet` · Expected: FAIL (모듈 없음).
- [ ] **Step 3: 구현** — `'use client'`. `open` false면 `null`. dim 배경(클릭 시 onClose) + 슬라이드업 패널(`animation: sheetUp`), 핸들 바, 제목 + 닫기 버튼(`aria-label="닫기"`, `X` 아이콘), children. 스타일은 변환 규칙대로(인라인 → 유틸/arbitrary).
- [ ] **Step 4: 통과 확인** — Run: `pnpm test BottomSheet` · Expected: PASS (3).
- [ ] **Step 5: Commit** — `git add src/components/overlay/BottomSheet* && git commit -m "feat: BottomSheet 오버레이 추가 (TDD)"`

### Task 12: ConsultSheet + InquiryForm (TDD, `components/overlay/`)

**Files:** Create `src/components/overlay/ConsultSheet.tsx`, Test `ConsultSheet.test.tsx`

**참조:** `App.jsx:44-146`(INQUIRY_COURSES, InquiryForm, ConsultSheet). apply 모드는 **제외**(apply는 전용 페이지). 모드: `"consult"`(무료 상담 폼) / `"inquiry"`(문의 폼). 제출 시 내부 `done` 상태 → mock 완료 화면.

- [ ] **Step 1: 실패 테스트**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { ConsultSheet } from "./ConsultSheet";

describe("ConsultSheet", () => {
  it("consult 모드: 상담 신청 후 완료 메시지 표시", async () => {
    render(<ConsultSheet open mode="consult" onClose={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: /상담 신청하기/ }));
    expect(screen.getByText(/접수되었어요|안내해 드립니다/)).toBeInTheDocument();
  });
  it("inquiry 모드: 강좌 선택 토글이 동작한다", async () => {
    render(<ConsultSheet open mode="inquiry" onClose={() => {}} />);
    const first = screen.getByLabelText(/집수리과정/);
    await userEvent.click(first);
    expect(first).toBeChecked();
  });
});
```

- [ ] **Step 2: 실패 확인** — `pnpm test ConsultSheet` · Expected: FAIL.
- [ ] **Step 3: 구현** — `'use client'`. `BottomSheet`로 감싸고, `useState(done)`로 폼/완료 전환. consult 폼(전화 안내 + 이름/연락처/관심과정 Field + "상담 신청하기"), inquiry 폼(InquiryForm: 이름·연락처 3분할·강좌 체크리스트·추가문의 textarea·제출). 제출은 `setDone(true)`만(백엔드 없음).
- [ ] **Step 4: 통과 확인** — `pnpm test ConsultSheet` · Expected: PASS (2).
- [ ] **Step 5: Commit** — `git add src/components/overlay/ConsultSheet* && git commit -m "feat: ConsultSheet 상담·문의 시트 추가 (TDD)"`

### Task 13: Header + MobileMenu (`components/layout/`)

**Files:** Create `src/components/layout/Header.tsx`, `MobileMenu.tsx`

**참조:** `sections.jsx:72-158`, NAV_FUNDING `sections.jsx:7-11`.

- [ ] **Step 1:** `'use client'`(드롭다운·모바일 메뉴 상태). sticky blur 헤더, 로고(`/logo/logo-primary.png`, `next/image`, h-36px), 데스크톱 nav(`.nav-menu`) + 국비지원 hover 드롭다운(NAV_FUNDING 3항목 → `/funding#...`), 수강신청 `<Link href="/apply">` 버튼, 모바일 "메뉴" 버튼(`.only-mobile`) → MobileMenu. `active` prop으로 현재 메뉴 강조. 링크는 모두 `next/link`.
- [ ] **Step 2: 빌드** — `pnpm build` · Expected: 성공.
- [ ] **Step 3: Commit** — `git commit -am "feat: Header·MobileMenu 네비게이션 추가"`

### Task 14: StickyBar (`components/layout/`)

**Files:** Create `src/components/layout/StickyBar.tsx`

**참조:** `App.jsx:148-158`.

- [ ] **Step 1:** `'use client'`. 우하단 고정 FAB(`.sticky-bar`, ≥760px CSS로 숨김), `onConsult` 클릭 → 상담 시트. 전화 아이콘 + "상담문의".
- [ ] **Step 2: 빌드** — `pnpm build` · Expected: 성공.
- [ ] **Step 3: Commit** — `git commit -am "feat: 모바일 상담 StickyBar 추가"`

### Task 15: Banner 캐러셀 (TDD, `components/layout/`)

**Files:** Create `src/components/layout/Banner.tsx`, Test `Banner.test.tsx`

**참조:** `sections.jsx:408-450`. 슬라이드 6종(`/banners/banner-0N-*.png`).

- [ ] **Step 1: 실패 테스트** (dot 클릭으로 인덱스 변경, 자동재생은 fake timer)

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { Banner } from "./Banner";

describe("Banner", () => {
  it("초기 인디케이터는 1 / 6", () => {
    render(<Banner />);
    expect(screen.getByText("1 / 6")).toBeInTheDocument();
  });
  it("두번째 dot 클릭 시 인디케이터가 2 / 6", async () => {
    render(<Banner />);
    await userEvent.click(screen.getByRole("button", { name: "슬라이드 2" }));
    expect(screen.getByText("2 / 6")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 실패 확인** — `pnpm test Banner` · Expected: FAIL.
- [ ] **Step 3: 구현** — `'use client'`. `useState(i)`, `useEffect`로 5초 setInterval 자동 전환, translateX 트랙, dot 버튼(`aria-label="슬라이드 N"`), `i+1 / n` 인디케이터. 이미지 클릭 핸들러(`act`)는 `onConsult`/`onSchedule` optional prop으로(없으면 무동작). `prefers-reduced-motion` 시 자동재생 정지.
- [ ] **Step 4: 통과 확인** — `pnpm test Banner` · Expected: PASS (2).
- [ ] **Step 5: Commit** — `git add src/components/layout/Banner* && git commit -m "feat: 배너 캐러셀 추가 (TDD)"`

### Task 16: AwardsStrip + SocialLinks (`components/layout/`)

**Files:** Create `src/components/layout/AwardsStrip.tsx`

**참조:** `sections.jsx:13-70`(SNS_LINKS, AWARDS, SocialLinks, AwardsStrip).

- [ ] **Step 1:** SNS 링크 3종(유튜브/블로그/인스타, 외부 링크 placeholder)+ AWARDS 5종 가로 스트립. SNS 아이콘 노드는 핸드오프대로. 서버 컴포넌트 가능.
- [ ] **Step 2: 빌드** — `pnpm build` · Expected: 성공.
- [ ] **Step 3: Commit** — `git commit -am "feat: AwardsStrip·SocialLinks 추가"`

### Task 17: Footer (`components/layout/`)

**Files:** Create `src/components/layout/Footer.tsx`

**참조:** `sections.jsx:367-405`.

- [ ] **Step 1:** 로고 + 사업자 정보 4행(rows 데이터 그대로) + 수상 이력 리스트 + 카피라이트. `.footer-grid` 사용. 서버 컴포넌트.
- [ ] **Step 2: 빌드** — `pnpm build` · Expected: 성공.
- [ ] **Step 3: Commit** — `git commit -am "feat: Footer 추가"`

### Task 18: 앱 셸 — 상담 시트 컨텍스트 (`components/layout/`)

**Files:** Create `src/components/layout/SiteShell.tsx`; Modify `src/app/(public)/layout.tsx` (생성)

**목적:** Header(데스크톱)·StickyBar(모바일)·페이지 곳곳의 CTA가 같은 ConsultSheet를 열도록 client 컨텍스트로 묶는다.

- [ ] **Step 1:** `SiteShell`(`'use client'`) — `useState`로 시트 모드(`null|"consult"|"inquiry"`) 관리, `ConsultContext` 제공(`openConsult(mode)`). Header·children·Footer·StickyBar·ConsultSheet 렌더. `useConsult()` 훅 export.
- [ ] **Step 2:** `src/app/(public)/layout.tsx` 생성 — `<SiteShell>{children}</SiteShell>`.
- [ ] **Step 3: 빌드** — `pnpm build` · Expected: 성공.
- [ ] **Step 4: Commit** — `git commit -am "feat: SiteShell 상담 시트 컨텍스트·공개 레이아웃 추가"`

---

## Phase 3 — 홈 섹션 & 홈 페이지

### Task 19: HeroIntent (`components/sections/`)

**Files:** Create `src/components/sections/HeroIntent.tsx`
**참조:** `sections.jsx:161-185`. intents 4종(데이터 그대로). IntentCard 클릭 → schedule 섹션 스크롤(또는 `/courses`).
- [ ] **Step 1:** 작성(`g-intent` 그리드, `.hero-head`). intent 클릭은 `onPick` prop.
- [ ] **Step 2: 빌드** — `pnpm build` · Expected: 성공. **Commit**: `git commit -am "feat: HeroIntent 섹션 추가"`

### Task 20: Barriers (`components/sections/`)
**Files:** Create `src/components/sections/Barriers.tsx`
**참조:** `sections.jsx:188-248`. benefits 4 + steps 4(`.steps` 타임라인) + "지금 자격 확인하기" CTA(→ 상담 시트, `useConsult`).
- [ ] **Step 1:** 작성. **Step 2:** `pnpm build` 성공. **Commit**: `git commit -am "feat: Barriers 섹션 추가"`

### Task 21: SocialProof + AwardHighlight (`components/sections/`)
**Files:** Create `src/components/sections/SocialProof.tsx`
**참조:** `sections.jsx:251-305`. PhotoSlot 6 + "훈련 사진 전체보기"(`/photos`) + 잉크 패널 + AwardHighlight 3(award 이미지 `/awards/`). 주: `--color-gradient-amber`는 토큰에 없음 → peach 계열 arbitrary value로 대체(`#e8956a` 등 핸드오프 fallback 값 사용).
- [ ] **Step 1:** 작성. **Step 2:** `pnpm build` 성공. **Commit**: `git commit -am "feat: SocialProof 섹션 추가"`

### Task 22: Videos + VideoCard (`components/sections/`)
**Files:** Create `src/components/sections/Videos.tsx`
**참조:** `sections.jsx:520-573`. VIDEOS 2종(`/videos/` 썸네일). VideoCard는 `'use client'`(재생 토글 → youtube-nocookie iframe).
- [ ] **Step 1:** 작성. **Step 2:** `pnpm build` 성공. **Commit**: `git commit -am "feat: Videos 섹션 추가"`

### Task 23: Schedule (`components/sections/`)
**Files:** Create `src/components/sections/Schedule.tsx`
**참조:** `sections.jsx:308-340`. courses 5종(데이터를 Task 26 `lib/data`로 분리해도 됨; 여기선 일단 상수). CourseRow 클릭 → `onApply(name)`(상담/페이지). "과정 안내 전체보기"(`/courses`). **개강일 없음**(평일반/주말반만) 규칙 유지.
- [ ] **Step 1:** 작성. **Step 2:** `pnpm build` 성공. **Commit**: `git commit -am "feat: Schedule 섹션 추가"`

### Task 24: ClosingCTA (`components/sections/`)
**Files:** Create `src/components/sections/ClosingCTA.tsx`
**참조:** `sections.jsx:343-365`. 블루 밴드 + orb + "전화로 무료 상담"(→ 시트) + 전화번호 `tel:`.
- [ ] **Step 1:** 작성. **Step 2:** `pnpm build` 성공. **Commit**: `git commit -am "feat: ClosingCTA 섹션 추가"`

### Task 25: 홈 페이지 조립 (`app/(public)/page.tsx`)
**Files:** Modify `src/app/page.tsx` → 이동/교체 `src/app/(public)/page.tsx`
**참조:** `App.jsx:184-201`.
- [ ] **Step 1:** 기존 `src/app/page.tsx` 삭제, `src/app/(public)/page.tsx` 생성: Banner→AwardsStrip→HeroIntent→Barriers→SocialProof→Videos→Schedule→ClosingCTA 순. intent/CourseRow 클릭으로 schedule 스크롤·상담 시트 연결(client wrapper 필요 시 작은 `'use client'` 섹션 래퍼).
- [ ] **Step 2: 시각 검증** — Run: `pnpm dev` 후 브라우저(또는 /browse 스킬)로 `http://localhost:3000` 데스크톱·모바일 폭 확인: 핸드오프 `HANDOFF/ui_kits/website/index.html`과 레이아웃 일치.
- [ ] **Step 3: 빌드/린트** — `pnpm build && pnpm lint` · Expected: 성공.
- [ ] **Step 4: Commit** — `git commit -am "feat: 홈 페이지 조립"`

---

## Phase 4 — 표시 데이터 & 나머지 페이지

### Task 26: lib/data (표시 데이터 + 타입)
**Files:** Create `src/lib/data/courses.ts`, `awards.ts`, `inquiries.ts`, `site.ts`
- [ ] **Step 1:** 핸드오프 곳곳의 하드코딩 데이터를 타입과 함께 모은다 — 과정 목록(courses/Schedule/apply용), 수상 이력(AWARDS), 게시판 행(inquiry), 사이트 상수(PHONE `031-123-4567`/`032-678-3650`, 주소, 상담시간). **백엔드 연결 지점**을 주석으로 명시. 기존 섹션이 인라인 상수를 쓰면 점진적으로 이 모듈을 import하도록 교체(외과적).
- [ ] **Step 2: 빌드** — `pnpm build` · Expected: 성공. **Commit**: `git commit -am "feat: 표시 데이터 lib/data 분리 및 타입 정의"`

### Task 27: /courses
**Files:** Create `src/app/(public)/courses/page.tsx`
**참조:** `sections.jsx:454-490`(PageHero, CourseCatalog) + `HANDOFF/ui_kits/website/courses.html`/`courses.jsx`(상세 — 읽고 반영).
- [ ] **Step 1:** PageHero + CourseCatalog(과정 카드). "수강 신청" → `/apply?course=`. **Step 2:** `pnpm build` 성공. 시각 검증. **Commit**: `git commit -am "feat: 과정 안내 페이지 추가"`

### Task 28: /apply (3단계 위저드, TDD)
**Files:** Create `src/app/(public)/apply/page.tsx`, `src/components/apply/ApplyFlow.tsx` + `ApplyFlow.test.tsx`, 단계 컴포넌트(ApplySteps, ApplyInfoStep, ApplyFormStep, ApplyDone)
**참조:** `HANDOFF/ui_kits/website/apply.jsx`, `apply-flow.jsx` 전체. APPLY_INFO·APPLY_COURSES 데이터 그대로.

> **도메인 메모(스펙 §7):** 이 페이지는 핸드오프대로 분기 없는 온라인 위저드로 포팅한다. `funding_type` A/B/C 분기는 백엔드 연결 시 재구성(열린 항목). 모집안내의 날짜(교육일정 등)는 핸드오프 application-info 콘텐츠로 포함하되, 백엔드 때 "신청 시 안내" 규칙과 함께 재검토.

- [ ] **Step 1: 실패 테스트** (step 전환)

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { ApplyFlow } from "@/components/apply/ApplyFlow";

describe("ApplyFlow", () => {
  it("모집안내에서 '확인했어요'를 누르면 신청서 단계로 간다", async () => {
    render(<ApplyFlow course="건축목공 입문과정" />);
    expect(screen.getByText(/모집안내/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /신청서 작성하기/ }));
    expect(screen.getByText(/성명/)).toBeInTheDocument();
  });
  it("동의 전에는 제출이 완료로 넘어가지 않는다", async () => {
    render(<ApplyFlow course="건축목공 입문과정" />);
    await userEvent.click(screen.getByRole("button", { name: /신청서 작성하기/ }));
    await userEvent.click(screen.getByRole("button", { name: /신청서 제출하기/ }));
    expect(screen.queryByText(/접수가 완료/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 실패 확인** — `pnpm test ApplyFlow` · Expected: FAIL.
- [ ] **Step 3: 구현** — `'use client'`. ApplySteps(진행 표시) + ApplyInfoStep → ApplyFormStep(개인정보 동의 체크 시에만 제출) → ApplyDone. page.tsx는 `?course=` 읽어 프리필(`useSearchParams`), PageHero 래핑.
- [ ] **Step 4: 통과 확인** — `pnpm test ApplyFlow` · Expected: PASS (2).
- [ ] **Step 5: 빌드/시각** — `pnpm build` 성공 + 시각 검증. **Commit**: `git commit -am "feat: 수강신청 3단계 위저드 페이지 추가 (TDD)"`

### Task 29: /funding
**Files:** Create `src/app/(public)/funding/page.tsx`
**참조:** `HANDOFF/ui_kits/website/funding.jsx`/`funding.html` 전체(읽고 반영). 서브탭(`.fund-tabs`)·NCS 일정표(`.ncs-row/.ncs-head`)·훈련수당(`.pay-row`)·고용24 **링크 안내만**.
- [ ] **Step 1:** 작성(탭 전환은 `'use client'` 또는 앵커 `#nbcard/#process/#sanjae`). **Step 2:** `pnpm build` 성공 + 시각 검증. **Commit**: `git commit -am "feat: 국비지원 페이지 추가"`

### Task 30: /about
**Files:** Create `src/app/(public)/about/page.tsx`
**참조:** `HANDOFF/ui_kits/website/about.jsx`/`about.html`. PageHero + 소개 + LocationInfo(`sections.jsx:492-518`).
- [ ] **Step 1:** 작성. **Step 2:** `pnpm build` 성공 + 시각 검증. **Commit**: `git commit -am "feat: 학원소개 페이지 추가"`

### Task 31: /inquiry + /inquiry/[id]
**Files:** Create `src/app/(public)/inquiry/page.tsx`, `src/app/(public)/inquiry/[id]/page.tsx`
**참조:** `HANDOFF/ui_kits/website/inquiry.jsx`/`inquiry.html`/`inquiry-detail.html`. 게시판 목록(`.board-row/.board-head`) + 검색 + 문의 작성(→ 시트), 상세 페이지. 데이터는 `lib/data/inquiries.ts`.
- [ ] **Step 1:** 작성(`[id]`는 동적 라우트, mock 데이터에서 조회). **Step 2:** `pnpm build` 성공 + 시각 검증. **Commit**: `git commit -am "feat: 상담문의 게시판·상세 페이지 추가"`

### Task 32: /photos
**Files:** Create `src/app/(public)/photos/page.tsx`
**참조:** `HANDOFF/ui_kits/website/photos.html`. PageHero + PhotoSlot 갤러리 그리드.
- [ ] **Step 1:** 작성. **Step 2:** `pnpm build` 성공 + 시각 검증. **Commit**: `git commit -am "feat: 훈련 사진 갤러리 페이지 추가"`

---

## Phase 5 — 마감 점검

### Task 33: 반응형·접근성·최종 검증
**Files:** 전반 점검(필요 시 수정)
- [ ] **Step 1:** 각 페이지 모바일(<760)/태블릿(760~999)/데스크톱(≥1000) 폭에서 핸드오프와 비교(브라우저/스크린샷). 모바일 StickyBar 표시·데스크톱 숨김, nav 전환 확인.
- [ ] **Step 2:** 접근성 — 시트/메뉴 `aria-label`·포커스, `prefers-reduced-motion` 시 캐러셀·entrance 정지, 링크/버튼 역할. CTA의 Phone 아이콘 motif 유지.
- [ ] **Step 3: 전체 검증** — Run: `pnpm test && pnpm build && pnpm lint` · Expected: 모두 성공(테스트 통과·빌드·린트 0 에러).
- [ ] **Step 4: Commit** — `git commit -am "fix: 반응형·접근성 마감 점검 및 보정"`

---

## 자체 검토 (작성자 체크 결과)

- **스펙 커버리지:** 토큰(T1)·폰트(T2)·에셋(T3)·테스트인프라(T4)·아이콘(T5)·프리미티브(T6-9)·레이아웃/오버레이(T10-18)·홈(T19-25)·데이터(T26)·전 페이지(T27-32)·반응형/a11y(T33) — 스펙 §3~7 전 항목 대응. 도메인 규칙 §7은 T23(개강일 없음)·T28(apply 분기 메모)·시트/페이지 패턴(T18/T28)으로 반영.
- **열린 항목:** apply A/B/C 분기, 데이터 4상태(로딩/빈/에러)는 의도적으로 백엔드 단계로 이연(스펙 §7·§8) — 본 계획 비범위.
- **타입 일관성:** `IconProps`(T5)·`Button`/`Card`/`Field` props가 후속 태스크에서 동일 시그니처로 사용됨. `useConsult()`(T18)는 T20/T24/T31에서 동일 이름으로 호출. CourseRow `onApply`(T23)·ApplyFlow `course` prop(T28) 일치.
- **플레이스홀더:** 토큰/설정/테스트는 전체 코드 제공. 포팅 태스크는 핸드오프 파일:라인 참조 + 변환 규칙 + 정확한 데이터/카피 명시(기계적 변환이며 핸드오프가 source of truth) — "TBD/유사하게" 없음.
