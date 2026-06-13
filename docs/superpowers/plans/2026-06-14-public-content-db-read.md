# 공개 콘텐츠 DB 읽기 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 정적 하드코딩 콘텐츠(과정·연혁)를 Supabase 읽기로 전환하고, 과정·연혁 데이터 모델을 운영 정본에 맞게 재설계한다.

**Architecture:** init 마이그레이션을 직접 수정하고 `db:reset`으로 재적재한다. 공개 읽기는 cookieless anon 클라이언트로 ISR. DB 행→UI 타입 변환은 순수 매핑 함수로 분리해 단위테스트(TDD)하고, 서버 컴포넌트가 fetch→props로 클라이언트 컴포넌트에 주입한다.

**Tech Stack:** Next.js(App Router, server components, ISR) · Supabase(Postgres, @supabase/supabase-js) · TypeScript · Vitest

설계 정본: `docs/superpowers/specs/2026-06-14-public-content-db-read-design.md`. 시드 데이터 정본: 대화 기록(2026-06-14) 운영자 제공 JSON.

---

## File Structure

- `supabase/migrations/20260613120000_init_schema.sql` — 수정(스키마 재설계)
- `supabase/seed.sql` — 재작성(정본 시드)
- `src/lib/supabase/database.types.ts` — `gen:types`로 재생성
- `src/lib/supabase/public.ts` — 신규(cookieless anon 읽기 클라이언트)
- `src/lib/queries/courses.ts` — 신규(과정 fetch + 매핑)
- `src/lib/queries/about.ts` — 신규(연혁 fetch + 매핑)
- `src/lib/queries/mappers.ts` — 신규(순수 매핑 함수)
- `src/lib/queries/mappers.test.ts` — 신규(매핑 단위테스트)
- `src/lib/queries/types.ts` — 신규(UI 뷰 타입: CatalogCourse 확장, TrackView, AboutHistoryView)
- `src/app/(public)/courses/page.tsx` — 수정(async fetch)
- `src/app/(public)/courses/CourseCatalog.tsx` — 수정(props 주도 + 자격증 트랙 UI)
- `src/components/sections/Schedule.tsx` — 수정(props)
- `src/components/sections/HomeInteractive.tsx` — 수정(courses prop 전달)
- `src/app/(public)/page.tsx` — 수정(async fetch)
- `src/app/(public)/about/page.tsx` — 수정(async fetch, AboutClient에 props)
- `src/app/(public)/about/AboutClient.tsx` — 수정(연혁 props 주도)
- `src/lib/data/courses.ts` — 수정(SCHEDULE_COURSES·CATALOG_COURSES 제거, APPLY_* 유지)

---

## Phase 1 — 스키마 재설계

### Task 1: enum·테이블 재설계 (init 마이그레이션 수정)

**Files:**
- Modify: `supabase/migrations/20260613120000_init_schema.sql`

- [ ] **Step 1: enum 변경**

`curriculum_place`·`exam_type` enum 정의 줄을 삭제하고, `schedule_pattern`에 `'단기'` 추가:

```sql
create type schedule_pattern as enum ('평일주간', '주말', '단기');
```

(삭제: `create type curriculum_place ...`, `create type exam_type ...`)

- [ ] **Step 2: `exam_schedule` 테이블 재정의 (트랙 연결)**

기존 `exam_schedule` create 블록을 아래로 교체. (단, `course_track`보다 뒤에 와야 FK가 잡히므로 `course`·`course_track` 정의 이후로 이동)

```sql
create table exam_schedule (
  id           bigint generated always as identity primary key,
  track_id     text not null references course_track(id) on delete cascade,
  year         integer not null,
  round        text not null,
  apply_start  date,
  apply_end    date,
  exam_start   date,
  exam_end     date,
  result_dates date[] not null default '{}',
  sort_order   integer not null default 0
);
create index on exam_schedule (track_id);
```

- [ ] **Step 3: `course` 테이블 수정**

`exam_schedule_id` 컬럼 줄 삭제, `total_hours integer` 추가, `recruit_status` 이후 위치:

```sql
create table course (
  id               text primary key,
  name             text not null,
  category         course_category not null,
  schedule_pattern schedule_pattern,
  funding_type     funding_type not null,
  summary          text,
  skills           text[] not null default '{}',
  sessions_total   integer,
  session_hours    text,
  total_hours      integer,
  duration_text    text,
  tuition          text,
  self_pay         text,
  seo_keywords     text[] not null default '{}',
  recruit_status   recruit_status not null default '모집예정',
  is_deleted       boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index on course (category) where is_deleted = false;
create trigger course_set_updated_at before update on course
  for each row execute function set_updated_at();
```

- [ ] **Step 4: `course_track` 테이블 신규 (course 뒤, exam_schedule 앞)**

```sql
create table course_track (
  id               text primary key,
  course_id        text not null references course(id) on delete cascade,
  name             text not null,
  description      text,
  sessions_total   integer,
  schedule_summary text[] not null default '{}',
  price            integer,
  sort_order       integer not null default 0
);
create index on course_track (course_id);
```

