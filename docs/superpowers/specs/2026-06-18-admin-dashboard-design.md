# 운영 관리자 대시보드 (Admin Dashboard) — 설계 스펙

작성일: 2026-06-18
출처 핸드오프: `~/Downloads/design_handoff_admin_dashboard/` (README + `reference/AdminDashboard.dc.html` + `reference/colors.css`)

## 목표

비개발자 운영자(40~60대)가 사이트를 일상 운영하는 로그인 게이트형 관리자 콘솔.
8개 탭(대시보드·클릭률·수강신청·상담문의·과정수정·배너·훈련사진·공지)을 고정 사이드바 + 스티키 탑바 셸로 제공.

핸드오프 `reference/`는 **디자인 참조(DC 템플릿 프로토타입)** 이며 그대로 이식하지 않는다.
기존 디자인 시스템(토큰·컴포넌트)으로 **재구현**한다.

## 확정 결정 (브레인스토밍)

| 항목 | 결정 |
|---|---|
| 범위 | 전체 셸 + 8개 탭 UI 전부 |
| 인증 | 실제 Supabase Auth + 미들웨어 게이팅 (가입 UI 없음) |
| 데이터 | 실테이블 5개 탭은 **읽기(조회)** 실연결 / 쓰기는 다음 PR / KPI·클릭률·배너는 데모 |
| 아키텍처 | 실제 라우트 + 서버컴포넌트 우선 (인터랙션만 client 분리) |
| Supabase | 모킹 없음. `.env.local`의 **원격 프로젝트(운영 동일)** 그대로 사용 |
| 커밋 | 기능 단위로 잘게 나눠 Conventional Commits(한글) |

## 도메인 규칙 점검 (CLAUDE.md 위반 없음 확인)

- 회원제 없음: 공개 사이트 무수정. 인증은 `/admin`만. **가입 UI 없음** — 관리자 계정은 Supabase에서 직접 발급.
- 취업률 미표시: 관리자 KPI는 내부 운영 지표(방문자·신청·상담·모집중 과정수). 공개 화면 아님.
- 개강일·잔여석: 관리자 내부 데이터로만 보유(과정 수정 탭). 공개 노출 아님.
- 모집상태 수동: 과정 수정 탭의 모집중/마감 토글 = 수동(`recruit_status`).
- 외부 시스템(고용24·큐넷): 관리자에서 연동/결제 흉내 없음.

## 아키텍처 & 파일 구조

```
src/middleware.ts                      # /admin/:path* 세션 게이팅 (신규)
src/lib/supabase/middleware.ts         # 미들웨어용 세션 갱신 헬퍼 (신규)

src/app/admin/
  layout.tsx                           # 셸: 사이드바 + 탑바 (서버컴포넌트). 사이드바 카운트 실조회.
  AdminShell.tsx                       # client — active nav 하이라이트, 모바일 오프캔버스 드로어
  page.tsx                             # 대시보드(overview)
  loading.tsx, error.tsx               # 셸 공통 상태 (탭별 필요 시 개별 추가)
  login/page.tsx                       # 로그인 (미들웨어 매처 예외)
  login/LoginForm.tsx                  # client — signInWithPassword
  logout/route.ts                      # signOut → /admin/login
  clicks/page.tsx                      # 클릭률 (데모)
  enroll/page.tsx                      # 수강신청 현황 (application 읽기)
  consult/page.tsx                     # 상담문의 (inquiry 읽기)
  courses/page.tsx + CourseEditor.tsx  # 과정 수정 (course 읽기 / 편집 UI 로컬)
  banner/page.tsx + BannerManager.tsx  # 배너 (데모·로컬 state, 테이블 없음)
  photos/page.tsx                      # 훈련사진 (post category=훈련사진 읽기)
  notice/page.tsx + NoticeCompose.tsx  # 공지 (notice 읽기 / 작성 UI 로컬)

src/components/admin/                   # 셸 전용 재사용 컴포넌트
  KpiCard, StatusChip, DataTable(or rows), FilterPills, ProgressBar, EmptyState, BSwitch ...
src/lib/queries/admin.ts               # 관리자 읽기 쿼리 + 매퍼 (authenticated)
src/lib/admin/banner.ts                # 배너 템플릿 파서 parseRows/parseLines + 기본 배너 팩토리
```

- 각 탭 = 실제 라우트(딥링크·새로고침 정상). `pageTitle/pageDesc`는 라우트별 보유.
- 셸(사이드바·탑바)은 `layout.tsx` 공유. 기존 `Button/Field/Badge/Card`/아이콘 세트·`globals.css` 토큰 재사용.
- 로고: `public/logo/logo-primary.png`(또는 `logo.svg`). 로고색(갈색·황금)은 UI 다른 곳 사용 금지.
- 공개 사이트(`app/(public)/*`)는 **무수정**.

## 인증 흐름

- `src/middleware.ts`: `matcher` = `/admin/:path*`. `@supabase/ssr`로 세션 확인·갱신.
  - 세션 없음 + `/admin/login` 아님 → `/admin/login` 리다이렉트.
  - 세션 있음 + `/admin/login` → `/admin` 리다이렉트.
  - 공개 라우트는 매처 밖 → 공개 사이트 성능·동작 영향 없음.
- `login/LoginForm.tsx`: 이메일+비밀번호 → `supabase.auth.signInWithPassword`. 성공 시 `/admin`, 실패 시 핸드오프 에러 라인.
  - Enter 키 제출. 입력 포커스 = primary 보더 + 3px primary-soft 링.
