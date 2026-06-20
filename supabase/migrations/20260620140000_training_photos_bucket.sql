-- 훈련사진 공개 버킷 + RLS. (config.toml 버킷은 db reset 때만 생성되는 함정 회피 → SQL로 명시 생성)
insert into storage.buckets (id, name, public)
values ('training-photos', 'training-photos', true)
on conflict (id) do nothing;

-- 공개 읽기 (공개 버킷이라 public URL은 정책 없이도 열리지만, Storage API 접근 위해 명시)
create policy "training photos public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'training-photos');

-- 관리자(authenticated)만 업로드/삭제
create policy "training photos admin insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'training-photos');

create policy "training photos admin delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'training-photos');