- [ ] **Step 5: `curriculum_item` 컬럼 변경**

```sql
create table curriculum_item (
  id        bigint generated always as identity primary key,
  course_id text not null references course(id) on delete cascade,
  round     integer not null,
  unit      text,
  contents  text[] not null default '{}',
  hours     integer,
  place     text,
  unique (course_id, round)
);
create index on curriculum_item (course_id);
```

- [ ] **Step 6: `history` 삭제 → `about_history`·`about_history_item`·`site_section` 신규**

`history` create 블록을 삭제하고 아래로 교체:

```sql
create table about_history (
  id            bigint generated always as identity primary key,
  year          integer not null,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger about_history_set_updated_at before update on about_history
  for each row execute function set_updated_at();

create table about_history_item (
  id             bigint generated always as identity primary key,
  history_id     bigint not null references about_history(id) on delete cascade,
  content        text not null,
  is_highlighted boolean not null default false,
  display_order  integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index on about_history_item (history_id);

create table site_section (
  key        text primary key,
  title      text,
  body       text[] not null default '{}',
  updated_at timestamptz not null default now()
);
create trigger site_section_set_updated_at before update on site_section
  for each row execute function set_updated_at();
```

- [ ] **Step 7: RLS·GRANT 갱신**

`history` 관련 `alter/policy/grant`를 삭제하고, 신규 테이블에 대해 추가:

```sql
alter table course_track       enable row level security;
alter table about_history      enable row level security;
alter table about_history_item enable row level security;
alter table site_section       enable row level security;

create policy "course_track public read" on course_track for select to anon using (true);
create policy "course_track admin all"   on course_track for all    to authenticated using (true) with check (true);

create policy "exam public read" on exam_schedule for select to anon using (true);
create policy "exam admin all"   on exam_schedule for all    to authenticated using (true) with check (true);

create policy "about_history public read" on about_history for select to anon using (true);
create policy "about_history admin all"   on about_history for all    to authenticated using (true) with check (true);

create policy "about_item public read" on about_history_item for select to anon using (true);
create policy "about_item admin all"   on about_history_item for all    to authenticated using (true) with check (true);

create policy "site_section public read" on site_section for select to anon using (true);
create policy "site_section admin all"   on site_section for all    to authenticated using (true) with check (true);
```

GRANT 줄에서 `history` 제거하고 신규 테이블 추가:

```sql
grant select on course, curriculum_item, course_track, exam_schedule, post, popup, about_history, about_history_item, site_section to anon;
```

(관리자 GRANT는 `on all tables`라 그대로.)

- [ ] **Step 8: reset 후 마이그레이션 적용 검증**

Run: `pnpm db:reset`
Expected: 에러 없이 완료(시드는 다음 태스크에서 채우므로 빈 테이블이어도 OK). enum/테이블 오류 없어야 함.

- [ ] **Step 9: Commit**

```bash
git add supabase/migrations/20260613120000_init_schema.sql
git commit -m "feat: 과정·연혁 스키마 재설계(트랙·시험일정·연혁 정규화)"
```

---

## Phase 2 — 정본 시드

### Task 2: seed.sql 재작성

**Files:**
- Modify: `supabase/seed.sql`

- [ ] **Step 1: course 5행 작성**

```sql
insert into course
  (id, name, category, schedule_pattern, funding_type, summary, skills, sessions_total, session_hours, total_hours, tuition, self_pay, seo_keywords, recruit_status)
values
  ('course_weekday_repair', '평일 집수리과정', '집수리', '평일주간', '경기도무료',
    '주택수리 NCS 종합 과정(목공·전기·타일·욕실설비)', '{"벽설치","천장설치","타일","욕실시공","전기시공","단열공사","배관설비"}', 33, '8H', 264, '무료(전액지원)', NULL,
    '{"인테리어목공","집수리교육","타일시공","욕실시공","전기시공","경기도지원","무료목공교육","전액무료"}', '모집중'),
  ('course_weekday_carpentry', '평일 건축목공과정', '건축목공입문', '평일주간', '국비지원',
    '평일 주간 건축목공 입문', '{"인테리어목공","벽설치","목재창호","천장설치","바닥설치"}', 20, '8H', 160, '상담 안내', '상담 안내',
    '{"인테리어목수","목공","내장목공","목수학원","내일배움카드","국비지원","국비목공학원"}', '모집중'),
  ('course_weekend_carpentry', '주말 건축목공과정', '건축목공입문', '주말', '국비지원',
    '주말 건축목공 입문', '{"인테리어목공","벽설치","목재창호","천장설치","바닥설치"}', 16, '8H', 128, '상담 안내', '상담 안내',
    '{"인테리어목수","목공","내장목공","목수학원","내일배움카드","국비지원","국비목공학원"}', '모집중'),
  ('course_weekend_interior_film', '주말 인테리어필름과정', '인테리어필름입문', '주말', '국비지원',
    '주말 인테리어필름 래핑 입문', '{"필름래핑","바탕처리","단순구조작업","응용구조작업"}', 18, '8H', 144, '상담 안내', '상담 안내',
    '{"인테리어필름","필름래핑","필름기술","필름자격증","필름학원","필름시공"}', '모집중'),
  ('course_architecture_certificate', '건축기능사자격 과정', '기능사', '단기', '자부담',
    '건축목공·건축도장 기능사 실기 속성 대비', '{"건축목공기능사","건축도장기능사","실기대비"}', NULL, NULL, NULL, '트랙별 상이', '트랙별 상이',
    '{"건축목공기능사","건축도장기능사","기능사","국가자격증","큐넷"}', '모집중');
```

