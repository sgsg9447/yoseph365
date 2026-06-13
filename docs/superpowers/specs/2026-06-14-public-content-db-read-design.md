# 공개 페이지 콘텐츠 DB 읽기 전환 + 과정 데이터 모델 재설계 — 설계서

| 항목 | 내용 |
| --- | --- |
| 작성일 | 2026-06-14 |
| 슬라이스 | 백엔드 1차 — 공개 콘텐츠 읽기 전환 |
| 선행 | init 스키마/시드/프론트(정적 데이터) 존재, 로컬 Supabase 가동 중 |
| 정본(source of truth) | 운영자(사용자) 제공 데이터 — 과정 5종·커리큘럼·트랙·시험일정·연혁 |

---

## 1. 목표와 범위

정적 하드코딩 데이터(`src/lib/data/*`, 일부 컴포넌트 인라인)를 Supabase 읽기로 전환한다. 동시에 과정·연혁 데이터 모델을 실제 운영 데이터에 맞게 재설계한다.

### 포함
1. 스키마 재설계 + `db:reset` (init 마이그레이션 직접 수정)
2. 재시드 (운영자 제공 정본 데이터)
3. 읽기·매핑 레이어 (+ 매핑 함수 단위테스트, TDD)
4. UI 전환: `/courses`(카탈로그 + 상세 + 자격증 트랙·시험일정), 홈 일정 섹션, `/about` 연혁(소개문구 + 타임라인)

### 제외 (다음 슬라이스)
- 폼 제출(신청/문의/대기) + Server Action + zod
- 상담문의 게시판(`/inquiry`) — `inquiry`는 PII, 비식별 public view 별도 설계 필요
- `/photos` 갤러리 — 실제 사진 데이터가 나중에 들어옴(S3 슬라이스). 현재 placeholder UI 유지
- S3 presigned 업로드
- 신청 흐름 A·B·C 분기 (funding_type은 저장만, 분기는 추후)
- 과정 단독 ISR 라우트(`/courses/[id]`) + JSON-LD

---

## 2. 기술 결정 (확정)

- **DB는 snake_case 컬럼 + 한국어 enum 유지** (데이터정의서·기존 타입과 일관). 운영자가 제시한 영어 camelCase 구조는 TS 매핑 레이어에서 노출.
- **테이블명 단수 일관**: 기존 `course`·`post`·`inquiry`와 맞춰 신규도 단수 (`about_history`, `about_history_item`, `site_section`).
- 스키마 변경은 **init 마이그레이션 직접 수정 + `pnpm db:reset`** (로컬 전용·출시 전, 운영 DB에 실데이터 없음 전제).
- 공개 읽기는 **anon 서버 클라이언트** 경유 (RLS-safe). ISR.

---

## 3. 스키마 변경

### 3.1 enum
- `funding_type` — 유지 (`경기도무료`/`국비지원`/`자부담`)
- `course_category` — 유지 (`집수리`/`건축목공입문`/`인테리어필름입문`/`기능사`)
- `schedule_pattern` — **`'단기'` 추가** → (`평일주간`/`주말`/`단기`)
- `recruit_status` — 유지
- `curriculum_place` enum → **삭제** (curriculum_item.place를 text로)
- `exam_type` enum → **삭제** (트랙명으로 대체)

### 3.2 `course` (5행 재구성)
- 제거: `exam_schedule_id`
- 추가: `total_hours int`
- 나머지 컬럼 유지: id, name, category, schedule_pattern, funding_type, summary, skills, sessions_total, session_hours, tuition, self_pay, seo_keywords, recruit_status, is_deleted, created_at, updated_at

