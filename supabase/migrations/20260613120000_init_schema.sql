-- =============================================================
-- 성요셉목수학교 — 초기 스키마
-- 출처: 데이터정의서 v2 · 엔지니어링 설계서 §5(테이블)·§7(RLS)
-- 원칙: 공개는 게시 콘텐츠 읽기 + 폼 쓰기만,
--       개인정보가 든 제출 테이블의 읽기·수정은 관리자(authenticated)만.
-- =============================================================

-- ---------- Enums (데이터정의서 §2) ----------
create type funding_type          as enum ('경기도무료', '국비지원', '자부담');
create type course_category       as enum ('집수리', '건축목공입문', '인테리어필름입문', '기능사');
create type schedule_pattern      as enum ('평일주간', '주말');
create type recruit_status        as enum ('모집예정', '모집중', '마감');
create type application_status    as enum ('신규', '상담중', '등록확인', '보류');
create type inquiry_category      as enum ('국비지원', '과정문의', '기타');
create type inquiry_status        as enum ('답변대기', '답변완료');
create type exam_type             as enum ('건축목공기능사', '건축도장기능사');
create type post_category         as enum ('훈련사진', '수강일지', '수료식');
create type curriculum_place      as enum ('강의실', '실습실');
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

-- ---------- ExamSchedule — 기능사 시험일정 (큐넷, 참고 데이터 §6) ----------
create table exam_schedule (
  id           text primary key,
  exam_type    exam_type not null,
  round        text not null,           -- 제1회 등
  apply_period text,                    -- 실기 원서접수 기간
  exam_date    text,                    -- 실기시험일
  result_date1 text,                    -- 합격발표 1차
  result_date2 text,                    -- 합격발표 2차
  year         integer not null
);

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
  duration_text    text,
  tuition          text,                           -- 없으면 "상담 안내"
  self_pay         text,                           -- 개인별 상이 → "상담 안내" 가능
  seo_keywords     text[] not null default '{}',   -- 과정별 SEO(오가닉 유입)
  recruit_status   recruit_status not null default '모집예정',  -- 운영자 수동
  exam_schedule_id text references exam_schedule(id),           -- 자부담 기능사만
  is_deleted       boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index on course (category) where is_deleted = false;
create trigger course_set_updated_at before update on course
  for each row execute function set_updated_at();

-- ---------- CurriculumItem — 회차 (Course에 내포 §4) ----------
create table curriculum_item (
  id        bigint generated always as identity primary key,
  course_id text not null references course(id) on delete cascade,
  round     integer not null,
  unit      text,                         -- 능력단위
  content   text,                         -- 훈련내용
  hours     text,
  place     curriculum_place,
  unique (course_id, round)
);
create index on curriculum_item (course_id);

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

-- ---------- History — 연혁 (학원소개 콘텐츠 §10) ----------
create table history (
  id    bigint generated always as identity primary key,
  year  integer not null,
  items text[] not null default '{}'
);

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
alter table exam_schedule   enable row level security;
alter table course          enable row level security;
alter table curriculum_item enable row level security;
alter table schedule        enable row level security;
alter table application     enable row level security;
alter table inquiry         enable row level security;
alter table waitlist        enable row level security;
alter table post            enable row level security;
alter table history         enable row level security;
alter table popup           enable row level security;

-- 콘텐츠 테이블: 공개 SELECT(게시된 것만) + 관리자 ALL
create policy "course public read"   on course   for select to anon using (is_deleted = false);
create policy "course admin all"     on course   for all    to authenticated using (true) with check (true);

create policy "curriculum public read" on curriculum_item for select to anon using (true);
create policy "curriculum admin all"   on curriculum_item for all    to authenticated using (true) with check (true);

create policy "exam public read"     on exam_schedule for select to anon using (true);
create policy "exam admin all"       on exam_schedule for all    to authenticated using (true) with check (true);

create policy "post public read"     on post     for select to anon using (is_published = true and is_deleted = false);
create policy "post admin all"       on post     for all    to authenticated using (true) with check (true);

create policy "history public read"  on history  for select to anon using (true);
create policy "history admin all"    on history  for all    to authenticated using (true) with check (true);

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
grant select on course, curriculum_item, exam_schedule, post, history, popup to anon;
-- 제출 테이블: anon은 INSERT만 (읽기·수정 권한 없음 → RLS 이전에 차단)
grant insert on application, inquiry, waitlist to anon;
grant usage, select on all sequences in schema public to anon;

-- 관리자: 모든 테이블 전체 권한 (RLS 정책으로 통제)
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
