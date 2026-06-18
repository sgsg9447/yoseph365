-- 범용 이벤트 로그 — 기획 지표(조회·전환 등)를 자체 집계하기 위한 테이블.
-- name으로 이벤트 종류를 구분하고, 과정 관련 이벤트는 course_id, 그 외 속성은 props(jsonb)에 담는다.
create table event_log (
  id         bigint generated always as identity primary key,
  name       text not null,                                   -- 'course_view' 등
  course_id  text references course(id) on delete set null,   -- 과정 관련 이벤트면 과정 id
  props      jsonb not null default '{}',                     -- 범용 속성(어떤 지표든)
  created_at timestamptz not null default now()
);

create index event_log_name_course_idx on event_log (name, course_id);
create index event_log_created_idx on event_log (created_at);

alter table event_log enable row level security;

-- 공개(anon): 이벤트 기록(INSERT)만. 조회·수정·삭제 불가.
create policy "event_log public insert" on event_log for insert to anon with check (true);
-- 관리자(authenticated): 집계 조회 등 전체 권한.
create policy "event_log admin all" on event_log for all to authenticated using (true) with check (true);
