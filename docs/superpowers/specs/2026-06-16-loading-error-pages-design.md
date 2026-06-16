# 로딩·에러 페이지 구현 설계

작성일: 2026-06-16
출처: `~/Downloads/design_handoff_loading_error/` (loading.html, error.html, README.md)

## 배경

직업훈련기관 공개 사이트(주 사용자 40~50대, 모바일·전화 선호)에 로딩 상태와
에러 페이지를 추가한다. 핸드오프는 로딩 3종(splash/skeleton/inline)·에러 3종
(404/500/network)을 보여주지만, README가 명시하듯 **토글은 개발용 데모이며 실제
앱은 라우팅에 따라 한 상태만 렌더**한다. 따라서 6개 상태를 Next.js App Router의
실제 메커니즘에 매핑해 필요한 것만 구현한다.

## 스택·환경 확인 (구현 전 검증 완료)

- Next.js **16.2.9** (App Router) / React 19 / Tailwind v4 / Vitest + Testing Library
- `node_modules/next/dist/docs` 확인 결과:
  - `error.js`: 클라이언트 컴포넌트. **복구 prop은 `unstable_retry`** (v16.2.0 신규,
    `reset`보다 권장). 같은 세그먼트의 `layout.js`는 감싸지 않음(루트 레이아웃 에러는
    `global-error` 영역).
  - `not-found.js`: 서버 컴포넌트, props 없음, `metadata` export 지원. 루트
    `app/not-found.tsx`는 `notFound()` 호출 + **매칭되지 않는 모든 URL**(404)을 처리.
  - `loading.js`: 서버 컴포넌트, params 없음. 세그먼트 Suspense fallback. **공유
    레이아웃(Header/Footer)은 로딩 중에도 유지·인터랙티브**.

## 범위 (확정)

만든다:
- `src/app/(public)/loading.tsx` — 스켈레톤 (본문만)
- `src/app/not-found.tsx` — 404 (단독 풀스크린)
- `src/app/error.tsx` — 일시 오류 / 500 (단독 풀스크린, 네트워크 통합)
- `src/components/layout/RoofMark.tsx` — 워드마크 없는 지붕 마크 (공용)
- `src/components/icons/index.tsx`에 `Reload` 아이콘 추가
- `src/app/globals.css`에 스켈레톤 클래스(`.sk`/`.sk-card`/`.sk-thumb`) + `shimmer`

만들지 않는다 (사용자 확인):
- 전체화면 스플래시(자동 트리거 없음 — YAGNI)
- 인라인 스피너 재사용 컴포넌트(현재 사용처 없음)
- 별도 네트워크 에러 변형(500에 통합)
- `global-error.tsx`(루트 레이아웃 에러는 범위 밖)

## 컴포넌트별 설계

### 1. `(public)/loading.tsx` — 스켈레톤 (서버 컴포넌트)

- SiteShell의 `<main>` 안에 렌더되며 Header/Footer/StickyBar는 레이아웃에 유지된다.
  → **헤더를 중복으로 그리지 않는다**(단독 HTML 목업과의 핵심 차이).
- 구성: `.wrap.band` 안에
  - 중앙 정렬 헤딩 스켈레톤 3줄(라벨 120×14 pill, 제목 440×34, 부제 560×16)
  - `.grid.g-3`에 `.sk-card` 3개(각: `.sk-thumb` 4/3 + 제목/본문 라인 블록)