- [ ] **Step 2: course_track 2행 작성**

```sql
insert into course_track (id, course_id, name, description, sessions_total, schedule_summary, price, sort_order) values
  ('track_architecture_woodwork', 'course_architecture_certificate', '건축목공기능사', '건축목공기능사 속성 대비반', 5,
    '{"4회 09:00~17:00 (1일 8시간)","1회 09:00~14:00 (1일 5시간)"}', 600000, 1),
  ('track_architecture_painting', 'course_architecture_certificate', '건축도장기능사', '건축도장기능사 속성 대비반', 2,
    '{"1회 09:00~17:00 (1일 7시간)","1회 09:00~15:00 (1일 6시간)"}', 300000, 2);
```

- [ ] **Step 3: exam_schedule 7행 작성**

```sql
insert into exam_schedule (track_id, year, round, apply_start, apply_end, exam_start, exam_end, result_dates, sort_order) values
  ('track_architecture_woodwork', 2026, '제1회', '2026-02-02', '2026-02-05', '2026-03-14', '2026-04-01', '{2026-04-10,2026-04-17}', 1),
  ('track_architecture_woodwork', 2026, '제2회', '2026-04-27', '2026-04-30', '2026-05-30', '2026-06-14', '{2026-06-26,2026-07-03}', 2),
  ('track_architecture_woodwork', 2026, '제4회', '2026-10-12', '2026-10-15', '2026-11-14', '2026-12-02', '{2026-12-11,2026-12-18}', 3),
  ('track_architecture_painting', 2026, '제1회', '2026-02-02', '2026-02-05', '2026-03-14', '2026-04-01', '{2026-04-10,2026-04-17}', 1),
  ('track_architecture_painting', 2026, '제2회', '2026-04-27', '2026-04-30', '2026-05-30', '2026-06-14', '{2026-06-26,2026-07-03}', 2),
  ('track_architecture_painting', 2026, '제3회', '2026-07-27', '2026-07-30', '2026-08-29', '2026-09-16', '{2026-10-02,2026-10-08}', 3),
  ('track_architecture_painting', 2026, '제4회', '2026-10-12', '2026-10-15', '2026-11-14', '2026-12-02', '{2026-12-11,2026-12-18}', 4);
```

- [ ] **Step 4: curriculum_item 87행 작성 (정본 JSON transcribe)**

대화 기록 운영자 제공 JSON을 그대로 옮긴다. `contents`는 trainingContents 배열, `hours`는 8(int), `place`는 location 문자열. course_id 매핑:
- `course_weekday_repair` 33행
- `course_weekday_carpentry` 20행
- `course_weekend_carpentry` 16행
- `course_weekend_interior_film` 18행

행 형식(예시 — repair 1·2회차):

```sql
insert into curriculum_item (course_id, round, unit, contents, hours, place) values
  ('course_weekday_repair', 1, '오리엔테이션 및 건축재료의 이해',
    '{"훈련준수사항 안내 및 교·강사 소개, 훈련생 자기소개","주택수리시장의 동향과 친환경 건축재료의 이해"}', 8, '강의실'),
  ('course_weekday_repair', 2, '건축재료의 이해 / 현장안전공구 / 전동공구사용실무',
    '{"주택수리의 개념과 친환경 건축재료의 이해","기본안전교육, 안전보호구 및 스탠다드마이터쏘 사용실습"}', 8, '강의실/실습실'),
  -- ... 운영자 JSON의 모든 회차 동일 형식으로 ...
  ;
```

> 문자열 내 큰따옴표/쉼표 주의: contents 항목은 큰따옴표로 감싸고, 배열은 `'{...}'`. 항목 내부에 큰따옴표가 있으면 `\"`로 이스케이프.

- [ ] **Step 5: about_history + about_history_item 작성 (정본 JSON)**

연도별로 `about_history` insert 후 `about_history_item`을 history_id로 연결. CTE 또는 연도 단위 블록 사용:

```sql
with h2025 as (insert into about_history (year, display_order) values (2025, 1) returning id)
insert into about_history_item (history_id, content, is_highlighted, display_order)
select id, v.content, v.hl, v.ord from h2025, (values
  ('고용노동부 3년인증 훈련기관인증', true, 1)
) as v(content, hl, ord);
```

2024~2018년 동일 패턴으로 작성(운영자 제공 JSON의 content·isHighlighted·displayOrder 그대로). 각 연도 display_order: 2025=1 … 2018=8.

- [ ] **Step 6: site_section 작성**