- `logout/route.ts`: `signOut()` 후 `/admin/login`.
- **관리자 계정 발급(가입 UI 없음)**:
  - 운영: Supabase 대시보드 → Authentication → 관리자 이메일/비번 수동 생성.
  - 로컬 검증: 동일 원격 프로젝트 계정으로 로그인(운영 동일). 별도 로컬 더미 인증 만들지 않음.
  - 발급 절차는 README/문서에 한 줄 기재.

## 탭별 데이터 매핑

| 탭 | 라우트 | 데이터 | 이번 범위 |
|---|---|---|---|
| 대시보드 | `/admin` | 방문자·클릭 KPI=**데모** / 최근 수강신청·모집중 과정수=`application`·`course` 읽기 | 읽기 |
| 클릭률 | `/admin/clicks` | **데모**(분석 인프라 없음) | UI만 |
| 수강신청 현황 | `/admin/enroll` | `application` 읽기 | 읽기. 필터 pill 정적 |
| 상담문의 | `/admin/consult` | `inquiry` 읽기 | 읽기. 전화/완료 버튼 UI만(다음 PR) |
| 과정 수정 | `/admin/courses` | `course` 읽기 | 읽기. 정원·개강일·토글·저장 로컬 state UI |
| 배너 관리 | `/admin/banner` | **데모·로컬 state**(테이블 없음) | UI만. HTML 모드 **DOMPurify 새니타이즈** |
| 훈련사진 | `/admin/photos` | `post`(category=훈련사진) 읽기 | 읽기. 업로드/삭제 UI만 |
| 공지 | `/admin/notice` | `notice` 읽기 | 읽기. 작성/삭제 로컬 state UI |

- 사이드바 카운트 pill: 수강신청 대기수(`application` 신규/대기), 상담 신규수(`inquiry` 답변대기) — `layout.tsx`에서 실조회로 도출.
- **PII 마스킹**: 이름·연락처는 매퍼에서 핸드오프 관례로 마스킹(`김O희`, `010-1234-••••`). 관리자 화면이라도 핸드오프 톤 유지.

## 상태 처리 (4종)

- 읽기 탭: 기본 / 로딩(`loading.tsx` 스켈레톤) / 빈(내부용 안내 문구 — 공개 상담CTA 아님) / 에러(`error.tsx` 재시도).
- 데모 탭(KPI·클릭·배너): 항상 기본 상태.

## 모바일

- 252px 사이드바는 `<lg`(1000px)에서 오프캔버스 드로어 + 탑바 햄버거. (핸드오프 미정 항목을 이 방향으로 확정.)
- 탑바 날짜는 `<md`(760px) 숨김. KPI 그리드 2→4열, 갤러리 2→3열, 2단 패널 1→2열(핸드오프 반응형 규칙 준수).

## 배너 모델 (데모·로컬 state)

핸드오프 모델 1:1: `{ id, active, mode:'template'|'image'|'html', template, tint, eyebrow, title, body, cta, rows, big, bigCaption, bullets, phone, question, answer, imgDesktop, imgMobile, alt, link, html, htmlLabel }`.
- 템플릿 5종: `price`/`bignum`/`center`/`phone`/`qa`. 8개 배경 틴트 스와치.
- `price`·`phone`은 textarea 줄 파싱(`parseRows`/`parseLines`).
- HTML 모드: 빨간 경고 + **DOMPurify로 새니타이즈 후** `dangerouslySetInnerHTML`.
- 리스트: 순서번호·on/off 스위치·편집/↑/↓/🗑. 선택 시 `.is-sel`.
- 테이블 없음 → 영속화 없음(다음 단계 CMS/Supabase 이전 대상). 이번엔 로컬 state CRUD.

## 테스트 (TDD — red→green→refactor)

로직 단위에 적용:
1. `lib/queries/admin.ts` 매퍼 — 마스킹·상태칩 매핑·카운트 도출.
2. `lib/admin/banner.ts` — `parseRows`/`parseLines`/기본 배너 팩토리.
3. 사이드바 카운트 도출 함수.

순수 셸/프레젠테이션 UI는 렌더 스모크 테스트 수준. (vitest + testing-library)

## 커밋 분할 (기능 단위)

1. `feat: 관리자 인증 미들웨어와 로그인 화면`
2. `feat: 관리자 셸(사이드바·탑바·모바일 드로어)`
3. `feat: 관리자 읽기 쿼리·매퍼와 PII 마스킹` (+테스트)
4. `feat: 수강신청·상담문의 현황 탭(읽기)`
5. `feat: 과정 수정 탭(읽기+편집 UI)`
6. `feat: 훈련사진·공지 탭(읽기+작성 UI)`
7. `feat: 대시보드 KPI·클릭률 탭(데모)`
8. `feat: 배너 관리 탭(데모·HTML 새니타이즈)`

(순서·세분화는 구현 중 조정 가능. 한 기능 끝날 때마다 커밋.)

## 다음 PR(이번 범위 밖) 메모

- 쓰기 배선: 과정 저장/토글, 상담 완료 처리, 공지 작성/삭제, 사진 업로드(S3 presigned)/삭제 — Server Action+zod.
- 분석 인프라: 방문자·클릭률 트래킹(데모 → 실데이터).
- 배너 영속화: CMS/Supabase 테이블 신설 후 `BannerSlides.tsx`와 연동.
