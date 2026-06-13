# 디자인 핸드오프 → 프론트엔드 포팅 설계 (UI only, 1차)

**작성일**: 2026-06-13
**대상**: `~/Documents/성요셉/design_handoff_seongyoseph_site` (클로드 디자인 결과물)을 본 프로젝트 스택으로 이식
**스택**: Next.js 16 (App Router) + TypeScript(strict) + Tailwind v4 + Pretendard
**범위**: 공개 페이지 **UI만**. 백엔드(Supabase·Server Action)는 본 작업 후 별도 연결.

---

## 1. 목표 / 성공 기준

- 핸드오프의 **시각·인터랙션을 충실히 재현**한다(임의 재해석 금지). 디자인 결과물이 source of truth.
- 인라인 스타일 + CSS 변수 → **Tailwind v4 `@theme` 토큰 + 유틸리티**로 변환.
- 디자인 시스템(토큰·프리미티브)과 페이지를 **분리**하고, 재사용 가능한 단위로 컴포넌트화.
- 데이터는 **하드코딩 placeholder**, 폼은 **비동작**(제출 시 mock 완료 화면만). 단, 표시 데이터의 타입/구조는 분리해 백엔드 연결 지점을 명확히 둔다.
- `pnpm build` / `pnpm lint` 통과. TypeScript strict 무오류.

**검증**: 각 페이지가 데스크톱(≥1000px)·태블릿(760~999px)·모바일(<760px)에서 핸드오프와 동일한 레이아웃으로 렌더된다. 캐러셀·모바일 메뉴·상담 시트·영상 재생·apply 위저드가 동작한다.

---

## 2. 출처 / 사실관계 주의

- **포인트 색은 로열 블루 `#2563eb`** (`tokens/colors.css` 기준). README 산문의 `#2e5f95`(deep blue)는 구버전 표현 — **토큰 파일을 따른다.**
- 폰트는 **Pretendard Variable** (jsDelivr 핀 v1.3.9 동적 서브셋). display/body 모두 Pretendard(방향 A). 기존 `layout.tsx`의 Geist는 제거.
- 로고는 **원본 이미지 그대로**(`assets/logo-primary.png`, `assets/logo-on-dark.png`). 색 추출·리컬러·재조판 금지. `public/`로 복사해 사용.
- 핸드오프는 빌드 없는 React18 + Babel standalone. 우리는 React19 + 빌드 → JSX를 **TSX 서버/클라이언트 컴포넌트**로 재작성.

---

## 3. 디렉터리 구조

```
src/
  app/
    globals.css                 # @import tailwind, @theme 토큰, base 리셋, @layer components(레이아웃 헬퍼)
    layout.tsx                  # <html lang="ko">, Pretendard, Header/Footer/StickyBar/ConsultSheet 셸
    (public)/
      page.tsx                  # 홈
      courses/page.tsx
      apply/page.tsx
      funding/page.tsx
      about/page.tsx
      inquiry/page.tsx
      inquiry/[id]/page.tsx
      photos/page.tsx
  components/
    ui/                         # 프리미티브 (대부분 서버 컴포넌트, 상호작용만 'use client')
    layout/                     # Header, Footer, StickyBar, Banner, AwardsStrip, Container, Section
    overlay/                    # BottomSheet, ConsultSheet, MobileMenu ('use client')
    sections/                   # 홈 6섹션 + 서브페이지 공용 섹션(PageHero, LocationInfo 등)
    icons/                      # Lucide 인라인 SVG 컴포넌트 + index 배럴
  lib/
    data/                       # placeholder 표시 데이터 + 타입 (백엔드 연결 지점)
```

---

## 4. 토큰 → Tailwind v4 `@theme` 전략

`globals.css` 한 파일에 정리한다.

1. `@import "tailwindcss";`
2. `@theme` 블록에 토큰 등록:
   - 색: `--color-primary`, `--color-primary-soft/-softer/-border/-hover/-active`, `--color-canvas/-soft/-deep`, `--color-surface-card/-strong/-dark`, `--color-hairline/-soft/-strong`, `--color-ink/-body/-body-strong/-muted/-muted-soft/-on-dark/-on-dark-soft`, `--color-success/-soft`, `--color-error/-soft`, `--color-info/-soft`, `--color-gradient-{mint,peach,lavender,sky,rose}`
   - 폰트: `--font-sans`(= Pretendard 스택), `--font-display`(= sans)
   - 반경: `--radius-{xs,sm,md,lg,xl,button,pill}`
   - 그림자: `--shadow-{card,card-hover,sticky,pop}`
   - 컨테이너: `--container-max: 1120px`
   - 커스텀 스크린: `--breakpoint-*` (760/860/900/1000/1100/640px) — Tailwind v4는 `@theme`의 `--breakpoint-<name>`으로 스크린 추가. 핸드오프 미디어쿼리를 `min-[760px]:` 또는 의미 별칭으로 사용.
   → 등록하면 `bg-primary text-ink border-hairline rounded-button shadow-card` 등 유틸리티 자동 생성.