```sql
insert into site_section (key, title, body) values
  ('about_history_intro', '성요셉목수학교 연혁',
    '{"다양한 공식인증을 받은 체계적인 교육기관에서","전문적인 훈련을 통해 실무 역량을 키우고","성공적인 미래를 준비하세요.","변화하는 시대에 맞춘 최신 커리큘럼으로,","자신만의 경쟁력을 높일 수 있습니다."}');
```

- [ ] **Step 7: 기존 시드의 구 데이터 제거**

기존 seed.sql의 구 `exam_schedule`(id text·exam_type 구조), 구 `course`(7행·구 컬럼), 구 `curriculum_item`(content text), 구 `history` insert를 모두 삭제하고 위 신규 insert로 대체.

- [ ] **Step 8: reset + 행수 검증**

Run: `pnpm db:reset`
Expected: 에러 없이 완료.

검증 쿼리(로컬 REST 또는 psql). psql 사용 가능 시:
```bash
psql "$LOCAL_DB_URL" -c "select count(*) from course; select count(*) from curriculum_item; select count(*) from course_track; select count(*) from exam_schedule; select count(*) from about_history; select count(*) from about_history_item;"
```
Expected: course=5, curriculum_item=87, course_track=2, exam_schedule=7, about_history=8, about_history_item=합계(주신 JSON 항목 수).

- [ ] **Step 9: Commit**

```bash
git add supabase/seed.sql
git commit -m "feat: 과정·커리큘럼·트랙·시험일정·연혁 정본 시드 작성"
```

### Task 3: 타입 재생성

- [ ] **Step 1: gen:types 실행**

Run: `pnpm gen:types`
Expected: `src/lib/supabase/database.types.ts` 갱신, 신규 테이블 타입 포함.

- [ ] **Step 2: Commit**

```bash
git add src/lib/supabase/database.types.ts
git commit -m "chore: Supabase 타입 재생성"
```

---

## Phase 3 — 읽기·매핑 레이어 (TDD)

### Task 4: UI 뷰 타입 + cookieless anon 클라이언트

**Files:**
- Create: `src/lib/queries/types.ts`
- Create: `src/lib/supabase/public.ts`

- [ ] **Step 1: 뷰 타입 작성**

```ts
// src/lib/queries/types.ts
export type CourseDay = "평일" | "주말" | "단기";

export interface TrackExamView {
  round: string;
  applyPeriod: string;   // "02.02 ~ 02.05"
  examPeriod: string;    // "03.14 ~ 04.01"
  resultDates: string;   // "04.10, 04.17"
}

export interface TrackView {
  name: string;
  description: string | null;
  sessionsText: string;  // "5회"
  priceText: string;     // "600,000원"
  scheduleSummary: string[];
  exams: TrackExamView[];
}

export interface CatalogCourse {
  id: string;
  day: CourseDay;
  badge: string;
  name: string;
  tags: string[];
  desc: string;
  meta: string;
  table: string[][];      // 회차/능력단위/훈련내용/교육장소
  tracks?: TrackView[];   // 자격증 과정만
  moreNote?: string;
}

export interface ScheduleCourse {
  name: string;
  startDate: string;      // "평일반"|"주말반"|"단기"
  meta: string;
  open: boolean;
}

export interface AboutHistoryView {
  year: number;
  items: { content: string; isHighlighted: boolean }[];
}

export interface SiteSectionView {
  title: string | null;
  body: string[];
}
```

- [ ] **Step 2: cookieless anon 클라이언트**

```ts
// src/lib/supabase/public.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/** 공개 콘텐츠 읽기 전용(쿠키 없음 → ISR 정적 렌더 가능). anon 키 사용으로 RLS 적용. */
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/queries/types.ts src/lib/supabase/public.ts
git commit -m "feat: 공개 읽기 뷰 타입 + cookieless anon 클라이언트"
```

### Task 5: 매핑 함수 (TDD)

