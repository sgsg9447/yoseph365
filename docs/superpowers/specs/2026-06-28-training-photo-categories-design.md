# 훈련사진 카테고리 탭 + 메인 노출 선택 — 설계

작성일: 2026-06-28

## 배경 / 문제

훈련사진(`/photos`)이 현재 카테고리 구분 없이 한 덩어리 콜라주로만 보인다.
운영자가 새 사진 134장(집수리·인테리어목공·인테리어필름·기능사)을 과정별로 보여주고 싶다.
또한 홈(메인)의 "훈련 현장" 6장은 지금 **정적 파일로 하드코딩**되어 있어 운영자가 바꿀 수 없다.

해결 목표:
1. 공개 `/photos`에 **과정별 탭**으로 사진 탐색
2. 기존 DB 훈련사진 전부 교체 → 새 134장 업로드(프로덕션)
3. 어드민 업로드 시 **카테고리 선택** + **메인 노출 선택**
4. 메인은 **최대 6장** 정책 유지(단, 이제 운영자가 선택)
5. 운영자·사용자 모두 UX가 편하게

## 도메인 규칙 점검

- 회원제 없음 / 취업률·개강일·잔여석 미표시 — 본 작업과 무관, 위반 없음.
- RLS: 훈련사진은 공개 게시 콘텐츠(post). 공개 SELECT 허용 대상이며 개인정보 없음 — 정책 변경 없음.
- 업로드/삭제/플래그 변경은 authenticated(관리자)만 — 기존 정책 유지.

## 카테고리 모델

leaf 카테고리(저장 단위) 5종과, 사용자 화면 상단 탭(그룹) 매핑:

| leaf (`gallery_category`) | 상단 탭 | zip 폴더 |
| --- | --- | --- |
| `집수리` | 집수리과정 | `1. 집수리` (34) |
| `인테리어목공` | 인테리어목공과정 | `2. 목공` (23) |
| `인테리어필름` | 인테리어필름과정 | `3. 필름` (27) |
| `목공기능사` | 기능사과정 | `4. 기능사/목공기능사` |
| `도장기능사` | 기능사과정 | `4. 기능사/도장기능사` |

(기능사 합계 50장)

상단 탭 순서: **전체 → 집수리과정 → 인테리어목공과정 → 인테리어필름과정 → 기능사과정**.
`기능사과정` 탭에서만 하위 칩(전체 / 목공기능사 / 도장기능사)을 노출.
`전체` 탭은 모든 카테고리를 최신순으로 한데 표시(하위 필터 없음). 기본 선택 탭 = `전체`.

신규 `src/lib/gallery/categories.ts`에 단일 소스로 정의(공개·어드민 공유):
- leaf 키 목록, leaf→상단탭 매핑, 표시 라벨, 정렬 순서
- 허용값 검증에 쓸 상수(zod에서 재사용)
- 순수 함수 `groupPhotosByTab(photos)` — leaf 배열을 상단 탭 그룹으로 묶음

## 데이터 모델 (마이그레이션)

새 마이그레이션 `supabase/migrations/<ts>_post_gallery_category_featured.sql`:

```sql
alter table post
  add column gallery_category text,        -- 집수리|인테리어목공|인테리어필름|목공기능사|도장기능사 (nullable)
  add column is_featured boolean not null default false;  -- 메인 노출
```

- `gallery_category`는 nullable text. 허용값 검증은 앱(zod). enum/CHECK 미사용 — 마이그레이션 경량·가역.
- `is_featured` 기본 false.
- `src/lib/supabase/database.types.ts`의 `post` Row/Insert/Update에 두 필드 반영.

## 공개 `/photos` — 탭 갤러리

- `getTrainingGalleryPhotos()`(`src/lib/queries/photos.ts`) 반환을 `string[]` → `{ category, url }[]`로 변경. 게시·미삭제, 최신순.
- `TrainingGallery`(client)에 상단 탭 + 기능사 하위 칩 상태 추가. 선택된 탭/하위에 맞춰 사진 필터.
  - 레이아웃(justified rows)·라이트박스는 기존 로직 재사용. 탭 전환 시 해당 사진 집합으로 다시 배치.
- 탭별 빈 상태: "아직 등록된 사진이 없습니다" + 상담 CTA(전화 CTA 유지).
- 전체가 0장이면 기존 `PhotosEmptyCta` 유지.
- 탭은 모바일 가로 스크롤 칩. 40~50대 사용자 기준 큼직한 터치 타깃.

## 메인(홈) "6장" — DB 연동

현재 `SocialProof`의 6장은 `/public/photos/training/*.jpg` 하드코딩. 이를 DB 기반으로 전환:

- 신규 `getFeaturedTrainingPhotos()`(`photos.ts`): `is_featured=true` 게시·미삭제, **최신순 최대 6장** URL 반환.
- **폴백**: featured가 0장이면 최신 훈련사진 6장 자동 노출(홈이 비지 않게).
- `SocialProof`는 `photos: string[]` prop을 받는 형태로 변경(서버 컴포넌트 유지). 홈 `page.tsx`에서 조회 후 주입.
- 사진별 캡션 제거(파일명 기반이라 부적절) → 공개 갤러리와 동일한 캡션 없는 4/3 그리드. "훈련 사진 전체보기" 버튼·인증(awards) 패널은 그대로.
- 조회 실패 시 빈 배열로 폴백(홈 전체가 죽지 않게) — 기존 홈 패턴과 동일.

