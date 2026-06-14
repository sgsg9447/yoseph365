# 사진 업로드 배관 (Supabase Storage, S3 호환) — 설계

- 날짜: 2026-06-14
- 범위: **업로드 배관만** (스토리지 연결 + presigned 업로드 Server Action + 검증 + 최소 테스트 UI). 어드민·공개 갤러리 연동은 별도 후속 작업.

## 1. 결정 사항 (확정)

| 항목 | 결정 | 이유 |
|---|---|---|
| 저장소 | Supabase Storage (S3 호환) | 이미 Supabase 사용 중, 이 규모에선 비용 차이 무의미, 셋업 최소 |
| 버킷 | 공개(public) 버킷 `images` | 훈련사진은 홍보용 공개 이미지, 읽기용 signed URL 불필요 → 최단순 |
| 업로드 방식 | AWS SDK + **presigned PUT URL** (브라우저 직접 업로드) | 설계서 방침, Vercel Server Action 4.5MB 제한 회피, AWS 이전 시 env만 교체 |
| 저장 값 | DB엔 **객체 key만** (전체 URL 금지) | 저장소 이전 시 데이터 무변경 — 표시할 때 base URL과 조합 |

### AWS 이전 호환
- S3 client의 `endpoint`를 env로 설정. 표시용 URL은 `NEXT_PUBLIC_IMAGE_BASE_URL` + key.
- 나중에 실제 AWS S3 + CloudFront로 옮길 때: 파일 복사 1회 + env 값 교체. **코드 0줄 변경.**

## 2. 환경변수

기존 `.env.local`의 `S3_REGION` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` 재사용. 추가/설정:

```
S3_BUCKET=images
S3_ENDPOINT=http://127.0.0.1:54321/storage/v1/s3
NEXT_PUBLIC_IMAGE_BASE_URL=http://127.0.0.1:54321/storage/v1/object/public/images
```

- 로컬 Supabase는 `config.toml`에서 `[storage.s3_protocol] enabled = true` 확인됨.
- 운영(호스티드 Supabase)에선 같은 이름 값으로 교체.

## 3. 버킷 선언 (코드로 생성)

`supabase/config.toml`에 버킷을 선언해 재현 가능하게 한다:

```toml
[storage.buckets.images]
public = true
file_size_limit = "10MiB"
allowed_mime_types = ["image/jpeg", "image/png", "image/webp"]
```

로컬 반영: `supabase stop && supabase start` (또는 `supabase db reset`). 운영에선 대시보드에서 동일 버킷 1회 생성.

## 4. 모듈 구성 (기존 `src/lib` 컨벤션 준수)

| 파일 | 역할 |
|---|---|
| `src/lib/validations/upload.ts` | zod 스키마: `filename`, `contentType`(jpeg/png/webp 화이트리스트), `size`(≤ 10MB) |
| `src/lib/s3/client.ts` | env 기반 `S3Client` 팩토리 (`endpoint` 설정 가능, `forcePathStyle: true`) |
| `src/lib/s3/keys.ts` | `buildObjectKey(filename)` (uuid 기반, 확장자 보존), `publicImageUrl(key)` (base URL + key) — 순수 함수 |
| `src/lib/actions/upload.ts` | Server Action `getUploadUrl(input)`: zod 검증 → key 생성 → presigned PUT URL 발급 → `{ uploadUrl, key, publicUrl }` 반환 |
| dev 테스트 UI (임시) | 파일 선택 → `getUploadUrl` 호출 → presigned URL로 `fetch(PUT)` → `publicUrl` 미리보기 |

## 5. 데이터 흐름

```
브라우저(파일 선택)
  → Server Action getUploadUrl  [검증 · key 생성 · presigned PUT 발급]
  → 브라우저가 presigned PUT URL로 Storage에 직접 업로드
  → 성공 시 key를 화면에 표시 (후속: post.images[]에 저장)
```

DB/상태에는 전체 URL이 아니라 **key만** 보관한다.

## 6. 검증 / 에러 처리

- 허용 타입(jpeg/png/webp) 외 → 거부, 한국어 메시지
- 10MB 초과 → 거부
- 업로드 실패 → 재시도 안내
- 4종 상태(기본/로딩/빈/에러)는 본 배관 단계의 최소 UI에선 로딩·에러만 의미 있음 — 갤러리 연동 시 전체 적용.

## 7. 보안 (반드시 준수)

- `getUploadUrl` 액션은 **현재 인증이 없다 → 임시·로컬 전용**.
- 어드민(`/admin`) 인증이 구축되면 **반드시 이 액션을 인증 뒤로 게이팅**한다.
- 공개 배포 전까지 dev 테스트 UI는 **네비게이션에 연결하지 않으며**, 공개 라우트로 노출하지 않는다.
- CLAUDE.md RLS 원칙: 쓰기는 관리자만. 본 단계는 그 전제의 임시 배관임을 명시.

## 8. 테스트 (TDD: red → green → refactor)

- `src/lib/validations/upload.test.ts` — 잘못된 mime / 초과 size 거부, 정상 입력 통과
- `src/lib/s3/keys.test.ts` — `buildObjectKey` 형식(uuid+확장자), `publicImageUrl` 조합 검증
- `getUploadUrl` — S3 client(presigner) 모킹 또는 반환 URL 형태 검증

## 9. 사용자(운영/개발자) 작업 항목

1. 버킷 이름 확정: `images` (확정됨)
2. 로컬에 config 버킷 반영: `supabase stop && supabase start`
3. `.env.local`에 §2의 env 추가 (값 제공됨)
4. 패키지 설치: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` (구현자가 실행)

## 10. 범위 밖 (후속 작업)

- `/admin` 인증·어드민 스캐폴딩
- post CRUD + 다중 이미지 업로드 연결
- 공개 `photos` 페이지의 실제 이미지 표시 (현재 placeholder)
- 실제 AWS S3 + CloudFront 이전