**Files:**
- Create: `src/lib/queries/mappers.test.ts`
- Create: `src/lib/queries/mappers.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
// src/lib/queries/mappers.test.ts
import { describe, it, expect } from "vitest";
import {
  patternToDay, patternToStartDate, categoryToBadge,
  curriculumToTable, trackToView, historyToView,
} from "./mappers";

describe("patternToDay", () => {
  it("maps schedule_pattern to UI day", () => {
    expect(patternToDay("평일주간")).toBe("평일");
    expect(patternToDay("주말")).toBe("주말");
    expect(patternToDay("단기")).toBe("단기");
    expect(patternToDay(null)).toBe("평일");
  });
});

describe("patternToStartDate", () => {
  it("maps to 반 label", () => {
    expect(patternToStartDate("평일주간")).toBe("평일반");
    expect(patternToStartDate("주말")).toBe("주말반");
    expect(patternToStartDate("단기")).toBe("단기");
  });
});

describe("categoryToBadge", () => {
  it("shortens category", () => {
    expect(categoryToBadge("집수리")).toBe("집수리");
    expect(categoryToBadge("건축목공입문")).toBe("입문");
    expect(categoryToBadge("인테리어필름입문")).toBe("입문");
    expect(categoryToBadge("기능사")).toBe("자격");
  });
});

describe("curriculumToTable", () => {
  it("builds 4-col rows joined by newline, sorted by round", () => {
    const rows = [
      { round: 2, unit: "U2", contents: ["a", "b"], hours: 8, place: "실습실" },
      { round: 1, unit: "U1", contents: ["x"], hours: 8, place: "강의실" },
    ];
    expect(curriculumToTable(rows)).toEqual([
      ["1", "U1", "x", "강의실"],
      ["2", "U2", "a\nb", "실습실"],
    ]);
  });
});

describe("trackToView", () => {
  it("formats price/sessions and exam periods", () => {
    const track = {
      name: "건축목공기능사", description: "속성", sessions_total: 5,
      schedule_summary: ["4회 8h"], price: 600000,
    };
    const exams = [{
      round: "제1회", apply_start: "2026-02-02", apply_end: "2026-02-05",
      exam_start: "2026-03-14", exam_end: "2026-04-01",
      result_dates: ["2026-04-10", "2026-04-17"],
    }];
    const v = trackToView(track, exams);
    expect(v.priceText).toBe("600,000원");
    expect(v.sessionsText).toBe("5회");
    expect(v.exams[0].applyPeriod).toBe("02.02 ~ 02.05");
    expect(v.exams[0].examPeriod).toBe("03.14 ~ 04.01");
    expect(v.exams[0].resultDates).toBe("04.10, 04.17");
  });
});

describe("historyToView", () => {
  it("groups items by year sorted, items by display_order", () => {
    const histories = [{ id: 1, year: 2025, display_order: 1 }];
    const items = [
      { history_id: 1, content: "b", is_highlighted: false, display_order: 2 },
      { history_id: 1, content: "a", is_highlighted: true, display_order: 1 },
    ];
    expect(historyToView(histories, items)).toEqual([
      { year: 2025, items: [
        { content: "a", isHighlighted: true },
        { content: "b", isHighlighted: false },
      ] },
    ]);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test -- src/lib/queries/mappers.test.ts`
Expected: FAIL (mappers 모듈 없음).

- [ ] **Step 3: 최소 구현**

```ts
// src/lib/queries/mappers.ts
import type { CourseDay, TrackView, AboutHistoryView } from "./types";

export function patternToDay(p: string | null): CourseDay {
  if (p === "주말") return "주말";
  if (p === "단기") return "단기";
  return "평일";
}

export function patternToStartDate(p: string | null): string {
  if (p === "주말") return "주말반";
  if (p === "단기") return "단기";
  return "평일반";
}

export function categoryToBadge(c: string): string {
  if (c === "집수리") return "집수리";
  if (c === "기능사") return "자격";
  return "입문"; // 건축목공입문 / 인테리어필름입문
}

interface CurriculumRow {
  round: number; unit: string | null; contents: string[];
  hours: number | null; place: string | null;
}
export function curriculumToTable(rows: CurriculumRow[]): string[][] {
  return [...rows]
    .sort((a, b) => a.round - b.round)
    .map((r) => [
      String(r.round),
      r.unit ?? "",
      r.contents.join("\n"),
      r.place ?? "",
    ]);
}

function md(date: string | null): string {
  if (!date) return "";
  const [, m, d] = date.split("-");
  return `${m}.${d}`;
}

interface TrackRow {
  name: string; description: string | null; sessions_total: number | null;
  schedule_summary: string[]; price: number | null;
}
interface ExamRow {
  round: string; apply_start: string | null; apply_end: string | null;
  exam_start: string | null; exam_end: string | null; result_dates: string[];
}
export function trackToView(track: TrackRow, exams: ExamRow[]): TrackView {
  return {
    name: track.name,
    description: track.description,
    sessionsText: track.sessions_total != null ? `${track.sessions_total}회` : "",
    priceText: track.price != null ? `${track.price.toLocaleString("ko-KR")}원` : "상담 안내",
    scheduleSummary: track.schedule_summary,
    exams: exams.map((e) => ({
      round: e.round,
      applyPeriod: `${md(e.apply_start)} ~ ${md(e.apply_end)}`,
      examPeriod: `${md(e.exam_start)} ~ ${md(e.exam_end)}`,
      resultDates: e.result_dates.map(md).join(", "),
    })),
  };
}

interface HistoryRow { id: number; year: number; display_order: number; }
interface HistoryItemRow {
  history_id: number; content: string; is_highlighted: boolean; display_order: number;
}
export function historyToView(
  histories: HistoryRow[], items: HistoryItemRow[],
): AboutHistoryView[] {
  return [...histories]
    .sort((a, b) => a.display_order - b.display_order)
    .map((h) => ({
      year: h.year,
      items: items
        .filter((it) => it.history_id === h.id)
        .sort((a, b) => a.display_order - b.display_order)
        .map((it) => ({ content: it.content, isHighlighted: it.is_highlighted })),
    }));
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm test -- src/lib/queries/mappers.test.ts`
Expected: PASS (모든 테스트).

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries/mappers.ts src/lib/queries/mappers.test.ts
git commit -m "feat: DB→UI 매핑 함수 + 단위테스트"
```

### Task 6: fetch 쿼리 함수

**Files:**
- Create: `src/lib/queries/courses.ts`
- Create: `src/lib/queries/about.ts`

- [ ] **Step 1: courses.ts 작성**

```ts
// src/lib/queries/courses.ts
import { createPublicClient } from "@/lib/supabase/public";
import type { CatalogCourse, ScheduleCourse } from "./types";
import {
  patternToDay, patternToStartDate, categoryToBadge,
  curriculumToTable, trackToView,
} from "./mappers";

