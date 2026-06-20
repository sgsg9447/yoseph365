# 훈련사진 관리 (어드민 업로드 + 공개 갤러리 연동) — 설계서

- 날짜: 2026-06-20
- 상태: 확정 (구현 대기)
- 브랜치: `feat/admin-notice-consult-ux`

## 1. 배경 / 문제

- 공개 `/photos`는 현재 `public/photos/training-detail/1~25.JPG` **정적 파일 25장을 하드코딩**해 보여준다. DB와 무관해 운영자가 사진을 바꿀 수 없다.
- 어드민 `/admin/photos`는 화면 껍데기만 있다. 업로드 영역·삭제 버튼이 **동작하지 않는다**. 데이터는 `post`(`category='훈련사진'`)에서 읽도록 설계돼 있으나 실제 글이 없다.
- 이미지 업로드 코드가 **전혀 없다**. Storage 버킷 미설정, `aws-sdk` 미설치 — 현 스택은 사실상 Supabase 단독.

목표: 운영자가 어드민에서 훈련사진을 **올리고 지울 수 있고**, 그 결과가 공개 `/photos`에 그대로 반영된다. 공개 페이지와 어드민이 **하나의 데이터 소스를 공유**한다.

## 2. 결정 요약

| # | 결정 | 선택 |
|---|------|------|
| D1 | 이미지 저장소 | **Supabase Storage 공개 버킷** (`docs/엔지니어링설계서`의 S3 계획 대신). 현재 인프라와 일치, 새 계정·의존성 불필요. |
| D2 | 기존 25장 처리 | **버킷으로 이전** — 시드 스크립트로 버킷 업로드 + `post` 행 생성, 이후 `public`의 25장 삭제(단일 소스). |
| D3 | 삭제 동작 | **행 + 스토리지 파일 모두 삭제** — `post` 행 소프트삭제 + 버킷 객체 제거(고아 없음). |

D1은 source-of-truth 문서(`docs/엔지니어링설계서_성요셉목수학교.md`)의 S3 계획과 다르다. 본 문서가 그 변경을 기록한다.

## 3. 데이터 모델 — 기존 스키마 그대로 (DDL 변경 없음)

- **사진 1장 = `post` 1행.**
  - `category = '훈련사진'`
  - `images = [공개URL]` (원소 1개)
  - `title` = 라벨 (기본값 = 업로드한 파일명, 확장자 제외)
  - `is_published = true`, `is_deleted = false`
- 새 컬럼·테이블 없음. 사진 비율은 갤러리가 클라이언트에서 `onLoad`로 측정하므로 width/height 저장 불필요.
- 정렬: **`created_at desc`(최신 먼저)** — 어드민·공개 동일.

## 4. 저장소 — 버킷 + RLS (신규 마이그레이션)

새 마이그레이션 `supabase/migrations/<ts>_training_photos_bucket.sql`:

```sql
-- 공개 버킷 생성 (config.toml 버킷은 db reset 때만 생성되는 함정 회피 → SQL로 명시 생성)
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
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'training-photos');

create policy "training photos admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'training-photos');
```

- 객체 키: `${crypto.randomUUID()}.${ext}` (버킷 루트). 공개 URL: `supabase.storage.from('training-photos').getPublicUrl(key)`.
- `next.config`에 `images.remotePatterns`로 Supabase 호스트 추가 (어드민이 `next/image` `<Image>` 사용). 구현 시 실제 config 파일 형식 확인.

## 5. 업로드 흐름 (어드민) — 브라우저에서 버킷에 직접

`src/app/admin/(dashboard)/photos/PhotoUploader.tsx` (신규, 클라이언트 컴포넌트):

1. 드래그&드롭 / 클릭으로 **다중 파일** 선택.
2. **클라이언트 검증**: `image/jpeg`·`image/png`, 각 ≤ 10MB. 위반 시 안내 메시지(거부).
3. 브라우저 Supabase 클라이언트(`@/lib/supabase/client`)로 `storage.from('training-photos').upload(key, file)`. 어드민 세션이 Storage RLS(`authenticated insert`)를 충족.
4. 업로드된 각 파일의 공개 URL을 모아 서버액션 `addTrainingPhotos([{ url, label }])` 호출 → `post` 행 insert.
5. 성공 시 `router.refresh()`로 서버 컴포넌트 그리드 갱신. 진행/실패 상태 표시.

서버액션은 기존 컨벤션을 따른다: zod 검증, 반환 `{ ok: true } | { ok: false; error }`, `revalidatePath('/admin/photos')` + `revalidatePath('/photos')`.

비즈니스 로직은 테스트 가능하도록 `src/lib/admin/training-photo.ts`에 두고(=`lib/admin/inquiry.ts` 패턴), `src/app/admin/(dashboard)/photos/actions.ts`는 `"use server"` 얇은 래퍼로 둔다.

보안: `post` insert는 RLS상 `authenticated`만 가능 → 서버액션이 비로그인 호출돼도 insert가 차단된다. 입력 형태는 zod로 검증.

## 6. 삭제 흐름 (어드민)

서버액션 `deleteTrainingPhoto(id)`:

