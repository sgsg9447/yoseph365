-- =============================================================
-- 성요셉목수학교 — 초기 스키마
-- 출처: 데이터정의서 v2 · 엔지니어링 설계서 §5(테이블)·§7(RLS)
--        + 2026-06-14 과정·연혁 데이터 모델 재설계
-- 원칙: 공개는 게시 콘텐츠 읽기 + 폼 쓰기만,
--       개인정보가 든 제출 테이블의 읽기·수정은 관리자(authenticated)만.
-- =============================================================

-- ---------- Enums (데이터정의서 §2) ----------
create type funding_type          as enum ('경기도무료', '국비지원', '자부담');
create type course_category       as enum ('집수리', '건축목공입문', '인테리어필름입문', '기능사');
create type schedule_pattern      as enum ('평일주간', '주말', '단기');
create type recruit_status        as enum ('모집예정', '모집중', '마감');
create type application_status    as enum ('신규', '상담중', '등록확인', '보류');
create type inquiry_category      as enum ('국비지원', '과정문의', '기타');
create type inquiry_status        as enum ('답변대기', '답변완료');
create type post_category         as enum ('훈련사진', '수강일지', '수료식');
-- applicationFlowType(A·B·C)은 funding_type에서 파생되는 config이므로 컬럼으로 두지 않는다.

