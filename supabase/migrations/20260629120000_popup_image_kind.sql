-- 팝업: 유형(kind) + 모바일 이미지 컬럼 추가
-- kind='renewal' → 코드 고정 리뉴얼 안내 / kind='image' → 운영자 업로드 이미지
-- 데스크톱 이미지는 기존 image_url, 모바일 전용은 mobile_image_url, 클릭 링크는 기존 link_url.

alter table popup
  add column if not exists kind text not null default 'renewal',
  add column if not exists mobile_image_url text;

alter table popup
  drop constraint if exists popup_kind_check;
alter table popup
  add constraint popup_kind_check check (kind in ('renewal', 'image'));
