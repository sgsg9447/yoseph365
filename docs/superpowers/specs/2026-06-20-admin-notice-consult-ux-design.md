# 어드민 공지사항 표 전환 · 상담문의 필터 정리 — 설계

- 날짜: 2026-06-20
- 상태: 승인됨(구현 대기)
- 범위: 어드민(`/admin`) 전용 화면 2곳. 공개 사이트·DB 스키마·RLS 변경 없음.

## 배경 / 문제

**공지사항(`/admin/notice`)**
- 현재 `NoticeBoard.tsx`가 공지를 **카드**로 렌더링하고, 작성은 **모달**, 삭제는 **확인 없이 즉시** 실행되며 **수정 기능이 없음**.
- 운영자는 공개 `/notice`처럼 목록을 **표**로 한눈에 보고, 행에서 바로 **수정/삭제**하고 싶어 함.

**상담문의(`/admin/consult`)**
- 상단에 **요약칩(신규·오늘·전체)** 한 줄 + **필터칩(전체·신규·완료)** 한 줄이 겹쳐 산만함(`전체`·`신규`가 양쪽에 중복).
- 참고: 필터 하이라이트는 정상 동작함(`FilterPills`가 내부 `selected` 상태 보유). 버그 아님 — 정리 대상은 "두 줄 중복"뿐.

## 목표 (검증 가능한 성공 기준)

1. `/admin/notice`가 카드가 아닌 **표**로 렌더링된다(수강신청 현황과 같은 톤).
2. **글쓰기** 버튼이 모달이 아니라 **별도 페이지**(`/admin/notice/new`)로 이동한다.
3. 각 행 **수정** 버튼이 **별도 페이지**(`/admin/notice/[id]/edit`)로 이동하고, 저장 시 목록에 즉시 반영된다.
4. 각 행 **삭제**는 **확인 모달**을 거친 뒤에만 실행된다.
5. `/admin/consult` 상단이 **건수 포함 한 줄 필터 바**(전체·신규·완료) + "오늘 N건" 캡션으로 정리되고, 카드 목록·페이지네이션·전화상담·완료처리는 그대로 동작한다.

## 핵심 도메인 규칙 점검

- 회원제 없음 / 취업률·개강일·잔여석 미표시 / 외부연동 링크only — 본 작업과 무관(영향 없음).
- 개인정보: `inquiry`는 관리자(authenticated) 화면이므로 이름·연락처 그대로 노출(기존과 동일). **RLS·쿼리 권한 변경 없음.**
- 공지/상담 모두 `/admin` 보호 라우트 안에서만 변경.

## 설계 1 — 공지사항

### 파일 변경

| 파일 | 작업 | 내용 |
|---|---|---|
| `src/app/admin/(dashboard)/notice/NoticeTable.tsx` | **신설** | 표 목록 + 글쓰기 링크 + 삭제 확인 모달 (기존 `NoticeBoard.tsx` 대체) |
| `src/app/admin/(dashboard)/notice/NoticeBoard.tsx` | **삭제** | 카드+생성모달 컴포넌트 제거 |
| `src/app/admin/(dashboard)/notice/NoticeForm.tsx` | **신설** | 글쓰기/수정 공유 폼(클라이언트) |
| `src/app/admin/(dashboard)/notice/new/page.tsx` | **신설** | 서버: `NoticeForm` 생성 모드 렌더 |
| `src/app/admin/(dashboard)/notice/[id]/edit/page.tsx` | **신설** | 서버: id로 공지 조회 → `NoticeForm` 수정 모드 렌더, 없으면 `notFound()` |
| `src/app/admin/(dashboard)/notice/page.tsx` | 수정 | `NoticeTable` 렌더로 교체 |
| `src/app/admin/(dashboard)/notice/actions.ts` | 수정 | `updateNotice` 추가(기존 create/delete 유지) |
| `src/app/admin/(dashboard)/notice/NoticeEditor.tsx` | 변경 없음 | Tiptap 에디터 재사용 |
| `src/lib/queries/admin.ts` | 수정 | `getAdminNotice(id)` 단건 조회 추가 |
| `src/lib/validations/forms.ts` | 수정 | `noticeUpdateSchema` 추가 |

### 목록 표 (`NoticeTable.tsx`, 클라이언트)
- `SectionCard padding={0}` 안에 그리드 헤더 + 행 (EnrollTable 패턴).
- 컬럼: **제목**(고정 공지는 "고정" 뱃지 인라인) · **날짜** · **관리**(수정 · 삭제). 그리드 예: `minmax(0,1fr) auto auto`, 헤더는 `hidden md:grid`, 제목은 `truncate`.
- 정렬은 기존 `getAdminNotices`(고정 우선 → 최신순) 그대로.
- 우상단 **글쓰기** 버튼 = `/admin/notice/new`로 가는 링크.
- **수정** = `/admin/notice/[id]/edit` 링크. **삭제** = 버튼(모달 오픈).
- 삭제 확인: 기존 `Modal` 재사용. 상태로 삭제 대상(`{id, title}`) 보관 → 모달 본문 "'{제목}' 공지를 삭제할까요? 되돌릴 수 없습니다." + 취소 / 삭제. 확인 시에만 `deleteNotice(id)` → `router.refresh()`. `useTransition`으로 진행 표시.
- 빈 상태: 기존 `EmptyState` 유지("등록된 공지가 없습니다.").