-- ---------- updated_at 자동 갱신 트리거 함수 ----------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- Course — 과정 (핵심 §3) ----------
create table course (
  id               text primary key,
  name             text not null,
  category         course_category not null,
  schedule_pattern schedule_pattern,
  funding_type     funding_type not null,         -- 신청 흐름(A·B·C) 결정
  summary          text,
  skills           text[] not null default '{}',
  sessions_total   integer,
  session_hours    text,
  total_hours      integer,
  duration_text    text,
  tuition          text,                           -- 없으면 "상담 안내"
  self_pay         text,                           -- 개인별 상이 → "상담 안내" 가능
  seo_keywords     text[] not null default '{}',   -- 과정별 SEO(오가닉 유입)
  recruit_status   recruit_status not null default '모집예정',  -- 운영자 수동
  sort_order       integer not null default 0,                  -- 카탈로그 노출 순서
  is_deleted       boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index on course (category) where is_deleted = false;
create trigger course_set_updated_at before update on course
  for each row execute function set_updated_at();

-- ---------- CourseTrack — 자격증 과정의 트랙(목공/도장 등) ----------
create table course_track (
  id               text primary key,
  course_id        text not null references course(id) on delete cascade,
  name             text not null,
  description      text,
  sessions_total   integer,
  schedule_summary text[] not null default '{}',
  price            integer,
  recruit_status   recruit_status not null default '모집중',  -- 트랙별 모집상태(운영자 수동)
  sort_order       integer not null default 0
);
create index on course_track (course_id);

-- ---------- ExamSchedule — 기능사 시험일정 (큐넷, 트랙별 §6) ----------
create table exam_schedule (
  id           bigint generated always as identity primary key,
  track_id     text not null references course_track(id) on delete cascade,
  year         integer not null,
  round        text not null,           -- 제1회 등
  apply_start  date,
  apply_end    date,
  exam_start   date,
  exam_end     date,
  result_dates date[] not null default '{}',  -- 합격발표(복수)
  sort_order   integer not null default 0
);
create index on exam_schedule (track_id);

-- ---------- CurriculumItem — 회차 (Course에 내포 §4) ----------
create table curriculum_item (
  id        bigint generated always as identity primary key,
  course_id text not null references course(id) on delete cascade,
  round     integer not null,
  unit      text,                         -- 능력단위
  contents  text[] not null default '{}', -- 훈련내용(여러 줄)
  hours     integer,
  place     text,                         -- 강의실 / 실습실 / 강의실·실습실 조합
  unique (course_id, round)
);
create index on curriculum_item (course_id);

-- ---------- CourseApplyInfo — 과정별 모집안내(신청 페이지, 1:1) ----------
create table course_apply_info (
  course_id       text primary key references course(id) on delete cascade,
  qualifications  text[] not null default '{}',  -- 신청자격
  apply_method    text[] not null default '{}',  -- 지원방법(방문/이메일 등; 경기도 전액지원 과정)
  recruit_period  text,                          -- 모집기간(빈 가능)
  training_period text,                           -- 훈련기간
  training_time   text[] not null default '{}',  -- 훈련시간(여러 줄)
  capacity        text,                           -- 모집인원
  cost            text,                           -- 훈련비용
  cost_notes      text[] not null default '{}',  -- 자비부담 등 비고
  steps           text[] not null default '{}',  -- 진행순서/등록방법
  exclusions      text[] not null default '{}',  -- 신청제외대상
  updated_at      timestamptz not null default now()
);
create trigger course_apply_info_set_updated_at before update on course_apply_info
  for each row execute function set_updated_at();

-- ---------- Schedule — 개강일정 (운영자용, 사용자 미표시 §7) ----------
create table schedule (
  id         bigint generated always as identity primary key,
  course_id  text not null references course(id) on delete cascade,
  open_date  date,
  note       text,
  created_at timestamptz not null default now()
);

-- ---------- Application — 수강신청/가등록 (사이트 폼 §8) ----------
create table application (
  id               bigint generated always as identity primary key,
  name             text not null,
  phone            text not null,
  selected_courses text[] not null default '{}',   -- 관심/신청 과정(N:M)
  additional_note  text,
  status           application_status not null default '신규',
  admin_memo       text,
  privacy_agreed   boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger application_set_updated_at before update on application
  for each row execute function set_updated_at();

-- ---------- Inquiry — 상담문의 (Q&A §9) ----------
create table inquiry (
  id             bigint generated always as identity primary key,
  name           text not null,
  phone          text not null,
  category       inquiry_category not null,
  course_id      text references course(id),
  title          text,
  content        text not null,
  status         inquiry_status not null default '답변대기',
  answer         text,
  privacy_agreed boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger inquiry_set_updated_at before update on inquiry
  for each row execute function set_updated_at();

-- ---------- Waitlist — 대기신청 (마감 과정 대기자, 엔지니어링 §5·§10) ----------
create table waitlist (
  id             bigint generated always as identity primary key,
  name           text not null,
  phone          text not null,
  course_id      text references course(id),
  note           text,
  privacy_agreed boolean not null default false,
  created_at     timestamptz not null default now()
);

-- ---------- Post — 게시글/훈련사진 (§10) ----------
create table post (
  id           bigint generated always as identity primary key,
  category     post_category not null,
  title        text not null,
  content      text,
  images       text[] not null default '{}',   -- S3 객체 키/URL 배열
  is_published boolean not null default true,
  is_deleted   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger post_set_updated_at before update on post
  for each row execute function set_updated_at();

-- ---------- AboutHistory — 연혁(연도) ----------
create table about_history (
  id            bigint generated always as identity primary key,
  year          integer not null,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger about_history_set_updated_at before update on about_history
  for each row execute function set_updated_at();

-- ---------- AboutHistoryItem — 연도 내 이력 항목(강조 가능) ----------
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

-- ---------- SiteSection — 편집 가능한 정적 문구(연혁 소개 등) ----------
create table site_section (
  key        text primary key,
  title      text,
  body       text[] not null default '{}',
  updated_at timestamptz not null default now()
);
create trigger site_section_set_updated_at before update on site_section
  for each row execute function set_updated_at();

-- ---------- Popup — 팝업/배너 (어드민 §6) ----------
create table popup (
  id         bigint generated always as identity primary key,
  title      text,
  image_url  text,
  link_url   text,
  start_at   timestamptz,
  end_at     timestamptz,
  sort_order integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- =============================================================
-- RLS (엔지니어링 §7) — 모든 테이블에 활성화
-- =============================================================
alter table course             enable row level security;
alter table course_track       enable row level security;
alter table exam_schedule      enable row level security;
alter table curriculum_item    enable row level security;
alter table course_apply_info  enable row level security;
alter table schedule           enable row level security;
alter table application        enable row level security;
alter table inquiry            enable row level security;
alter table waitlist           enable row level security;
alter table post               enable row level security;
alter table about_history      enable row level security;
alter table about_history_item enable row level security;
alter table site_section       enable row level security;
alter table popup              enable row level security;

-- 콘텐츠 테이블: 공개 SELECT(게시된 것만) + 관리자 ALL
create policy "course public read"   on course   for select to anon using (is_deleted = false);
create policy "course admin all"     on course   for all    to authenticated using (true) with check (true);

create policy "course_track public read" on course_track for select to anon using (true);
create policy "course_track admin all"   on course_track for all    to authenticated using (true) with check (true);

create policy "exam public read"     on exam_schedule for select to anon using (true);
create policy "exam admin all"       on exam_schedule for all    to authenticated using (true) with check (true);

create policy "curriculum public read" on curriculum_item for select to anon using (true);
create policy "curriculum admin all"   on curriculum_item for all    to authenticated using (true) with check (true);

create policy "apply_info public read" on course_apply_info for select to anon using (true);
create policy "apply_info admin all"   on course_apply_info for all    to authenticated using (true) with check (true);

create policy "post public read"     on post     for select to anon using (is_published = true and is_deleted = false);
create policy "post admin all"       on post     for all    to authenticated using (true) with check (true);

create policy "about_history public read" on about_history for select to anon using (true);
create policy "about_history admin all"   on about_history for all    to authenticated using (true) with check (true);

create policy "about_item public read" on about_history_item for select to anon using (true);
create policy "about_item admin all"   on about_history_item for all    to authenticated using (true) with check (true);

create policy "site_section public read" on site_section for select to anon using (true);
create policy "site_section admin all"   on site_section for all    to authenticated using (true) with check (true);

create policy "popup public read"    on popup    for select to anon
  using (is_active = true and (start_at is null or start_at <= now()) and (end_at is null or end_at >= now()));
create policy "popup admin all"      on popup    for all    to authenticated using (true) with check (true);

-- schedule: 사용자 미표시 → 공개 정책 없음, 관리자만
create policy "schedule admin all"   on schedule for all    to authenticated using (true) with check (true);

-- 제출 테이블: 공개는 INSERT만(개인정보 동의 필수), 읽기·수정·삭제는 관리자만
create policy "application public insert" on application for insert to anon with check (privacy_agreed = true);
create policy "application admin rw"      on application for select to authenticated using (true);
create policy "application admin update"  on application for update to authenticated using (true) with check (true);
create policy "application admin delete"  on application for delete to authenticated using (true);

create policy "inquiry public insert"     on inquiry for insert to anon with check (privacy_agreed = true);
create policy "inquiry admin select"      on inquiry for select to authenticated using (true);
create policy "inquiry admin update"      on inquiry for update to authenticated using (true) with check (true);
create policy "inquiry admin delete"      on inquiry for delete to authenticated using (true);

create policy "waitlist public insert"    on waitlist for insert to anon with check (privacy_agreed = true);
create policy "waitlist admin select"     on waitlist for select to authenticated using (true);
create policy "waitlist admin update"     on waitlist for update to authenticated using (true) with check (true);
create policy "waitlist admin delete"     on waitlist for delete to authenticated using (true);

-- =============================================================
-- 테이블 GRANT — RLS와 별개로 역할에 권한을 줘야 PostgREST가 동작.
-- (RLS가 행을 제한하므로 GRANT가 넓어도 안전: 정책 없는 행은 노출되지 않음)
-- =============================================================
grant usage on schema public to anon, authenticated;

-- 공개 콘텐츠: anon은 읽기만
grant select on course, course_track, exam_schedule, curriculum_item, course_apply_info, post, about_history, about_history_item, site_section, popup to anon;
-- 제출 테이블: anon은 INSERT만 (읽기·수정 권한 없음 → RLS 이전에 차단)
grant insert on application, inquiry, waitlist to anon;
grant usage, select on all sequences in schema public to anon;

-- 관리자: 모든 테이블 전체 권한 (RLS 정책으로 통제)
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
