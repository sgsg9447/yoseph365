-- 시드/관리 스크립트(service_role 키)가 post에 기록할 수 있도록 GRANT.
-- 기존 init 스키마는 post에 anon(select)·authenticated(all)만 grant했고 service_role은 빠져 있었다.
-- 클라우드는 service_role에 플랫폼 기본 권한이 있어 동작하지만, 로컬·결정성을 위해 명시한다.
grant select, insert, update, delete on post to service_role;