export async function getCatalogCourses(): Promise<CatalogCourse[]> {
  const sb = createPublicClient();
  const [{ data: courses }, { data: curricula }, { data: tracks }, { data: exams }] =
    await Promise.all([
      sb.from("course").select("*").eq("is_deleted", false),
      sb.from("curriculum_item").select("*"),
      sb.from("course_track").select("*").order("sort_order"),
      sb.from("exam_schedule").select("*").order("sort_order"),
    ]);

  return (courses ?? []).map((c) => {
    const isCert = c.category === "기능사";
    const courseTracks = (tracks ?? []).filter((t) => t.course_id === c.id);
    const table = isCert
      ? []
      : curriculumToTable((curricula ?? []).filter((q) => q.course_id === c.id));
    const trackViews = isCert
      ? courseTracks.map((t) =>
          trackToView(t, (exams ?? []).filter((e) => e.track_id === t.id)))
      : undefined;
    const metaParts = [
      c.sessions_total ? `총 ${c.sessions_total}회차` : null,
      c.session_hours ? `회차당 ${c.session_hours}` : null,
    ].filter(Boolean);
    return {
      id: c.id,
      day: patternToDay(c.schedule_pattern),
      badge: categoryToBadge(c.category),
      name: c.name,
      tags: c.skills ?? [],
      desc: c.summary ?? "",
      meta: metaParts.join(" · ") || (isCert ? "자격증 실기 속성 대비" : ""),
      table,
      tracks: trackViews,
    } satisfies CatalogCourse;
  });
}

export async function getScheduleCourses(): Promise<ScheduleCourse[]> {
  const sb = createPublicClient();
  const { data } = await sb
    .from("course")
    .select("name, schedule_pattern, summary, recruit_status, is_deleted")
    .eq("is_deleted", false);
  return (data ?? []).map((c) => ({
    name: c.name,
    startDate: patternToStartDate(c.schedule_pattern),
    meta: c.summary ?? "",
    open: c.recruit_status === "모집중",
  }));
}
```

- [ ] **Step 2: about.ts 작성**

```ts
// src/lib/queries/about.ts
import { createPublicClient } from "@/lib/supabase/public";
import type { AboutHistoryView, SiteSectionView } from "./types";
import { historyToView } from "./mappers";

export async function getAboutHistory(): Promise<{
  intro: SiteSectionView | null;
  histories: AboutHistoryView[];
}> {
  const sb = createPublicClient();
  const [{ data: histories }, { data: items }, { data: section }] =
    await Promise.all([
      sb.from("about_history").select("*"),
      sb.from("about_history_item").select("*"),
      sb.from("site_section").select("*").eq("key", "about_history_intro").maybeSingle(),
    ]);
  return {
    intro: section ? { title: section.title, body: section.body ?? [] } : null,
    histories: historyToView(histories ?? [], items ?? []),
  };
}
```

- [ ] **Step 3: 타입체크**

Run: `pnpm build` (또는 `npx tsc --noEmit`)
Expected: 쿼리 파일 타입 에러 없음. (Supabase 타입과 매핑 함수 인자 호환 확인)

- [ ] **Step 4: Commit**

```bash
git add src/lib/queries/courses.ts src/lib/queries/about.ts
git commit -m "feat: 과정·연혁 fetch 쿼리 함수"
```

---

## Phase 4 — UI 전환

### Task 7: 과정 카탈로그 props 주도 + 자격증 트랙 UI

**Files:**
- Modify: `src/app/(public)/courses/page.tsx`
- Modify: `src/app/(public)/courses/CourseCatalog.tsx`
- Modify: `src/lib/data/courses.ts` (정적 export 제거)

- [ ] **Step 1: CourseCatalog를 props 주도로 변경**

`CATALOG_COURSES` import 제거, props로 `courses: CatalogCourse[]` 수신. `CatalogCourse` 타입을 `@/lib/queries/types`에서 import. `CourseGrid`·`CourseCatalog`가 props의 courses 사용.

```ts
import type { CatalogCourse, TrackView } from "@/lib/queries/types";
// ...
function CourseGrid({ courses, onSelect }: { courses: CatalogCourse[]; onSelect: (id: string) => void }) { /* CATALOG_COURSES → courses */ }
export function CourseCatalog({ courses }: { courses: CatalogCourse[] }) {
  const [sel, setSel] = useState<string | null>(null);
  const router = useRouter();
  const course = courses.find((c) => c.id === sel) ?? null;
  // ... (동일 로직)
}
```

빈 상태: `courses.length === 0`이면 `CourseGrid` 자리에 "현재 안내 중인 과정이 없습니다. 전화로 문의해 주세요." + 전화 CTA.

- [ ] **Step 2: CourseDetail에 자격증 트랙 분기 추가**

`course.tracks`가 있으면 회차표 대신 트랙 카드(이름·기간요약·수강료) + 트랙별 시험일정 표(round/접수/시험/발표)를 렌더. 없으면 기존 NCS 회차표 유지.

```tsx
{course.tracks ? (
  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
    {course.tracks.map((t) => (
      <Card key={t.name} padding={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "16px 18px", background: "var(--color-primary-soft)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: "var(--color-ink)" }}>{t.name}</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--color-primary)" }}>{t.priceText} · {t.sessionsText}</span>
        </div>
        <div style={{ padding: "12px 18px", fontSize: 14, color: "var(--color-muted)" }}>
          {t.scheduleSummary.map((s, i) => <div key={i}>· {s}</div>)}
        </div>
        <div className="ncs-row ncs-head" style={{ gridTemplateColumns: "1fr 1.2fr 1.2fr 1.4fr" }}>
          <span>회차</span><span>실기 접수</span><span>실기 시험</span><span>합격 발표</span>
        </div>
        {t.exams.map((e, i) => (
          <div key={i} className="ncs-row" style={{ gridTemplateColumns: "1fr 1.2fr 1.2fr 1.4fr" }}>
            <span style={{ fontWeight: 800 }}>{e.round}</span>
            <span>{e.applyPeriod}</span><span>{e.examPeriod}</span><span className="ncs-sub">{e.resultDates}</span>
          </div>
        ))}
      </Card>
    ))}
  </div>
) : (
  /* 기존 NCS 회차표 Card */
)}
```

> 자격증 과정의 회차표 grid는 5열이 아닌 4열이므로 인라인 gridTemplateColumns로 덮어쓴다. 회차표가 비면(`table.length===0` && tracks 없음) "회차 정보는 상담 시 안내드립니다" 표시.

- [ ] **Step 3: courses/page.tsx에서 fetch**

```tsx
import { getCatalogCourses } from "@/lib/queries/courses";
import { PageHero } from "@/components/sections/PageHero";
import { CourseCatalog } from "./CourseCatalog";

