-- 훈련사진 갤러리: leaf 카테고리 + 메인 노출 플래그.
-- gallery_category 는 nullable text(허용값은 앱 zod 에서 검증). is_featured 기본 false.
alter table post
  add column if not exists gallery_category text,
  add column if not exists is_featured boolean not null default false;

-- 메인 노출 사진 최신순 조회 가속(선택).
create index if not exists post_featured_idx
  on post (is_featured, created_at desc)
  where category = '훈련사진' and is_deleted = false;
