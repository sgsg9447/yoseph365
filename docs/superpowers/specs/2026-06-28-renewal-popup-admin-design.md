# 리뉴얼 안내 팝업 + 어드민 노출 관리 — 설계

작성일: 2026-06-28

## 1. 배경 / 목표

홈페이지 리뉴얼 오픈을 알리고 방문자를 핵심 행동(과정 탐색·수강신청·상담)으로
유도하는 **첫 진입 모달 팝업**을 구현한다. 디자인은 외부 핸드오프(`사이트 리뉴얼 팝업 디자인.zip`,
구조화된 안내 모달 — 로고·헤드라인·서브카피·행동메뉴 3개·"오늘 하루 열지 않기")를 따른다.

운영자(비개발자)가 어드민에서 팝업을 **올리고 내릴 수 있어야** 하고, **모바일에서는
노출하지 않는 옵션**을 가질 수 있어야 한다.

### 범위 (이번 작업)
- 핸드오프 디자인을 **반응형 React 모달**로 구현, 공개 사이트 전역 노출
- 어드민: **노출 on/off** + **모바일 숨김** 토글 관리
- 팝업 텍스트·링크는 **코드에 고정**(일회성 리뉴얼 안내 — 운영자 편집은 요청에 없음)

### 비범위 (YAGNI — 다음 작업)
- 운영자 이미지 업로드(데스크톱/모바일 포스터), 다중 팝업 리스트
- 노출 기간(start/end) 자동 스케줄, 팝업 텍스트 어드민 편집
- 데이터 모델은 위 확장이 가능하도록만 보존하고, 추측성 컬럼은 추가하지 않는다.

## 2. 도메인 규칙 점검 (CLAUDE.md)
- **#3 개강일 미표시**: 핸드오프 디자인의 첫 행동메뉴 "개강일정"은 규칙 위반 + 페이지 없음
  → **제외**. 행동메뉴를 아래로 재구성.
- **#7 상담문의 = 바텀시트**: 상담문의 행동은 `openConsult("consult")`(기존 `ConsultSheet`)로 연결.
- **#1 회원제 없음 / 인증은 어드민만**: 팝업은 공개 콘텐츠, 어드민 토글은 `authenticated`만.
- 취업률·잔여석 등 미표시 규칙과 무관(팝업에 해당 수치 없음).

### 확정된 행동메뉴 (위→아래)
1. **과정 보기** — *강조행(파란 솔리드)* → `/courses` · "어떤 과정이 있는지 확인하세요" · 아이콘 `Hammer`
2. **수강신청** → `/apply` · "온라인으로 간편하게 접수" · 아이콘 `Clipboard`
3. **상담문의** → `openConsult("consult")` · "궁금한 점을 바로 물어보세요" · 아이콘 `Message`

각 행동: 팝업을 닫고 해당 동작 수행.

## 3. 데이터 모델

기존 `popup` 테이블 재사용. 마이그레이션 1개:

```sql
alter table popup add column hide_on_mobile boolean not null default false;

-- 싱글턴 시드: 운영자가 켜기 전까지 꺼짐
insert into popup (title, is_active, hide_on_mobile)
select '리뉴얼 안내 팝업', false, false
where not exists (select 1 from popup);
```

- 사용 컬럼: `is_active`(on/off), `hide_on_mobile`(신규)
- 보존(이번 미사용, 향후 이미지 업로드·다중 팝업 확장점): `image_url`, `link_url`,
  `start_at`, `end_at`, `sort_order`
- RLS: 기존 `popup public read` 정책이 이미 `is_active = true and (start_at null/과거) and
  (end_at null/미래)`로 활성 팝업만 anon SELECT 허용 → **변경 불필요**.
- `database.types.ts`에 `hide_on_mobile` 반영.

공개 측은 **활성 팝업 1행**만 조회해 렌더(현재 콘텐츠는 코드 고정이라 행은 1개).

## 4. 공개 사이트 렌더

### 마운트
- `app/(public)/layout.tsx`(서버 컴포넌트)에서 활성 팝업 조회
  → `SiteShell`에 `popup` prop 전달
  → `SiteShell` 내부(`ConsultContext.Provider` 안)에서 `<RenewalPopup config={popup} />` 렌더.
  Provider 안이라 `useConsult()`로 상담 바텀시트 호출 가능.
- 활성 팝업 없으면 `null` 전달 → 렌더 안 함.

### 노출 판정 — 순수 함수 (TDD 핵심)
`src/lib/popup/visibility.ts`
```ts
export function shouldShowPopup(input: {
  isActive: boolean;
  hideOnMobile: boolean;
  isMobile: boolean;
  hideUntil: number | null; // localStorage epoch ms, 없으면 null
  now: number;
}): boolean
```
- `isActive`가 false → false
- `hideUntil`가 있고 `now < hideUntil` → false (24h "오늘 그만보기")
- `hideOnMobile && isMobile` → false
- 그 외 true

