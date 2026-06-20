# 훈련사진 관리 (어드민 업로드 + 공개 갤러리 연동) — 설계서

- 날짜: 2026-06-20
- 상태: 확정 (구현 대기)
- 브랜치: `feat/admin-notice-consult-ux`

## 1. 배경 / 문제

- 공개 `/photos`는 현재 `public/photos/training-detail/1~25.JPG` **정적 파일 25장을 하드코딩**해 보여준다. DB와 무관해 운영자가 사진을 바꿀 수 없다.
- 어드민 `/admin/photos`는 화면 껍데기만 있다. 업로드 영역·삭제 버튼이 **동작하지 않는다**. 데이터는 `post`(`category='훈련사진'`)에서 읽도록 설계돼 있으나 실제 글이 없다.
- 이미지 업로드 코드가 **전혀 없다**. Storage 버킷 미설정, `aws-sdk` 미설치 — 현 스택은 사실상 Supabase 단독.

목표: 운영자가 어드민에서 훈련사진을 **올리고 지울 수 있고**, 그 결과가 공개 `/photos`에 그대로 반영된다. 공개 페이지와 어드민이 **하나의 데이터 소스를 공유**한다. 더불어 **나중에 S3로 저장소를 바꿀 때 비용이 작도록** 백엔드를 격리한다.

## 2. 결정 요약

| # | 결정 | 선택 |
|---|------|------|
| D1 | 이미지 저장소(현재) | **Supabase Storage 공개 버킷**. 현 인프라와 일치, 새 계정·의존성 불필요. |
| D2 | 기존 25장 처리 | **버킷으로 이전** — 시드 스크립트로 업로드 + `post` 행 생성, 이후 `public`의 25장 삭제(단일 소스). |
| D3 | 삭제 동작 | **행 + 스토리지 파일 모두 삭제** — `post` 행 소프트삭제 + 버킷 객체 제거(고아 없음). |
| D4 | S3 교체 대비 | **스토리지 백엔드를 `src/lib/storage/` 어댑터 한 곳에 격리.** 앱의 나머지는 "객체 키/공개 URL 문자열"만 다룸. DB엔 **객체 키**를 저장하고 읽을 때 URL로 변환. |

D1은 source-of-truth 문서(`docs/엔지니어링설계서_성요셉목수학교.md`)의 S3 계획과 다르다. D4가 그 S3 계획으로의 복귀를 저비용으로 만든다.

## 3. 스토리지 추상화 — S3 교체 대비 (핵심)

**원칙:** 스토리지 SDK·URL 형식·업로드 메커니즘은 **오직 `src/lib/storage/` 안에만** 존재한다. PhotoUploader·서버액션·갤러리·쿼리·DB는 백엔드를 모른다 — 객체 키와 공개 URL 문자열만 안다.

### 인터페이스

`src/lib/storage/types.ts`
```ts
export type StorageDriver = "supabase" | "s3";
// 업로드 대상: 브라우저가 백엔드로 직접 올리기 위한 정보(드라이버별 형태가 다름).
export type UploadTarget =
  | { driver: "supabase"; bucket: string; key: string }
  | { driver: "s3"; key: string; uploadUrl: string; headers: Record<string, string> }; // 미래
```

`src/lib/storage/server.ts` (서버 전용)
```ts
createUploadTarget(contentType: string): Promise<UploadTarget> // 키 생성 + (필요 시) presign
removeObjects(keys: string[]): Promise<void>
publicUrl(key: string): string                                // 키 → 공개 URL
```

`src/lib/storage/client.ts` (브라우저)
```ts
uploadToTarget(target: UploadTarget, file: File): Promise<void> // target.driver로 분기 실행
```

### 지금 구현 vs 미래

- **지금**: `supabase` 드라이버만 구현. `uploadToTarget`은 `supabase` 케이스만(브라우저 supabase 클라이언트의 blessed 업로드 경로 사용), `default: throw`. presign 불필요 — `createUploadTarget`은 키와 버킷만 반환하고 브라우저가 admin 세션으로 업로드(RLS가 보호).
- **S3로 교체(미래)**: `server.ts`/`client.ts`에 `s3` 케이스 추가(presigned PUT URL 발급 + 브라우저 raw `fetch PUT`), `STORAGE_DRIVER=s3`, S3 env 설정, `next.config` `remotePatterns`에 CloudFront 호스트 추가. **PhotoUploader·actions·gallery·page·queries·DB·마이그레이션은 무변경.**

업로드가 브라우저→스토리지 직접 방식이라 Next 서버 함수 본문 크기 제한(Vercel ~4.5MB)도 비켜간다 — 두 백엔드 모두 동일.