### 공유 폼 (`NoticeForm.tsx`, 클라이언트)
- props: `mode: "create" | "edit"`, `initial?: { id: number; title: string; body: string; pinned: boolean }`.
- 필드: 제목(`Field`) · 내용(`NoticeEditor`) · 상단 고정(checkbox). 버튼: 취소(`/admin/notice` 링크) · 저장.
- 제출:
  - create → `createNotice({ title, body, pinned })`
  - edit → `updateNotice({ id, title, body, pinned })`
  - 성공 → `router.push("/admin/notice")` (revalidate로 즉시 반영). 실패 → 에러 문구 표시. `useTransition` 진행 표시.
- 페이지 제목: 생성 "새 공지 작성" / 수정 "공지 수정".

### 페이지 라우트
- `/admin/notice/new`(서버): `<NoticeForm mode="create" />`.
- `/admin/notice/[id]/edit`(서버): `params`의 id 파싱 → `getAdminNotice(id)`; null이면 `notFound()`; 아니면 `<NoticeForm mode="edit" initial={...} />`.
- 두 라우트는 `(dashboard)` 그룹 내부라 `AdminShell` 레이아웃 자동 적용. 사이드바 활성/상단 타이틀은 `pathname.startsWith("/admin/notice")`로 "공지사항"이 그대로 활성 — **nav 변경 불필요**.

### 서버 액션 / 쿼리 / 검증
- `updateNotice(input)`: `noticeUpdateSchema.safeParse` → 본문 `DOMPurify.sanitize` → `supabase.from("notice").update({ title, body, is_pinned })`(`published_at`은 **건드리지 않음**) `.eq("id", id)` → `revalidatePath("/admin/notice")` + `revalidatePath("/notice")` + `revalidatePath(`/notice/${id}`)`(공개 상세도 갱신) → `{ok}`/`{ok:false,error}`. (기존 `createNotice` 형식 그대로.)
- `getAdminNotice(id)`: `select id,title,body,is_pinned` `.eq("id", id).eq("is_deleted", false).maybeSingle()` → `{ id, title, body, pinned }` 또는 `null`.
- `noticeUpdateSchema`: `noticeCreateSchema` 필드 + `id: z.number().int().positive()`.

## 설계 2 — 상담문의

### 파일 변경
| 파일 | 작업 | 내용 |
|---|---|---|
| `src/app/admin/(dashboard)/consult/ConsultTable.tsx` | 수정 | 상단 두 줄 칩 → 한 줄 건수 필터 바 + "오늘 N건" 캡션. 로컬 `SummaryChip` 제거. 카드/페이지네이션/`ConsultCard`는 유지 |
| `src/lib/admin/inquiry.ts` | 수정 | `countInquiriesByStatus(rows)` 헬퍼 추가(전체·신규·완료 건수) |

- **`FilterPills`는 변경하지 않음** — enroll/clicks/테스트에서 공유. 건수 표시 필터 바는 상담문의 안에 작은 로컬 UI로 둠(`FilterPills`와 동일한 시각 톤: rounded-full, 선택 시 primary).
- 필터 바 항목: `전체 N` · `신규 N` · `완료 N`. 활성 상태는 컴포넌트의 `status` state로 제어(클릭 → `setStatus` + 페이지 1로).
- 캡션: "오늘 N건"(= `summarizeInquiries(...).today`, 당일 접수 건수). 필터 바 옆/아래 작은 회색 텍스트.
- 카운트 출처: `countInquiriesByStatus` → `{ 전체: total, 신규: pending, 완료: total - pending }`.

## 테스트 (TDD: red → green → refactor)

순수 로직은 단위 테스트, 화면(표·폼·모달)은 dev 서버/preview로 검증.

1. `src/lib/validations/forms.test.ts`에 `noticeUpdateSchema` 케이스 추가: 유효 통과 / 제목 누락 실패 / 잘못된 id 실패.
2. `src/lib/admin/inquiry.test.ts` **신설**: `countInquiriesByStatus`가 전체·신규·완료를 정확히 세는지(기존 `summarizeInquiries`·`filterInquiries`도 함께 커버 가능).
3. UI(표 렌더, 글쓰기/수정 페이지 이동·저장, 삭제 확인 모달, 상담 필터 바 활성/건수)는 `pnpm build` 통과 + preview로 동작 확인.

## 구현 순서