## 어드민 `/admin/photos`

업로드:
- 업로드 영역 위에 **카테고리 선택(필수)** 드롭다운 5종:
  집수리과정 / 인테리어목공과정 / 인테리어필름과정 / 기능사 · 목공기능사 / 기능사 · 도장기능사.
- 한 번의 업로드 = 한 카테고리(배치 단위). 카테고리 미선택 시 업로드 버튼 비활성.
- **클라이언트 자동 축소**: 업로드 전 canvas로 긴 변 ~1600px, JPEG ~0.8로 리사이즈 후 전송. 운영자가 원본을 올려도 가벼워짐.
- `addTrainingPhotos(category, photos)`로 시그니처 변경 → insert 시 `gallery_category` 채움(`is_featured=false`).

목록/관리:
- 상단 **카테고리 필터 칩**(전체 + leaf 5종)으로 134장 관리.
- 카드에 **카테고리 라벨 뱃지** + **"메인 노출" 토글**. 메인 지정 카드에 메인 뱃지.
- 상단에 `메인 N/6` 카운터.
- 신규 서버 액션 `toggleFeatured(id, on)`:
  - 켜기 요청 시 현재 featured 수가 6이면 거부 → "메인 사진은 최대 6장까지 선택할 수 있습니다. 다른 사진을 먼저 해제해 주세요."
  - 성공 시 `/admin/photos`·`/`(홈)·`/photos` revalidate.
- `getTrainingPhotos()`(`admin.ts`) 반환에 `category`, `isFeatured` 추가. featured 수도 함께 제공.

## 검증(zod)

`src/lib/validations/forms.ts`:
- `trainingPhotoAddSchema`에 `galleryCategory`(허용 leaf 5종 enum) 추가. photos 배열은 기존대로.
- 신규 `featuredToggleSchema`: `{ id: positive int, on: boolean }`.
- 허용 카테고리 값은 `categories.ts` 상수에서 가져와 단일 소스 유지.

## 사진 교체 (1회성 · 프로덕션)

1. **추출**: zip(`~/Downloads/훈련사진_요셉학원.zip`)을 cp949 파일명 디코딩하여 스테이징 폴더로 풀고 leaf별로 정리.
2. **교체 스크립트**(`scripts/`):
   - 기존 `post(category='훈련사진')` 행 + `training-photos` 버킷 객체 전부 삭제(클린 리셋).
   - 각 사진: `sips`로 축소 → 새 uuid 키로 업로드 → `post` insert(`category='훈련사진'`, `gallery_category=<leaf>`, `is_featured=false`).
   - 서비스 롤 키 사용(`SUPABASE_SECRET_KEY`), 진행 로그.
3. **순서**: 코드/UI 로컬 검증 → 사용자 승인 → 프로덕션에서 교체 스크립트 실행.
   - 파괴적 작업이므로 실행 전 대상 URL(프로덕션)·삭제 건수 출력 후 진행.

## 영향 받는 파일

신규:
- `supabase/migrations/<ts>_post_gallery_category_featured.sql`
- `src/lib/gallery/categories.ts` (+ `.test.ts`)
- 어드민 `FeaturedToggle` 컴포넌트, 업로드 카테고리 select(기존 `PhotoUploader` 확장)
- 교체 스크립트 + 추출 스텝(`scripts/`)

변경:
- `src/lib/supabase/database.types.ts`
- `src/lib/validations/forms.ts` (+ 테스트)
- `src/lib/queries/photos.ts` (공개 카테고리 반환 + featured 조회)
- `src/lib/queries/admin.ts` (category·isFeatured·count)
- `src/app/(public)/photos/page.tsx`, `TrainingGallery.tsx`
- `src/components/sections/SocialProof.tsx`, `src/app/(public)/page.tsx`
- `src/app/admin/(dashboard)/photos/page.tsx`, `PhotoUploader.tsx`, `actions.ts`

## 테스트 (TDD)

- `categories.ts`: leaf→상단탭 매핑, `groupPhotosByTab` 순수 함수 단위 테스트(red→green).
- `forms.ts`: 업로드 스키마(카테고리 필수·허용값), `featuredToggleSchema` 테스트.
- 6장 cap 검증 로직 테스트(액션의 순수 검증 부분 분리 또는 카운트 가드 함수).
- 빌드 통과 + 로컬 수동 검증: 탭 전환, 기능사 하위 필터, 어드민 카테고리/메인 토글, 메인 6장 반영.

## 비목표 (YAGNI)

- 사진별 캡션 편집 UI, 드래그 정렬, 카테고리 동적 추가/관리.
- CloudFront 변환·썸네일 파이프라인(축소 업로드로 충분).
- 메인 노출 사진의 수동 순서 지정(최신순 고정).
