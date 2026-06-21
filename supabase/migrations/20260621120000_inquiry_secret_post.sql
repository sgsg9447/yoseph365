-- =============================================================
-- 상담문의 비밀글 + 공개 게시판 노출
-- 설계: docs/superpowers/specs/2026-06-21-inquiry-secret-post-design.md
-- 원칙: inquiry 테이블은 잠금 유지(연락처·해시 비노출).
--       공개 접근은 SECURITY DEFINER 함수로만, 안전 컬럼만 반환.
-- =============================================================

create extension if not exists pgcrypto;

alter table inquiry
  add column if not exists is_public_post boolean not null default false,  -- 게시판 공개 글
  add column if not exists is_secret      boolean not null default false,  -- 비밀글 여부
  add column if not exists is_published   boolean not null default true,   -- 어드민 숨김 토글
  add column if not exists password_hash  text;                            -- bcrypt(비밀글만)

-- ---------- 작성 ----------
create or replace function submit_public_inquiry(
  p_name text, p_phone text, p_category inquiry_category,
  p_course_id text, p_title text, p_content text,
  p_is_secret boolean, p_password text
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
begin
  if coalesce(p_is_secret, false) and (p_password is null or p_password !~ '^[0-9]{4}$') then
    raise exception 'invalid_password';
  end if;
  insert into inquiry (
    name, phone, category, course_id, title, content,
    is_public_post, is_secret, is_published, password_hash, privacy_agreed
  ) values (
    p_name, p_phone, p_category, nullif(p_course_id, ''), p_title, p_content,
    true, coalesce(p_is_secret, false), true,
    case when coalesce(p_is_secret, false) then crypt(p_password, gen_salt('bf')) else null end,
    true
  )
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------- 목록 (안전 컬럼만) ----------
create or replace function list_public_inquiries()
returns table (
  id bigint, title text, category inquiry_category,
  status inquiry_status, is_secret boolean,
  author_masked text, created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select i.id, i.title, i.category, i.status, i.is_secret,
         left(i.name, 1) || repeat('*', greatest(char_length(i.name) - 1, 0)),
         i.created_at
  from inquiry i
  where i.is_public_post = true and i.is_published = true
  order by i.created_at desc;
$$;

-- ---------- 공개글 상세 (비밀글이면 본문·답변 null) ----------
create or replace function get_public_inquiry(p_id bigint)
returns table (
  id bigint, title text, category inquiry_category, status inquiry_status,
  is_secret boolean, author_masked text, content text, answer text, created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select i.id, i.title, i.category, i.status, i.is_secret,
         left(i.name, 1) || repeat('*', greatest(char_length(i.name) - 1, 0)),
         case when i.is_secret then null else i.content end,
         case when i.is_secret then null else i.answer end,
         i.created_at
  from inquiry i
  where i.id = p_id and i.is_public_post = true and i.is_published = true;
$$;

-- ---------- 비밀글 검증(PIN 일치 시에만 본문·답변) ----------
create or replace function verify_secret_inquiry(p_id bigint, p_password text)
returns table (
  id bigint, title text, category inquiry_category, status inquiry_status,
  author_masked text, content text, answer text, created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select i.id, i.title, i.category, i.status,
         left(i.name, 1) || repeat('*', greatest(char_length(i.name) - 1, 0)),
         i.content, i.answer, i.created_at
  from inquiry i
  where i.id = p_id
    and i.is_public_post = true and i.is_published = true
    and i.is_secret = true and i.password_hash is not null
    and i.password_hash = crypt(p_password, i.password_hash);
$$;

-- ---------- 실행 권한(anon·authenticated) ----------
grant execute on function submit_public_inquiry(text, text, inquiry_category, text, text, text, boolean, text) to anon, authenticated;
grant execute on function list_public_inquiries() to anon, authenticated;
grant execute on function get_public_inquiry(bigint) to anon, authenticated;
grant execute on function verify_secret_inquiry(bigint, text) to anon, authenticated;