1. `noticeUpdateSchema` + 테스트 → green.
2. `countInquiriesByStatus` + 테스트 → green.
3. 공지 서버: `updateNotice` 액션, `getAdminNotice` 쿼리.
4. 공지 UI: `NoticeForm` → `new`/`[id]/edit` 페이지 → `NoticeTable`(+삭제 모달) → `page.tsx` 교체 → `NoticeBoard.tsx` 삭제.
5. 상담 UI: `ConsultTable` 상단 필터 바 교체, `SummaryChip` 제거.
6. `pnpm build` · `pnpm test` 통과 → preview 확인 → 기능 단위 커밋.

## 설계 3 — 상담문의 월별 보기 (추가, 같은 날 승인)

칩 정리 직후, 상담문의를 **월 단위로 탐색**하는 요청 추가. 과거 격자 캘린더(`ad383bd`)는 '브라우징 불편'으로 제거(`b1e129a`)했던 이력이 있어, **격자 없이 "월 네비게이터 + 인박스"** 형태로 결정.

- **레이아웃**: 상단에 월 네비게이터(`‹ [년] [월] ›`, 이전·다음 달 화살표 + 년·월 드롭다운) → 그 아래 기존 상태 필터 바 → 카드 목록 → 페이지네이션.
- **동작**: 기본값 = 이번 달(KST). 월이 먼저 적용되고 그 안에서 상태 필터·페이지네이션 동작 → **전체/신규/완료 건수도 선택한 달 기준**. 다음 달 화살표는 이번 달에서 비활성(미래 빈 달 차단). 빈 달은 기존 `EmptyState`.
- **직전 추가분 변경**: "오늘 N건" 캡션 **제거**(월 네비게이터로 맥락 대체).
- **순수 헬퍼(TDD)**: [inquiry.ts](../../../src/lib/admin/inquiry.ts)에 `filterInquiriesByMonth(rows,y,m)`·`stepMonth(y,m,±1)`·`inquiryYearRange(rows,올해)` 추가 + 테스트. 상태 건수는 `countInquiriesByStatus`를 월 스코프에 재사용.
- **UI**: `ConsultTable`에 year/month 상태 + 로컬 `MonthNav`(기존 `Select` 재사용, `ChevronRight` 회전으로 좌측 화살표).
- **보존**: 격자 캘린더 코드(`ConsultCalendar`/`calendar.ts`)는 그대로 미사용 보존(예약용).

## 설계 4 — 상담문의 메모 + 이름 검색 (추가, 같은 날 승인)

상담 선생님이 상담자별 **메모**를 남기고, **이름으로 검색**하는 요청.

**메모 (모달, 수강신청 패턴 차용)**
- ⚠️ **DB 스키마 변경**: `inquiry`에 `admin_memo text` 추가. 마이그레이션 [20260620120000_inquiry_admin_memo.sql](../../../supabase/migrations/20260620120000_inquiry_admin_memo.sql). RLS는 기존 `inquiry admin update`(authenticated full)로 충분 — 변경 없음. **원격 적용은 운영자가 직접**(`supabase db push`); 적용 전 메모 저장은 안전하게 에러 처리.
- `database.types.ts` inquiry에 `admin_memo`, `InquiryView.memo`, `getInquiries` select·`toInquiryView` 매핑.
- 검증 `inquiryMemoSchema`({id, memo ≤2000자}), 액션 `updateInquiryMemo`(consult/actions.ts) → `inquiry.admin_memo` 업데이트 후 `revalidatePath("/admin/consult")`. (수강신청 `updateApplicationMemo`와 동형.)
- UI: 카드에 **"메모" 버튼**(메모 있으면 점 + 카드에 메모 미리보기) → 모달(`{이름} · 상담 메모`)에서 작성·저장. `되돌리기 / 메모 저장`.

**이름 검색 (전체 기간)**
- 상단에 이름 검색 입력. **검색어가 있으면 월 무시·전체 기간**(`searchInquiriesByName`)에서 찾고, 월 네비게이터 자리에 "전체 기간에서 검색 중" 표시. 검색어 지우면 월 보기 복귀.
- 상태 칩 건수·상태 필터·페이지네이션은 현재 기준(검색 결과 또는 그 달) 위에서 동작.
- 순수 헬퍼 `searchInquiriesByName(rows, query)`(이름 부분일치·대소문자 무시·빈 검색=전체) + 테스트.

## 비범위(Out of scope)

- 공지 정렬 변경·검색 추가(페이지네이션·빈 행 채움까지만).
- 상담문의 카드 → 표 전환(칩 정리·월 네비게이터·메모·이름검색까지).
- 격자형 달력(날짜 셀) 부활 — 월 네비게이터로 대체.
- 메모/내용 본문 검색(이번엔 이름만).
- `FilterPills` 컴포넌트 API 변경.
- 공개 `/notice` 화면 변경.