### 클라이언트 동작 (`RenewalPopup`)
- 마운트 후에만 판정(SSR 깜빡임/하이드레이션 방지). 초기 `open=false`.
- 모바일 판정: `matchMedia("(max-width: 480px)")`.
- `hideUntil`: `localStorage.getItem("renewalPopupHideUntil")` 파싱.
- 닫기 트리거(모두 동일): X 버튼 · 하단 "닫기" · 오버레이 빈 영역 클릭 · Esc.
- "오늘 하루 열지 않기" 체크 후 닫으면 `localStorage["renewalPopupHideUntil"] = now + 24h`.
- 행동메뉴: 과정보기 → `router.push("/courses")`, 수강신청 → `router.push("/apply")`,
  상담문의 → `openConsult("consult")`. 모두 먼저 팝업 닫기.

### 스타일 / 모션
- 디자인 토큰이 기존 Tailwind 토큰과 일치 → 그대로 사용:
  `primary`(#2563eb)·`ink`·`muted`·`hairline`·`primary-soft`·`primary-softer`·`primary-border`.
- orb(블러 장식)·hero 그라데이션·등장 애니메이션(popIn/orbsIn/rise)은 스코프드 CSS/keyframes로.
- `prefers-reduced-motion: reduce`면 즉시 최종 상태.
- 카드 `max-width: min(462px, 100% - 44px)`, `@media (max-width:480px)` 패딩·헤드라인 축소.
- 로고: 기존 브랜드 `<Logo className="h-[34px] w-auto" />` 재사용(핸드오프 PNG 미추가).
- 아이콘: 기존 `@/components/icons`(`Hammer`,`Clipboard`,`Message`,`ChevronRight`,`X`,`Check`).

## 5. 어드민

### 라우트 / 파일
- `app/admin/(dashboard)/popup/page.tsx` — 서버, 팝업행 조회 후 `PopupManager`에 전달
- `app/admin/(dashboard)/popup/PopupManager.tsx` — 클라이언트, 토글 2개 + 저장
- `app/admin/(dashboard)/popup/actions.ts` — 서버액션 `updatePopupSettings`(zod 검증)
- `app/admin/nav.ts` — `{ key:"popup", href:"/admin/popup", label:"팝업 관리", title:"팝업 관리" }` 추가

### UI
- 팝업 설명/미리보기 카드 + 토글 2개:
  - **사이트에 노출** (`is_active`)
  - **모바일에서는 숨기기** (`hide_on_mobile`)
- 저장 시 서버액션 → `revalidatePath("/")` + `revalidatePath("/admin/popup")`.
- 상태 4종(기본/로딩/빈/에러) 중 본 화면은 단일 설정이라 기본+저장 성공/실패 토스트로 처리.

### 서버액션 / 검증
`updatePopupSettings(input)` — zod 스키마 `{ id: number, isActive: boolean, hideOnMobile: boolean }`.
잘못된 입력 시 사용자용 메시지 반환. 성공 시 `popup` 행 update.

## 6. 테스트 (TDD: red → green)
- `shouldShowPopup` 순수함수: 비활성 / 24h 억제(now<hideUntil) / 모바일숨김×모바일 /
  모바일숨김×데스크톱 / 정상노출 케이스.
- 억제 만료 타임스탬프 계산(now + 24h) 헬퍼가 있으면 함께.
- `updatePopupSettings` zod 스키마: 잘못된 타입/음수 id 거부.

## 7. 구현 순서
1. 마이그레이션(`hide_on_mobile` + 시드) + `database.types.ts` 갱신
2. `shouldShowPopup` 순수함수 + 테스트(red→green)
3. `RenewalPopup` 컴포넌트(+ 스코프드 스타일/모션)
4. `layout.tsx` 조회 → `SiteShell` prop → 팝업 마운트
5. 어드민 `popup` 라우트(page/manager/actions) + nav 탭 + zod 스키마/테스트
6. `pnpm lint` · `pnpm test` · `pnpm build` 검증

## 8. 파일 영향 요약
- 신규: `supabase/migrations/<ts>_popup_hide_on_mobile.sql`,
  `src/lib/popup/visibility.ts`(+ `.test.ts`),
  `src/components/overlay/RenewalPopup.tsx`,
  `src/app/admin/(dashboard)/popup/{page,PopupManager,actions}.tsx|ts`
- 수정: `src/app/(public)/layout.tsx`, `src/components/layout/SiteShell.tsx`,
  `src/app/admin/nav.ts`, `src/lib/supabase/database.types.ts`,
  `src/lib/validations/forms.ts`(zod 스키마)
