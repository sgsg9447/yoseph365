-- 팝업: 모바일 숨김 옵션 컬럼 + 싱글턴 리뉴얼 팝업 시드
-- 운영자가 어드민에서 노출 on/off, 모바일 숨김을 토글한다(내용은 코드 고정).

alter table popup
  add column if not exists hide_on_mobile boolean not null default false;

-- 시드: 토글 대상 행이 없으면 1개 생성(꺼진 상태로 — 운영자가 켤 때까지 미노출)
insert into popup (title, is_active, hide_on_mobile)
select '리뉴얼 안내 팝업', false, false
where not exists (select 1 from popup);