export const revalidate = 3600;

export default async function CoursesPage() {
  let courses;
  try {
    courses = await getCatalogCourses();
  } catch {
    courses = [];
  }
  return (
    <>
      <PageHero eyebrow="훈련과정" title="성요셉목수학교 과정 안내" sub="목공·집수리·인테리어 전문 기술을 체계적으로 배웁니다. 초보자부터 자격증 준비생까지 수준별 과정을 운영합니다." />
      <CourseCatalog courses={courses} />
    </>
  );
}
```

- [ ] **Step 4: 정적 export 제거**

`src/lib/data/courses.ts`에서 `SCHEDULE_COURSES`·`CATALOG_COURSES`와 `ScheduleCourse`·`CatalogCourse` 타입 제거. `APPLY_COURSES`·`APPLY_INFO`·`ApplyInfo` 유지. (제거로 깨지는 import는 후속 태스크에서 교체됨)

- [ ] **Step 5: 빌드·렌더 확인**

Run: `pnpm build`
Expected: courses 페이지 빌드 성공.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(public\)/courses src/lib/data/courses.ts
git commit -m "feat: 과정 카탈로그 DB 읽기 전환 + 자격증 트랙·시험일정 UI"
```

### Task 8: 홈 일정 섹션 props 주도

**Files:**
- Modify: `src/components/sections/Schedule.tsx`
- Modify: `src/components/sections/HomeInteractive.tsx`
- Modify: `src/app/(public)/page.tsx`

- [ ] **Step 1: Schedule가 courses prop 수신**

`SCHEDULE_COURSES` import 제거. `courses: ScheduleCourse[]` prop 추가(`@/lib/queries/types`). map 대상 교체. 빈 배열이면 "현재 모집 중인 과정 안내는 전화로 도와드립니다" + 전화 CTA.

```tsx
import type { ScheduleCourse } from "@/lib/queries/types";
interface ScheduleProps { courses: ScheduleCourse[]; onApply?: (name: string) => void; }
export function Schedule({ courses, onApply }: ScheduleProps) { /* SCHEDULE_COURSES → courses */ }
```

- [ ] **Step 2: ScheduleSection이 courses 전달**

```tsx
import type { ScheduleCourse } from "@/lib/queries/types";
export function ScheduleSection({ courses }: { courses: ScheduleCourse[] }) {
  const router = useRouter();
  function handleApply(courseName: string) { router.push(`/apply?course=${encodeURIComponent(courseName)}`); }
  return <Schedule courses={courses} onApply={handleApply} />;
}
```

- [ ] **Step 3: home page.tsx fetch**

```tsx
import { getScheduleCourses } from "@/lib/queries/courses";
export const revalidate = 3600;
export default async function HomePage() {
  let scheduleCourses;
  try { scheduleCourses = await getScheduleCourses(); } catch { scheduleCourses = []; }
  return (
    <>
      <Banner /><AwardsStrip /><HeroIntentSection /><Barriers /><SocialProof /><Videos />
      <ScheduleSection courses={scheduleCourses} />
      <ClosingCTA />
    </>
  );
}
```

