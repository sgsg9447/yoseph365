# 어드민 훈련사진 모자이크 편집 — 설계

## 배경
훈련사진을 공개하기 전, 수강생 얼굴·개인정보를 가려야 한다(개인정보 보호). 지금은
[PhotoUploader.tsx](../../../src/app/admin/(dashboard)/photos/PhotoUploader.tsx)에서 파일을 고르면
**즉시** Supabase Storage로 직접 업로드되어, 가릴 기회가 없다. 업로드 전 브라우저에서
원하는 영역을 직접 모자이크 처리하는 편집 단계를 추가한다.

## 스코프
- **수동 영역 지정**: 사진 위에서 드래그로 사각형을 그어 그 영역만 가린다(여러 개).
- **효과: 모자이크(픽셀화)** 1종. 강도는 이미지 크기 비례 기본값 고정(슬라이더 없음).
- **편집기(미니멀)**: `되돌리기(마지막 영역)` · `전체 지우기` · `취소` · `적용`.
- **업로드 전 미리보기**: 파일 선택 시 즉시 올리지 않고 썸네일 목록(staging)에 쌓고,
  사진마다 선택적으로 편집한 뒤 `[업로드]` 버튼으로 한 번에 올린다.

비스코프(이번에 안 함): 얼굴 자동 인식, 블러 효과, 강도 슬라이더, 개별 영역 클릭 삭제,
자유형 브러시, 확대/축소, 업로드 후 재편집.

## 핵심 발견
- 업로드는 이미 **브라우저에서 Supabase Storage로 직접** 이뤄진다
  (`createUploadTarget` → `uploadToTarget`). 편집본 `Blob`을 원본 `File` 대신 올리면 된다.
- 서버 측은 **무변경**: `createUploadTarget`, `addTrainingPhotos`, `trainingPhotoAddSchema` 그대로 재사용.
- `addTrainingPhotos`는 `label`을 파일명(확장자 제거)에서 만든다 → staging 항목이 원본 `File`을 들고 있으면 라벨 유지.
- 아이콘 `Undo`·`X`·`ImageIcon` 이미 존재.
- **원본 얼굴이 서버에 절대 닿지 않는다**(편집본만 업로드) — 개인정보 보호에 가장 안전.

## 설계

### 1. 픽셀화 순수 함수 — `src/lib/image/pixelate.ts`
- `pixelate(data, width, height, rect, blockSize)`: `Uint8ClampedArray`(RGBA)와 사각형을 받아
  사각형 영역을 `blockSize` 단위 블록으로 나누고 각 블록을 블록 평균색으로 채운다(in-place).
- 의존성 없는 순수 배열 연산 → **단위테스트 대상**(알려진 작은 그리드로 평균값 검증).
- 기본 blockSize 계산도 순수 함수로: `defaultBlockSize(naturalW, naturalH)`
  = `max(8, round(max(w,h)/64))` 정도(작은 사진도 충분히 가려지도록 하한 8px).

### 2. 편집기 모달 — `src/components/admin/MosaicEditor.tsx` (client)
- props: `{ file: File; onDone: (blob: Blob) => void; onCancel: () => void }`.
- 로드: `createImageBitmap(file, { imageOrientation: "from-image" })`로 **EXIF 회전 방어**.
  비트맵을 원본 해상도 오프스크린 canvas에 그려 "원본 캔버스"로 보관.
- 표시: 컨테이너에 맞춰 축소한 화면용 canvas. 다시 그릴 때마다 원본을 복사 →
  현재 영역들에 `pixelate` 적용 → 표시.
- 입력: **Pointer 이벤트**(pointerdown/move/up)로 마우스·터치 한 코드로 처리. 드래그로 사각형 추가.
  화면 좌표 → 원본 좌표 매핑. 너무 작은 드래그(예: 한 변 < 6px 화면)는 무시.
- 상태: `regions: Rect[]`(원본 좌표계). `되돌리기`=pop, `전체 지우기`=[].
- `적용`: 원본 해상도 캔버스에 모든 영역 적용 후 `canvas.toBlob` (`image/jpeg`, 0.9) → `onDone(blob)`.

### 3. 업로더 staging 전환 — `PhotoUploader.tsx`
- 상태를 `staged: { id: string; file: File; edited: Blob | null; previewUrl: string }[]`로 변경.
- 파일 선택/드롭 → `validatePhotoFile` 검증 통과분만 staging에 추가(`URL.createObjectURL`로 미리보기).
  **즉시 업로드하지 않음.**
- 썸네일 그리드: 미리보기(편집본 우선) + 원본 파일명 + `[모자이크 편집]` `[제거]` 버튼,
  편집된 항목엔 "모자이크 적용됨" 표시.
- `[모자이크 편집]` → `MosaicEditor`를 해당 `file`로 연다. `onDone(blob)` 시 그 항목의
  `edited`를 교체하고 미리보기 URL 갱신.
- `[N장 업로드]`: 각 항목에 대해 `const up = item.edited ?? item.file` →
  `validatePhotoFile(up)` 재검증(편집본 10MB 초과 방지) → `createUploadTarget(up.type)` →
  `uploadToTarget(target, up)` → `{ key, label: 원본파일명(확장자 제거) }` 수집 → `addTrainingPhotos` →
  성공 시 staging 비우고 `router.refresh()`. 기존 busy/error 처리 유지.
- 컴포넌트 정리: 언마운트·항목 제거 시 `URL.revokeObjectURL`.

## 변경 파일
- `src/lib/image/pixelate.ts` (신규) + `pixelate.test.ts` (신규)
- `src/components/admin/MosaicEditor.tsx` (신규)
- `src/app/admin/(dashboard)/photos/PhotoUploader.tsx` — staging 모델로 리팩터, 편집기 연동
- 서버 액션·스키마·스토리지 라이브러리: **무변경**

## 검증
1. `pixelate()`/`defaultBlockSize()` 단위테스트: 알려진 그리드로 블록 평균·하한 검증 (red→green)
2. `pnpm test` 전체 통과(기존 211 + 신규)
3. `pnpm lint`(변경 파일) 클린, `pnpm build` 통과
4. 로컬 dev: 사진 선택 → 편집기에서 드래그로 영역 지정 → 적용 → 썸네일 모자이크 확인 →
   업로드 → 공개 `/photos`에서 모자이크된 사진 확인. 세로 휴대폰 사진으로 EXIF 회전도 확인.

## 도메인 규칙 점검
회원제·취업률·개강일/잔여석·모집상태·신청분기(A/B/C)·외부링크(고용24/큐넷) — 모두 무관.
어드민 전용 기능이며 공개 화면은 이미 가려진 사진만 게시한다. 위반 없음.
