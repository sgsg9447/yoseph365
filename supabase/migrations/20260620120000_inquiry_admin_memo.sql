-- 상담문의에 관리자 메모(admin_memo) 컬럼 추가.
-- application.admin_memo와 동일한 용도. RLS는 기존 "inquiry admin update"(authenticated full)로 충분 — 정책 변경 없음.
alter table inquiry add column if not exists admin_memo text;