3. base 리셋(`tokens/base.css` 이식): `box-sizing`, `word-break: keep-all`, `:focus-visible`, 링크/제목 기본값, `body` 폰트/배경.
4. `@layer components`에 **복합 레이아웃 헬퍼**를 그대로 이식(유틸리티로 풀기엔 과한 그리드/타임라인 규칙): `.wrap`, `.band`, `.band-lg`, `.panel`, `.orb`, `.steps/.step/.step-top/.step-text`(4단계 타임라인 연결선), `.g-2/.g-3/.g-4/.g-intent`(반응형 그리드), `.ncs-row/.ncs-head`(국비 일정표), `.board-row/.board-head`(게시판), `.awards-strip/.awards-list`, `.fund-tabs`, `.pay-row`, `.footer-grid/.footer-logo`, `.nav-menu/.only-mobile/.only-desktop`, `@keyframes menuDown/sheetUp/rise`. 단순 1회성 값은 컴포넌트에서 Tailwind 유틸리티/arbitrary value로.

> 원칙: 토큰으로 표현되는 값은 유틸리티, 핸드오프의 구조적 레이아웃 CSS는 `@layer components`로 1:1 이식. 인라인 스타일은 남기지 않는다(파스텔 orb 같은 atmosphere만 arbitrary value 허용).

---

## 5. 컴포넌트 인벤토리

### 5.1 아이콘 (`components/icons/`)
Lucide 21종을 인라인 SVG TSX로: `Phone, Users, Home, Award, Wallet, CheckCircle, Check, Clipboard, MapPin, ChevronRight, Calendar, Image, Quote, X, Hammer, Armchair, TrendingUp, Star, Clock, FileText, Message, Menu`. 공통 props `{ size?, strokeWidth?, className? }`, `currentColor` 상속. 24×24, ~1.9px 라운드 스트로크. 배럴 export.

### 5.2 프리미티브 (`components/ui/`)
| 컴포넌트 | 핵심 props | 비고 |
|---|---|---|
| `Button` | `variant: primary\|outline\|ghost\|dark`, `size: sm\|md\|lg`, `fullWidth`, `leftIcon` | pill 아님, radius-button(12px). primary=블루. press scale 0.98 |
| `Badge` | `tone: neutral\|ink\|success\|solid`, `dot` | success=모집중 전용 |
| `Card` | `interactive`, `padding`, `as` | hover 2px lift(interactive). 서버 컴포넌트; hover는 CSS로 |
| `IntentCard` | `icon, title, desc, tint: none\|rose\|peach\|lavender\|sky`, `href/onClick` | 의도 선택 카드 |
| `CourseRow` | `name, startDate, meta, status, open, href/onClick, last` | "{startDate} 개강" + 모집중 배지. **실제 날짜 없음**(도메인 규칙) |
| `TrustBadge` | `label, sub, icon` | |
| `ProcessStep` | `number, title, desc` | |
| `SectionHeading` | `eyebrow, title(ReactNode), sub, align` | clamp 반응형 폰트 |
| `PhotoSlot` | `ratio, label, radius` | 실제 사진 자리(placeholder) |
| `Input`/`Field` | `label, hint, error, required` + input 속성 | 52px, focus 2px |

> Card hover lift는 핸드오프가 JS state로 처리했지만, **CSS `:hover`/`transition`으로 대체**(서버 컴포넌트 유지, 불필요한 client 경계 제거).

### 5.3 레이아웃 (`components/layout/`)
- `Container` (= `.wrap`), `Section` (= `.band`/`.band-lg` 래퍼)
- `Header` — sticky, blur. 데스크톱 nav(학원소개·과정 안내·국비지원〔드롭다운: 국민내일배움카드 안내/훈련참여절차/산재노동자 직업훈련〕·훈련 사진·상담문의) + 수강신청 버튼. 모바일은 "메뉴" 버튼 → `MobileMenu`. `active` prop으로 현재 메뉴 강조. 드롭다운/모바일 메뉴 상태 → `'use client'`.
- `MobileMenu` — 상단 슬라이드다운 시트.
- `Footer` — 로고 + 사업자 정보 4행 + 수상 이력 + 카피라이트.
- `StickyBar` — 우하단 상담 FAB, ≥760px 숨김(`.sticky-bar`). 클릭 시 ConsultSheet 오픈.
- `Banner` — 5초 자동 캐러셀(translateX), dots, "n / N" 인디케이터. 슬라이드 이미지(`public/banners/`). `'use client'`(setInterval).
- `AwardsStrip` — SNS 링크 3종 + 수상 이력 가로 스트립.

