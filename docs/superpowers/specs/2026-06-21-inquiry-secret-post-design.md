# 상담문의 비밀글(비밀번호 잠금) — 설계서

작성일: 2026-06-21
상태: 승인됨 (구현 계획 대기)

## 1. 배경 · 목적

상담문의 게시판에 글을 남길 때 **비밀글**로 표시할 수 있고, 비밀글은
**작성자가 정한 비밀번호(4자리 숫자 PIN)** 를 입력해야 본문·답변을 볼 수 있게 한다.

### 현재 상태(구현 전 사실 확인)
- 공개 상담문의 게시판(`/inquiry`, `/inquiry/[id]`)은 **DB가 아니라 정적 목업
  데이터**(`src/lib/data/inquiries.ts`, `INQUIRY_POSTS`)로 렌더된다.
- 실제 제출 문의(`inquiry` 테이블)는 **이름·연락처(개인정보)** 를 담고 있어
  RLS상 **어드민(authenticated)만 SELECT**, anon은 INSERT만 가능하다.
- 작성 폼(바텀시트 `ConsultSheet`)에는 제목·비밀글 입력란이 없고,
  "무료 상담 신청"과 "문의 남기기"가 **같은 폼·같은 `inquiry` 테이블**을 쓴다.
  현재 mode("consult"/"inquiry")는 라벨만 바꾼다.

### 이 기능이 요구하는 변화
비밀글이 의미를 가지려면 **실제 제출 문의가 게시판에 떠야 한다.**
이는 도메인 규칙("개인정보 든 제출 테이블은 공개 SELECT 절대 금지")을 건드린다.
→ 본 설계는 **연락처를 절대 외부로 내보내지 않는 방식**으로 이를 해결한다.

## 2. 핵심 결정 (확정)

| 항목 | 결정 |
| --- | --- |
| 게시 방식 | **제출 즉시 자동 게시.** 비밀글은 잠금. 어드민은 숨김/삭제 가능 |
| 비밀글 목록 표시 | **제목은 노출 + `Lock` 아이콘 뱃지.** 본문·작성자·답변은 PIN 후 공개 |
| 공개 대상 | **"문의 남기기"로 쓴 글(`is_public_post=true`)만** 게시판 노출. "무료 상담 신청" 리드는 비공개 유지 |
| 비밀번호 | **4자리 숫자 PIN.** pgcrypto bcrypt 해시 저장, 검증은 서버에서만 |
| 자물쇠 표시 | 이모지(🔒) 금지 → **`Lock` SVG 아이콘 컴포넌트**(기존 아이콘 세트에 추가) |
| DB 적용 | 마이그레이션 파일 작성 + **운영 Supabase에도 동일 적용**(적용 직전 확인) |

## 3. 데이터 모델

### 3.1 `inquiry` 테이블 컬럼 추가 (마이그레이션)
```sql
alter table inquiry
  add column is_public_post boolean not null default false,  -- 게시판 공개 글 여부
  add column is_secret      boolean not null default false,  -- 비밀글 여부
  add column password_hash  text;                            -- bcrypt 해시(비밀글일 때만)
-- title 컬럼은 이미 존재 → 게시판 글 제목으로 사용
```
- `is_public_post=false` (기본): 기존 상담신청 리드 — 게시판 비노출(현행 유지).
- `is_public_post=true`: "문의 남기기"로 작성된 공개 게시판 글.
- `is_secret=true`면 `password_hash`는 NOT NULL이어야 한다(작성 함수에서 보장).

### 3.2 pgcrypto
```sql
create extension if not exists pgcrypto;
```

## 4. 보안 — 공개 접근은 SECURITY DEFINER 함수로만

`inquiry` 테이블 자체의 RLS/GRANT는 **변경하지 않는다**(anon SELECT 계속 차단).
공개 사이트는 아래 함수들만 호출하며, 함수는 **연락처·password_hash를 절대
반환하지 않는다.** 함수 소유자는 postgres, anon에 `EXECUTE` 부여.

### 4.1 작성 — `submit_public_inquiry`
```text
submit_public_inquiry(
  p_name text, p_phone text, p_category inquiry_category,
  p_course_id text, p_title text, p_content text,
  p_is_secret boolean, p_password text
) returns bigint   -- 생성된 inquiry id
```
- `is_public_post=true`로 INSERT.
- 비밀글이면 `password_hash = crypt(p_password, gen_salt('bf'))`. 아니면 null.
- PIN 해싱이 DB 안에서 일어나므로 평문 PIN은 저장/노출되지 않는다.

### 4.2 목록 — `list_public_inquiries`
```text
list_public_inquiries() returns table(
  id bigint, title text, category inquiry_category,
  status inquiry_status, is_secret boolean,
  author_masked text, created_at timestamptz
)
```
- `is_public_post = true`인 행만, 최신순.
- `author_masked`: 이름 마스킹(예: 홍길동 → 홍\*\*, 김수 → 김\*).
- **연락처·본문 미포함.**

### 4.3 공개글 상세 — `get_public_inquiry`
```text
get_public_inquiry(p_id bigint) returns table(
  id, title, category, status, is_secret,
  author_masked, content, answer, created_at
)
```
- `is_public_post=true`인 행만 반환. `is_secret=false`면 `content`·`answer`
  포함.
- 비밀글이면 **`content`·`answer`는 null**, 나머지 메타(`title`·`author_masked`
  ·`status`·`is_secret`·`created_at`)는 정상 반환 → 잠금 화면에 제목·작성자를
  표시할 수 있다.