1. 해당 `post` 행 조회 → `images[0]` 공개 URL에서 객체 키 추출(`/object/public/training-photos/` 뒤).
2. `post` 행 소프트삭제(`is_deleted = true`).
3. `storage.from('training-photos').remove([key])`로 버킷 객체 제거(best-effort; 실패해도 행 삭제는 유지, 로깅).
4. `revalidatePath('/admin/photos')` + `revalidatePath('/photos')`.

카드 X 클릭 → 확인 → 액션 → `router.refresh()`.

## 7. 공개 `/photos` 연동

- `src/app/(public)/photos/page.tsx`(서버): published·미삭제 훈련사진 URL 목록을 조회해 `<TrainingGallery photos={urls} />`로 전달.
- 조회 함수 `getTrainingGalleryPhotos(): Promise<string[]>` 추가 — 공개 anon 클라이언트로 `category='훈련사진'`, `is_published=true`, `is_deleted=false`, `created_at desc`, `images[0]` 평탄화. (다른 공개 페이지 쿼리 위치/클라이언트 컨벤션을 구현 시 따른다.)
- `TrainingGallery.tsx`: 하드코딩 `PHOTOS` 상수 제거 → `photos: string[]` prop 사용. justified-rows 배치·라이트박스·리사이즈 로직은 **변경 없음**(상수 참조만 prop으로 치환).
- **빈 상태 추가**(CLAUDE.md 4종 상태 규칙): 사진 0장이면 대체 문구 + 상담 CTA. (현재 빈 상태 없음.)

## 8. 기존 25장 이전 (일회성)

`scripts/seed-training-photos.ts` (신규):

- `@supabase/supabase-js` + `SUPABASE_SECRET_KEY`(service role, RLS 우회)로 접속.
- `public/photos/training-detail/1~25.JPG`를 순서대로 버킷 업로드 + `post` 행 25개 insert(`title`=파일명).
- 실행: `pnpm tsx scripts/seed-training-photos.ts` — 로컬·운영 각 1회.
- 실행 후 `public/photos/training-detail/` 삭제(저장소 정리, 단일 소스 확보).

주의: 시드 실행 전에는 DB에 훈련사진이 0개라 공개 `/photos`가 빈 상태로 보인다(7의 빈 상태가 처리). 배포 시 시드 실행을 잊지 말 것.

## 9. 테스트 전략 (TDD)

red→green→refactor. 단위 테스트(Supabase 클라이언트 모킹, `inquiry.test.ts`/`admin.test.ts` 방식):

- `lib/admin/training-photo.ts`:
  - `addTrainingPhotos` — 유효 입력 시 `post` insert 호출 형태 검증, 빈 배열·잘못된 URL 거부.
  - `deleteTrainingPhoto` — 행 조회→소프트삭제→객체 키 추출/remove 호출 검증, 잘못된 id 거부.
- zod 스키마(`forms.ts`의 `trainingPhotoAddSchema`) — 유효/무효 케이스(`forms.test.ts`).
- 조회 매핑(`getTrainingPhotos`, `getTrainingGalleryPhotos`) — 행→뷰 매핑 검증.
- 제외(통합 영역): 브라우저→Storage 실제 업로드, 시드 스크립트의 파일 I/O.

## 10. 핵심 도메인 규칙 점검 (CLAUDE.md / AGENTS.md)

- 회원제 없음 / 취업률 미표시 / 개강일·잔여석 미표시 / 모집상태 수동 / 신청 유형 분기 / 외부 시스템 링크 / 인터랙션 패턴 / 마감 대기신청 — **본 작업은 콘텐츠(사진) 관리로 위 8개 규칙 어느 것도 건드리지 않음.**
- RLS: 공개는 published·미삭제 `SELECT`만, 쓰기·삭제는 관리자만(버킷·`post` 동일). 개인정보 제출 테이블 아님.
- (운영 참고) 사진에 수강생 얼굴 등 식별정보가 있으면 동의는 운영자 책임 — 본 작업 범위 밖.

## 11. 명시적 비범위 (YAGNI)

- 수동 드래그 정렬, 캡션/앨범 그룹핑, 이미지 리사이즈·변환(Pro 기능), `수강일지`·`수료식` 등 다른 카테고리, 페이지네이션, 되돌리기(undo) UI. 모두 이번 범위 밖.

## 12. 변경/추가 파일 목록

신규:
- `supabase/migrations/<ts>_training_photos_bucket.sql`
- `src/app/admin/(dashboard)/photos/PhotoUploader.tsx`
- `src/app/admin/(dashboard)/photos/actions.ts`
- `src/lib/admin/training-photo.ts` (+ `training-photo.test.ts`)
- `scripts/seed-training-photos.ts`

수정:
- `src/app/admin/(dashboard)/photos/page.tsx` (껍데기 → PhotoUploader + 실제 삭제 버튼)
- `src/app/(public)/photos/page.tsx` (DB 조회 후 prop 전달)
- `src/app/(public)/photos/TrainingGallery.tsx` (하드코딩 제거 → prop, 빈 상태)
- `src/lib/queries/admin.ts` (또는 공개 쿼리 위치)에 `getTrainingGalleryPhotos`
- `src/lib/validations/forms.ts` (+ `forms.test.ts`): `trainingPhotoAddSchema`
- `next.config.*`: `images.remotePatterns`에 Supabase 호스트
- `.env.example`: S3 섹션 주석 → Supabase 버킷 안내로 교체

삭제(시드 실행 후):
- `public/photos/training-detail/1~25.JPG`