### 5.4 오버레이 (`components/overlay/`, 'use client')
- `BottomSheet` — 하단 슬라이드업 + dim, ESC/배경 클릭 닫기.
- `ConsultSheet` — 모드 `consult`(무료 상담)/`inquiry`(문의 폼). 제출 시 **mock 완료 화면**. apply는 시트가 아닌 전용 페이지로 이동.
- 셸 상태(어느 시트가 열렸나)는 `layout.tsx` 하위 client provider 또는 Header/StickyBar가 공유하는 client 컴포넌트로 관리.

### 5.5 섹션 (`components/sections/`)
홈: `HeroIntent`(4 intent), `Barriers`(4 benefit + 4단계 절차 + 자격확인 CTA), `SocialProof`(PhotoSlot 6 + 잉크 패널 AwardHighlight 3), `Videos`(YouTube 2, 클릭 시 iframe), `Schedule`(CourseRow 목록), `ClosingCTA`(블루 밴드 + 전화).
서브 공용: `PageHero`(eyebrow/title/sub + orb), `CourseCatalog`(과정 카드 그리드), `LocationInfo`(약도 + 정보 행).

---

## 6. 페이지

| 라우트 | 내용 | 상호작용 |
|---|---|---|
| `/` (홈) | Banner→AwardsStrip→HeroIntent→Barriers→SocialProof→Videos→Schedule→ClosingCTA | 캐러셀, 상담 시트, 영상 재생 |
| `/courses` | PageHero + CourseCatalog | "수강 신청" → `/apply?course=` |
| `/apply` | 3단계 위저드(모집안내→신청서→완료). `?course=` 프리필. 과정 선택(파라미터 없을 때) | step 상태, mock 완료 |
| `/funding` | 국비지원 — 서브탭(NBcard/훈련참여절차/산재), NCS 일정표, 훈련수당 기준, 고용24 **링크 안내** | 탭 전환 |
| `/about` | PageHero + 소개 + LocationInfo | — |
| `/inquiry` | 상담문의 게시판 목록(`.board-row`) + 검색 + 문의 작성 CTA | 문의 시트 |
| `/inquiry/[id]` | 게시글 상세 | — |
| `/photos` | 훈련 사진 갤러리(PhotoSlot 그리드) | — |

표시 데이터(과정·후기·일정·수상·게시판 행·영상)는 `lib/data/`에 타입과 함께 하드코딩. 페이지는 서버 컴포넌트, 상호작용 부분만 client.

---

## 7. 도메인 규칙 점검 (CLAUDE.md)

- **회원제 없음** ✅ 일반 로그인/마이페이지 없음.
- **취업률 미표시** ✅ 수치 없음(후기·자격증·수상으로 신뢰).
- **개강일·잔여석 미표시** ✅ CourseRow는 "평일반/주말반 개강"만, 실제 날짜·잔여석 없음.
- **모집상태 수동** ✅ `open`/`status`는 데이터 값(자동 판정 없음).
- **외부 시스템은 링크만** ✅ 고용24·큐넷은 링크 안내만.
- **인터랙션 패턴** ✅ 수강신청=전용 페이지(`/apply`), 상담문의=바텀시트.
- ⚠️ **신청 유형 분기(A/B/C)** — 핸드오프 `apply`는 분기 없는 3단계 온라인 위저드. **UI 1차는 디자인대로 포팅**하고, 백엔드 연결 시 `funding_type` A(이메일/방문)·B(고용24)·C(큐넷)로 재구성. **열린 항목으로 명시.**
- ⚠️ **데이터 화면 4상태**(기본/로딩/빈/에러) — UI-only·하드코딩 단계라 **기본 상태만** 구현. 로딩/빈/에러는 백엔드 연결 시 추가. **열린 항목.**

---

## 8. 비범위 (이번에 하지 않음)

- Supabase 연결, Server Action, zod 검증, 이메일 알림.
- 실제 폼 제출/저장(제출 → mock 완료 화면까지만).
- 어드민(`/admin`).
- SEO 메타·JSON-LD·sitemap(UI 확정 후 별도).
- 실제 사진/배너 이미지 최적화(placeholder + 핸드오프 제공 이미지 복사 수준).
- 로딩/빈/에러 상태(백엔드 연결 시).

---

## 9. 구현 순서(개략)

1. globals.css 토큰·base·레이아웃 헬퍼 이식 + layout.tsx Pretendard·셸 → `pnpm build` 통과 확인.
2. 아이콘 세트.
3. 프리미티브(ui/) — 단순한 것부터.
4. 레이아웃(Header/Footer/StickyBar/Banner/AwardsStrip) + 오버레이(시트).
5. 홈 섹션 → 홈 페이지 조립.
6. 나머지 페이지(courses/apply/funding/about/inquiry/photos) + lib/data.
7. 반응형·접근성(reduced-motion, focus, aria) 점검, build/lint.

기능 단위 커밋(Conventional Commits 한글).