- [ ] **Step 4: 빌드 확인**

Run: `pnpm build`
Expected: 홈 페이지 빌드 성공.

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/Schedule.tsx src/components/sections/HomeInteractive.tsx src/app/\(public\)/page.tsx
git commit -m "feat: 홈 일정 섹션 DB 읽기 전환"
```

### Task 9: 연혁 탭 DB 전환

**Files:**
- Modify: `src/app/(public)/about/page.tsx`
- Modify: `src/app/(public)/about/AboutClient.tsx`

- [ ] **Step 1: about/page.tsx fetch + props**

```tsx
import { getAboutHistory } from "@/lib/queries/about";
export const revalidate = 3600;
export default async function AboutPage() {
  let history;
  try { history = await getAboutHistory(); } catch { history = { intro: null, histories: [] }; }
  return (
    <>
      <PageHero .../>
      <AboutClient intro={history.intro} histories={history.histories} />
    </>
  );
}
```

(기존 about/page.tsx 구조에 맞춰 PageHero 부분 유지.)

- [ ] **Step 2: AboutClient가 props 수신, AboutHistory 재작성**

`AboutClient`에 `{ intro: SiteSectionView | null; histories: AboutHistoryView[] }` props 추가. 내부 `AboutHistory`의 하드코딩 `eras` 제거 → props.histories 사용. 인트로 블록(intro.title + intro.body 줄들) 추가. `isHighlighted` 항목은 primary 색.

```tsx
import type { AboutHistoryView, SiteSectionView } from "@/lib/queries/types";

function AboutHistory({ intro, histories }: { intro: SiteSectionView | null; histories: AboutHistoryView[] }) {
  if (histories.length === 0) {
    return <p style={{ textAlign: "center", color: "var(--color-muted)" }}>연혁 정보를 준비 중입니다.</p>;
  }
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>
      {intro && (
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 8 }}>
          {intro.title && <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,2.6vw,28px)", fontWeight: 700, color: "var(--color-ink)", margin: 0 }}>{intro.title}</h2>}
          <p style={{ fontSize: 15.5, color: "var(--color-body)", lineHeight: 1.8, margin: 0 }}>
            {intro.body.map((line, i) => <span key={i} style={{ display: "block" }}>{line}</span>)}
          </p>
        </div>
      )}
      <div style={{ borderLeft: "2px solid var(--color-hairline)", marginLeft: 9, display: "flex", flexDirection: "column" }}>
        {histories.map((h) => (
          <div key={h.year} style={{ padding: "12px 0 12px 22px", position: "relative" }}>
            <span style={{ position: "absolute", left: -6, top: 19, width: 10, height: 10, borderRadius: 9999, background: "var(--color-surface-card)", border: "2px solid var(--color-primary)" }} />
            <span style={{ fontSize: 15, fontWeight: 800, color: "var(--color-ink)", fontVariantNumeric: "tabular-nums" }}>{h.year}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
              {h.items.map((it, i) => (
                <span key={i} style={{ fontSize: 15, lineHeight: 1.6, wordBreak: "keep-all", color: it.isHighlighted ? "var(--color-primary)" : "var(--color-body)", fontWeight: it.isHighlighted ? 700 : 500 }}>
                  {it.content}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AboutClient({ intro, histories }: { intro: SiteSectionView | null; histories: AboutHistoryView[] }) {
  const tabs = ["학원소개", "훈련기관 연혁"];
  const [tab, setTab] = useState(0);
  // ... 탭 버튼 동일 ...
  // {tab === 0 ? <AboutIntro /> : <AboutHistory intro={intro} histories={histories} />}
}
```

`AboutIntro`(학원소개 탭)는 변경하지 않음.

- [ ] **Step 3: 빌드 확인**

Run: `pnpm build`
Expected: about 페이지 빌드 성공.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(public\)/about
git commit -m "feat: 학원소개 연혁 탭 DB 읽기 전환"
```

---

## Phase 5 — 최종 검증

### Task 10: 통합 검증

- [ ] **Step 1: 전체 테스트**

Run: `pnpm test`
Expected: 매핑 테스트 + 기존 테스트 모두 PASS.

- [ ] **Step 2: lint**

Run: `pnpm lint`
Expected: 에러 없음.

- [ ] **Step 3: build**

Run: `pnpm build`
Expected: 성공.

- [ ] **Step 4: dev 서버 + preview 렌더 확인**

dev 서버 기동 후 `/`, `/courses`, `/about` 렌더 확인:
- `/courses`: 5과정 카드, 정규 4과정 회차표, 자격증 과정 트랙 2개 + 시험일정 표
- `/`: 일정 섹션 모집중 과정
- `/about` 연혁 탭: 8년 타임라인 + 소개문구 + 강조 항목 색 구분

- [ ] **Step 5: 최종 커밋(없으면 생략)**

작업 트리 정리되어 있으면 생략.