- 접근성: `role="status"` `aria-live="polite"` sr-only 안내("콘텐츠를 불러오는
  중입니다."), 카드 영역은 `aria-hidden`.

### 2. `not-found.tsx` — 404 (서버 컴포넌트, 단독)

- 위치: `src/app`(루트). `app/layout.tsx`(html/body+폰트, 크롬 없음) 안에서 단독
  풀스크린 렌더.
- `export const metadata = { title: "페이지를 찾을 수 없습니다 — 성요셉목수학교" }`
- 레이아웃: 뷰포트 중앙, 상단 8% 옅은 블루 방사형 wash, `max-width:600px`,
  세로 패딩 `clamp(48px,9vw,96px)`, `.rise` 진입 애니메이션.
- 내용: `<RoofMark>`(84px) → 제목 → 설명 → **홈으로 돌아가기** 버튼 1개.
  - 제목: "페이지를 찾을 수 없습니다"
  - 설명: "주소가 바뀌었거나 삭제된 페이지일 수 있어요.<br>아래에서 원하시는
    정보를 찾아보세요." (핸드오프 원문 유지 — 홈 버튼이 "아래")
  - 버튼: `<Link href="/">` + Home 아이콘, primary 스타일(h-14, 18px,
    `bg-primary`). 새로고침 버튼 없음.

### 3. `error.tsx` — 일시 오류 / 500 (클라이언트 컴포넌트, 단독)

- `"use client"`. props: `{ error, unstable_retry }`.
- `(public)` 페이지에서 올라온 런타임 에러를 잡고 `app/layout.tsx` 안에서 단독 렌더.
- `useEffect`로 `console.error(error)` 로깅.
- `<title>`은 React `<title>` 컴포넌트로 설정("오류가 발생했습니다 — 성요셉목수학교").
  (클라이언트 컴포넌트라 `metadata` export 불가)
- 레이아웃: 404와 동일(중앙, wash, rise).
- 내용: `<RoofMark>` → 제목 → 설명 → 버튼 2개.
  - 제목: "일시적인 오류가 발생했어요"
  - 설명: "서버에 문제가 생겼습니다.<br>잠시 후 새로고침해 주세요."
  - 버튼: **홈으로 돌아가기**(`<a href="/">` primary, Home 아이콘) +
    **새로고침**(outline, Reload 아이콘, `onClick={() => unstable_retry()}`).
    `unstable_retry`가 App Router에서 목업 `location.reload()`에 대응하는 관용적 복구.

### 4. `RoofMark` (공용 컴포넌트)

- `src/components/layout/RoofMark.tsx`. props: `{ size?: number; className?: string }`.
- viewBox `0 0 96 96`, 정적. 패스 `M48 18 L16 82` / `M48 18 L80 82` + 바닥
  `line 30,84→66,84`(opacity 0.34). stroke `#2f6fd6`(Logo.tsx와 동일 코발트,
  토큰 아님 — 핸드오프 지정값), `stroke-width:13`, round cap/join. `aria-hidden`.
- Logo.tsx는 마크+워드마크 텍스트가 묶여 있어 그대로 재사용 불가하므로 신규.

### 5. 스켈레톤 CSS (`globals.css` `@layer components`)

기존 "핸드오프 CSS 이식" 패턴(104번째 줄)과 동일하게 추가:
- `.sk` — 배경 `--color-hairline-soft`, `radius-sm`, `overflow:hidden`, `::after`
  흰색 그라데이션 shimmer.
- `@keyframes shimmer` — `translateX(-100%)` → `translateX(100%)`, 1.5s 무한.
- `.sk-card` — 1px hairline + `radius-lg` + `--shadow-card` + padding 18px.
- `.sk-thumb` — `aspect-ratio:4/3` + `radius-md`.
- `@media (prefers-reduced-motion: reduce)`에서 shimmer 2.4s로 완화.

## 접근성·모션

- 에러·404 지붕 마크는 정적(드로잉 애니메이션은 스플래시 전용이라 미구현).
- 스켈레톤 shimmer는 reduced-motion에서 2.4s.
- 기존 `.rise`(globals.css)는 이미 `prefers-reduced-motion: no-preference` 게이트.

## 테스트 (TDD, Vitest + Testing Library)

- `RoofMark.test.tsx`: SVG 마크 2개 패스 + 바닥 line 렌더, `aria-hidden`.
- `not-found` (`NotFound.test.tsx` 또는 인접): 제목 "페이지를 찾을 수
  없습니다" + 홈 링크(`href="/"`) 표시, 새로고침 버튼 없음.
- `error` (`Error.test.tsx`): 제목 "일시적인 오류가 발생했어요" 표시, 새로고침
  클릭 시 주입된 `unstable_retry` mock 호출, 홈 링크(`href="/"`) 존재.
- `loading` (`Loading.test.tsx`): `role="status"` 안내 노출, 스켈레톤 카드 3개.

라우트 특수 파일은 기본 export 함수이므로 직접 import해 렌더하여 테스트한다.

## 검증

- `pnpm test` 통과(신규 테스트 포함)
- `pnpm lint` 통과
- `pnpm build` 통과(라우트 특수 파일 타입·규약 검증)
- preview로 `/존재하지않는경로`(404), 로딩(라우트 전환) 육안 확인

## 커밋 계획 (기능 단위)

1. `feat: 로딩 스켈레톤·에러·404 페이지 추가` (또는 세분화: RoofMark/아이콘 →
   skeleton CSS+loading → not-found → error 순서로 작은 커밋)