| id | name | category | schedule_pattern | funding_type | sessions_total | session_hours | total_hours |
| --- | --- | --- | --- | --- | --- | --- | --- |
| course_weekday_repair | 평일 집수리과정 | 집수리 | 평일주간 | 경기도무료 | 33 | 8H | 264 |
| course_weekday_carpentry | 평일 건축목공과정 | 건축목공입문 | 평일주간 | 국비지원 | 20 | 8H | 160 |
| course_weekend_carpentry | 주말 건축목공과정 | 건축목공입문 | 주말 | 국비지원 | 16 | 8H | 128 |
| course_weekend_interior_film | 주말 인테리어필름과정 | 인테리어필름입문 | 주말 | 국비지원 | 18 | 8H | 144 |
| course_architecture_certificate | 건축기능사자격 과정 | 기능사 | 단기 | 자부담 | NULL | NULL | NULL |

> funding_type 매핑(운영자 확정): A=경기도무료(평일 집수리), B=국비지원(목공평일·목공주말·필름), C=자부담(자격증).
> summary/skills/seo_keywords/tuition 등은 기존 시드 값 또는 운영자 제공 값으로 채운다.

### 3.3 `curriculum_item` (구조 변경)
- `content text` → **`contents text[]`** (trainingContents 여러 줄)
- `hours text` → **`hours int`** (렌더 시 `${hours}H`)
- `place` enum → **`text`** ('강의실/실습실' 조합 허용)
- 유지: id, course_id FK, round(=sessionNo), unit(=competencyUnit), unique(course_id, round)
- **시드 87행**: 집수리 33 + 목공평일 20 + 목공주말 16 + 필름 18 (운영자 제공 JSON 그대로 transcribe)

### 3.4 `course_track` (신규)
| 컬럼 | 타입 |
| --- | --- |
| id | text PK |
| course_id | text FK → course (on delete cascade) |
| name | text |
| description | text |
| sessions_total | int |
| schedule_summary | text[] |
| price | int |
| sort_order | int |

**시드 2행** (course_architecture_certificate 하위):
- track_architecture_woodwork — 건축목공기능사 / 5회 / 600000 / ["4회 09:00~17:00 (1일 8시간)","1회 09:00~14:00 (1일 5시간)"]
- track_architecture_painting — 건축도장기능사 / 2회 / 300000 / ["1회 09:00~17:00 (1일 7시간)","1회 09:00~15:00 (1일 6시간)"]

### 3.5 `exam_schedule` (트랙 연결로 재구성)
| 컬럼 | 타입 |
| --- | --- |
| id | bigint identity PK |
| track_id | text FK → course_track |
| year | int |
| round | text (제1회 등) |
| apply_start | date |
| apply_end | date |
| exam_start | date |
| exam_end | date |
| result_dates | date[] |
| sort_order | int |

**시드 7행**: 목공 트랙 3행(제1·2·4회), 도장 트랙 4행(제1·2·3·4회) — 운영자 제공 2026 JSON.

### 3.6 `about_history` + `about_history_item` (기존 `history` 폐기)
`about_history`: id bigint PK, year int, display_order int, created_at, updated_at.
`about_history_item`: id bigint PK, history_id FK→about_history(cascade), content text, is_highlighted boolean default false, display_order int, created_at, updated_at.

**시드**: 2018~2025년 8개 연도 + 항목(운영자 제공 JSON, `is_highlighted` 그대로).

### 3.7 `site_section` (신규 — 편집 가능 문구)
| 컬럼 | 타입 |
| --- | --- |
| key | text PK |
| title | text |
| body | text[] |
| updated_at | timestamptz |

**시드 1행**: `about_history_intro` — title "성요셉목수학교 연혁", body 5줄(소개 문구).

### 3.8 RLS / GRANT
- 공개 SELECT(anon) + 관리자 ALL: `course_track`, `exam_schedule`, `about_history`, `about_history_item`, `site_section`
- 기존 정책(course/post/inquiry/application/waitlist 등) 유지
- 삭제: `history` 테이블 및 그 정책, `curriculum_place`·`exam_type` enum

---

## 4. 읽기·매핑 레이어

`src/lib/queries/` 신설 (또는 기존 `src/lib/data` 대체). 서버 전용.

