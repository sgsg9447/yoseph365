-- event_log 테이블 GRANT (생성 마이그레이션에서 누락분 보강).
-- RLS와 별개로 역할에 테이블 권한을 줘야 PostgREST/anon INSERT가 동작한다.
grant insert on event_log to anon;                          -- 공개: 이벤트 기록만
grant select, insert, update, delete on event_log to authenticated;  -- 관리자
grant all on event_log to service_role;                     -- 백엔드
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