### 4.4 비밀글 검증 — `verify_secret_inquiry`
```text
verify_secret_inquiry(p_id bigint, p_password text) returns table(
  id, title, category, status, author_masked,
  content, answer, created_at
)
```
- `is_public_post AND is_secret AND crypt(p_password, password_hash) = password_hash`
  일 때만 본문·답변 반환. 불일치/없음이면 빈 결과.
- 타이밍/무차별 대입은 4자리 PIN 특성상 완전 차단은 어려우나, 본 범위에서는
  서버 검증·해시 저장으로 충분(레이트리밋은 비범위, 추후 과제로 명시).

## 5. 검증 (zod)

`src/lib/validations/forms.ts`에 추가:
```text
inquiryPostSchema = {
  name: 1..50 필수
  phone: 한국 휴대전화 형식(기존 phone 규칙)
  category: '국비지원' | '과정문의' | '기타'
  courseId: 선택(≤80)
  title: 1..200 필수
  content: 1..1000 필수
  email: 선택(이메일 형식)
  isSecret: boolean (기본 false)
  password: isSecret=true면 정확히 숫자 4자리 필수, 아니면 빈 값
}   // superRefine으로 isSecret ↔ password 상호 규칙

verifySecretSchema = {
  id: 양의 정수
  password: 숫자 4자리
}
```

## 6. 서버 액션 (`src/lib/actions/submit.ts` 등)

- `submitInquiryPost(input)` — `inquiryPostSchema` 검증 후
  `rpc('submit_public_inquiry', ...)` 호출. 성공/실패 결과 반환.
- `verifyInquiryPassword(input)` — `verifySecretSchema` 검증 후
  `rpc('verify_secret_inquiry', ...)` 호출. `{ ok, post }` 또는
  `{ ok:false, error }` 반환.
- 기존 `submitConsult`는 그대로(상담신청 = `is_public_post=false`).
- 공개 클라이언트(`createPublicClient`, anon 키)로 RPC 호출.

## 7. 화면 · 컴포넌트

### 7.1 작성 폼 (바텀시트 유지 — 도메인 규칙 #7)
- "문의 남기기"(mode="inquiry") → 새 컴포넌트 `InquiryPostForm`:
  제목 · 구분(select) · 본문 · 이름 · 연락처 · 이메일(선택) +
  **[ ] 비밀글** 체크박스 → 체크 시 **4자리 숫자 PIN** 입력란 노출.
- "무료 상담 신청"(mode="consult") → 기존 `ConsultForm` 그대로.
- `ConsultSheet`는 mode에 따라 두 폼을 분기.

### 7.2 목록 `/inquiry`
- 목업 → `list_public_inquiries` RPC로 교체.
- 비밀글 행: 제목 옆 `Lock` 아이콘 뱃지.
- 상태 4종: 기본 / 로딩(스켈레톤) / 빈(대체문구+상담CTA) / 에러(재시도, 전화CTA).

### 7.3 상세 `/inquiry/[id]`
- `get_public_inquiry`로 조회.
- 공개글: 현재처럼 본문·답변 표시.
- 비밀글: **잠금 화면 + PIN 모달** → `verifyInquiryPassword` 일치 시
  본문·답변 **인라인 공개**. 불일치 시 오류 메시지.

### 7.4 아이콘
- `src/components/icons/index.tsx`에 `Lock` 추가 — 기존 Lucide 스타일
  (`({ size, strokeWidth, className })`, `stroke="currentColor"`, aria-hidden).

### 7.5 어드민
- 어드민은 전체 권한이라 본문 그대로 조회(변경 없음).
- 상담문의 목록/상세에 **공개글 여부·`Lock`(비밀글) 표시**만 추가.
- 어드민은 PIN 평문을 알 필요 없음(본문 직접 열람).

## 8. 테스트 (TDD: red → green → refactor)

- **zod 스키마**: `inquiryPostSchema` — 비밀글이면 PIN(숫자 4자리) 필수,
  비밀글 아니면 PIN 불필요 / 제목·본문 필수 / 잘못된 PIN(3자리·문자) 거부.
  `verifySecretSchema` — 숫자 4자리만 통과.
- **마스킹 헬퍼**: 순수 함수 `maskAuthor(name)` 단위 테스트
  (2자·3자·1자·공백 경계).
- **서버 액션**: 기존 `submit`/`forms` 테스트 패턴대로 supabase rpc 목킹 —
  검증 실패 시 액션이 RPC를 호출하지 않음, 성공 시 올바른 인자로 호출.
- SQL 함수 동작 자체는 마이그레이션 적용 후 수동/통합 확인(순수 단위 테스트
  범위 밖)으로 다룬다.

## 9. 마이그레이션 적용

1. `supabase/migrations/<timestamp>_inquiry_secret_post.sql` 작성
   (컬럼 추가 · pgcrypto · 함수 4개 · EXECUTE GRANT).
2. 운영 Supabase에 동일 적용. `.env.local`이 운영을 가리키므로
   **적용 직전 사용자에게 한 번 확인**받고 진행.

## 10. 비범위(Out of scope)

- 비밀번호 찾기/재설정, PIN 무차별 대입 레이트리밋.
- 답변 알림 이메일/문자.
- 작성자 본인 글 수정/삭제(공개 측). 관리는 어드민에서.
- 게시판 페이지네이션 변경(현행 목록 UI 유지).