- `getCatalogCourses()` → `CatalogCourse[]` (정규 과정 회차표 / 자격증 과정 트랙·시험일정)
- `getScheduleCourses()` → 홈 일정용 (recruit_status='모집중')
- `getAboutHistory()` → `{ intro: SiteSection, histories: AboutHistoryView[] }`

### 매핑 규칙 (순수 함수 — 단위테스트 대상)
- course → CatalogCourse: schedule_pattern→day('평일주간'→평일, '주말'→주말, '단기'→단기), category→badge, skills→tags, summary→desc, sessions_total+session_hours→meta.
- 자격증 과정: `tracks?: TrackView[]` 채움(트랙 + 각 트랙의 exam_schedule), 회차표 없음.
- curriculum_item → table row: [round, unit, contents(join), place]; hours는 `${hours}H`.
- about_history(+items) → AboutHistoryView { year, items: {content, isHighlighted}[] }, display_order 정렬.

### UI 타입 확장
`CatalogCourse`에 `tracks?: TrackView[]` 추가. `day` 타입을 `"평일"|"주말"|"단기"`로 확장.
`CourseDetail` 컴포넌트: `tracks` 있으면 트랙·시험일정 UI, 없으면 NCS 회차표.

---

## 5. 페이지별 전환

| 페이지 | 소스 | 변경 |
| --- | --- | --- |
| `/courses` 카탈로그 | course | 클라이언트 `CourseCatalog`를 props 주도로. 서버 컴포넌트(`page.tsx`)가 fetch |
| `/courses` 상세(인라인) | curriculum_item / course_track + exam_schedule | 정규=회차표, 자격증=트랙 카드 + 시험일정 표 |
| 홈 일정 섹션 | course (모집중) | `Schedule`에 props 주입. pattern→"평일반/주말반/단기" |
| `/about` 연혁 탭 | about_history(+item) + site_section | 가상 인라인 데이터 → DB. 소개문구 블록 + 연도 타임라인, 강조 항목 primary 색 |

- 정적 `SCHEDULE_COURSES`·`CATALOG_COURSES` 제거. `APPLY_INFO`·`APPLY_COURSES`는 폼 슬라이스까지 정적 유지.
- about 인트로 탭(`AboutIntro`)의 좌측 소개·3포인트는 이번 범위 외(유지). 연혁 탭만 전환.

---

## 6. 렌더링·상태 (CLAUDE.md 4상태)
- 전환 라우트에 ISR(`export const revalidate`), 서버 컴포넌트 fetch.
- **빈 상태**: 데이터 없음 → 대체 문구 + 상담 CTA.
- **에러**: fetch 실패 try/catch → fallback UI + 전화 CTA 유지.
- 로딩: 서버 렌더(ISR)라 별도 스켈레톤 불요.

---

## 7. 검증 기준
1. `pnpm db:reset` 성공 → 5과정·87회차·2트랙·7시험·연혁 8년·site_section 적재
2. `pnpm gen:types` → database.types.ts 갱신, 타입 에러 없음
3. 매핑 함수 vitest 단위테스트 통과 (red→green)
4. `/courses`: 5과정 노출, 정규 4과정 회차표 정상, 자격증 과정 트랙 2개 + 시험일정 표 노출
5. 홈 일정: 모집중 5과정 노출
6. `/about` 연혁: 실제 8년 타임라인 + 소개문구, 강조 항목 색 구분
7. `pnpm build` + `pnpm lint` 통과

---

## 8. 데이터 정본 출처
- 과정 5종·커리큘럼 87회차·트랙 2종·시험일정 7행: 운영자 제공 JSON (대화 기록, 2026-06-14)
- 연혁 8년/항목·소개문구: 운영자 제공 JSON (대화 기록, 2026-06-14)
- 이 JSON을 `supabase/seed.sql`로 transcribe하며, 본 설계서가 구조 정본이다.