## 4. 데이터 모델 — 기존 스키마 그대로 (DDL 변경 없음)

- **사진 1장 = `post` 1행.**
  - `category = '훈련사진'`
  - `images = [객체 키]` (원소 1개, **공개 URL이 아니라 키**). 예: `"a1b2c3d4.jpg"`. (`post.images` 주석 "S3 객체 키/URL 배열"과 일치.)
  - `title` = 라벨 (기본값 = 업로드한 파일명, 확장자 제외)
  - `is_published = true`, `is_deleted = false`
- 새 컬럼·테이블 없음. 사진 비율은 갤러리가 클라이언트에서 `onLoad`로 측정하므로 width/height 저장 불필요.
- 조회 시 `storage.publicUrl(key)`로 URL 변환해 컴포넌트에 전달 → 컴포넌트는 키의 존재를 모름.
- 정렬: **`created_at desc`(최신 먼저)** — 어드민·공개 동일.

## 5. 저장소 — 버킷 + RLS (신규 마이그레이션)

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
  on storage.objects for insert to authenticated
  with check (bucket_id = 'training-photos');

create policy "training photos admin delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'training-photos');
```

- 객체 키: `${crypto.randomUUID()}.${ext}` (버킷 루트). 키 생성은 `storage/server.ts`가 담당.
- `next.config`에 `images.remotePatterns`로 Supabase 호스트 추가 (어드민이 `next/image` `<Image>` 사용). 구현 시 실제 config 파일 형식 확인.

## 6. 업로드 흐름 (어드민) — 브라우저에서 백엔드로 직접

`src/app/admin/(dashboard)/photos/PhotoUploader.tsx` (신규, 클라이언트 컴포넌트):

1. 드래그&드롭 / 클릭으로 **다중 파일** 선택.
2. **클라이언트 검증**: `image/jpeg`·`image/png`, 각 ≤ 10MB. 위반 시 안내(거부).
3. 파일마다 서버액션 `createUploadTarget(contentType)` 호출 → `UploadTarget`(키 포함) 수신.
4. `uploadToTarget(target, file)`로 백엔드에 직접 업로드(어드민 세션이 Storage RLS 충족).
5. 업로드된 키들을 모아 서버액션 `addTrainingPhotos([{ key, label }])` 호출 → `post` 행 insert.
6. 성공 시 `router.refresh()`로 그리드 갱신. 진행/실패 상태 표시.

서버액션 컨벤션: zod 검증, 반환 `{ ok: true } | { ok: false; error }`, `revalidatePath('/admin/photos')` + `revalidatePath('/photos')`.

비즈니스 로직은 `src/lib/admin/training-photo.ts`에 두고(=`lib/admin/inquiry.ts` 패턴) `actions.ts`는 `"use server"` 얇은 래퍼. PhotoUploader는 `@/lib/storage/client`와 서버액션만 import — supabase storage 특이사항을 직접 알지 않는다.

보안: `post` insert는 RLS상 `authenticated`만 가능 → 비로그인 호출 시 차단. 입력 형태는 zod로 검증.

## 7. 삭제 흐름 (어드민)

서버액션 `deleteTrainingPhoto(id)`:

1. 해당 `post` 행 조회 → `images[0]`이 곧 객체 키(URL 파싱 불필요).
2. `post` 행 소프트삭제(`is_deleted = true`).
3. `storage.removeObjects([key])`로 버킷 객체 제거(best-effort; 실패해도 행 삭제 유지, 로깅).
4. `revalidatePath('/admin/photos')` + `revalidatePath('/photos')`.

카드 X 클릭 → 확인 → 액션 → `router.refresh()`.

## 8. 공개 `/photos` 연동

- `src/app/(public)/photos/page.tsx`(서버): published·미삭제 훈련사진을 조회, 각 키를 `storage.publicUrl(key)`로 변환해 `<TrainingGallery photos={urls} />`로 전달.
- 조회 함수 `getTrainingGalleryPhotos(): Promise<string[]>` 추가 — `category='훈련사진'`, `is_published=true`, `is_deleted=false`, `created_at desc`, `images[0]` → `publicUrl` 평탄화.
- `TrainingGallery.tsx`: 하드코딩 `PHOTOS` 상수 제거 → `photos: string[]` prop 사용. justified-rows 배치·라이트박스·리사이즈 로직은 **변경 없음**(상수 참조만 prop으로 치환).
- **빈 상태 추가**(4종 상태 규칙): 사진 0장이면 대체 문구 + 상담 CTA.

## 9. 기존 25장 이전 (일회성)

`scripts/seed-training-photos.ts` (신규):

- `@supabase/supabase-js` + `SUPABASE_SECRET_KEY`(service role, RLS 우회)로 접속.
- `public/photos/training-detail/1~25.JPG`를 버킷 업로드 + `post` 행 25개 insert(`images=[key]`, `title`=파일명).
- 실행: `pnpm tsx scripts/seed-training-photos.ts`(또는 동등 러너) — 로컬·운영 각 1회. 실행 후 `public/photos/training-detail/` 삭제.

주의: 시드 전에는 DB 훈련사진 0개라 공개 `/photos`가 빈 상태로 보인다(8의 빈 상태가 처리). 배포 시 시드 실행을 잊지 말 것.

## 10. 테스트 전략 (TDD)

red→green→refactor. 단위 테스트(Supabase 클라이언트/스토리지 어댑터 모킹, `inquiry.test.ts`/`admin.test.ts` 방식):

- `lib/storage/server.ts`: `publicUrl(key)` URL 형식, `createUploadTarget`이 키·드라이버를 담은 target 반환.
- `lib/admin/training-photo.ts`:
  - `addTrainingPhotos` — 유효 입력 시 `post` insert 형태 검증, 빈 배열·잘못된 입력 거부.
  - `deleteTrainingPhoto` — 행 조회→소프트삭제→`removeObjects(key)` 호출 검증, 잘못된 id 거부.
- zod 스키마(`forms.ts`의 `trainingPhotoAddSchema`) — 유효/무효(`forms.test.ts`).
- 조회 매핑(`getTrainingPhotos`, `getTrainingGalleryPhotos`) — 키→URL 변환 포함 매핑 검증.
- 제외(통합 영역): 브라우저→Storage 실제 업로드, 시드 스크립트의 파일 I/O.

## 11. 핵심 도메인 규칙 점검 (CLAUDE.md / AGENTS.md)

- 회원제 없음 / 취업률 미표시 / 개강일·잔여석 미표시 / 모집상태 수동 / 신청 유형 분기 / 외부 시스템 링크 / 인터랙션 패턴 / 마감 대기신청 — **본 작업은 콘텐츠(사진) 관리로 위 8개 규칙 어느 것도 건드리지 않음.**
- RLS: 공개는 published·미삭제 `SELECT`만, 쓰기·삭제는 관리자만(버킷·`post` 동일). 개인정보 제출 테이블 아님.
- (운영 참고) 사진에 수강생 식별정보가 있으면 동의는 운영자 책임 — 범위 밖.

## 12. 명시적 비범위 (YAGNI)

- 수동 드래그 정렬, 캡션/앨범 그룹핑, 이미지 리사이즈·변환, `수강일지`·`수료식` 등 다른 카테고리, 페이지네이션, undo UI.
- **S3 드라이버 구현 자체**는 지금 만들지 않는다. 어댑터 경계(인터페이스·키 저장)만 둬서 나중에 드롭인하도록 한다.

## 13. 변경/추가 파일 목록

신규:
- `supabase/migrations/<ts>_training_photos_bucket.sql`
- `src/lib/storage/types.ts`, `src/lib/storage/server.ts`, `src/lib/storage/client.ts` (+ `server.test.ts`)
- `src/app/admin/(dashboard)/photos/PhotoUploader.tsx`
- `src/app/admin/(dashboard)/photos/actions.ts`
- `src/lib/admin/training-photo.ts` (+ `training-photo.test.ts`)
- `scripts/seed-training-photos.ts`

수정:
- `src/app/admin/(dashboard)/photos/page.tsx` (껍데기 → PhotoUploader + 실제 삭제 버튼)
- `src/app/(public)/photos/page.tsx` (DB 조회 + 키→URL 변환 후 prop 전달)
- `src/app/(public)/photos/TrainingGallery.tsx` (하드코딩 제거 → prop, 빈 상태)
- `src/lib/queries/admin.ts` (또는 공개 쿼리 위치): `getTrainingGalleryPhotos`, `getTrainingPhotos`가 키→URL 변환
- `src/lib/validations/forms.ts` (+ `forms.test.ts`): `trainingPhotoAddSchema`
- `next.config.*`: `images.remotePatterns`에 Supabase 호스트
- `.env.example`: `STORAGE_DRIVER`(기본 supabase) + 버킷명 추가. S3 섹션은 미래 드라이버용으로 유지.

삭제(시드 실행 후):
- `public/photos/training-detail/1~25.JPG`
