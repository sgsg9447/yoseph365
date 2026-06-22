# 상담문의 답변 작성(리치 에디터) — 설계

## 배경
어드민 상담문의 처리가 "완료 처리"(status만 변경)뿐이고 **답변을 쓰는 UI가 없다**.
공개 상세 페이지·비밀글 reveal은 **이미 `inquiry.answer`를 표시**(평문)하므로, 빈 곳은
"어드민 답변 작성" + "답변을 리치 HTML로".

## 결정 (확정)
- **처리 흐름: 답변+완료 병행.** "답변 작성" 추가, 기존 "완료 처리" 유지.
- **에디터: 공용 컴포넌트로 추출(A안).** `NoticeEditor` → `components/admin/RichEditor`.

## 현재 상태(확인됨)
- `inquiry.answer text`, `inquiry.status enum('답변대기','답변완료')` 이미 존재 → **DB 변경 없음**.
- 공개 상세 [page.tsx]: `post.answer` 있으면 답변 블록 표시(평문 `Paragraphs`), 없으면 "답변 준비중".
- 비밀글 [SecretReveal.tsx]: PIN 통과 후 content·answer 표시(평문).
- 어드민 [ConsultTable.tsx]: "완료 처리" = `updateInquiryStatus(status:'답변완료')`, 내부 메모(admin_memo)만.
- 어드민 쿼리 `getInquiries`는 `answer`를 **안 읽음**.

## 설계

### 1. 공용 에디터 추출
- `src/app/admin/(dashboard)/notice/NoticeEditor.tsx` → `src/components/admin/RichEditor.tsx` (개명 `RichEditor`).
- `createImageUploadTarget` (현 notice/actions.ts) → `src/lib/storage/actions.ts` 로 이동
  (컴포넌트가 app/notice에 의존하지 않도록).
- `sanitizeRichHtml` (현 lib/notice/sanitize.ts) → `src/lib/richtext/sanitize.ts` 로 이동(+테스트).
- notice/NoticeForm·actions·공개 notice 페이지의 import 갱신. 동작 변화 없음(리팩터).

### 2. 답변 작성 (어드민)
- ConsultCard에 **"답변 작성/수정"** 버튼(답변 있으면 "수정") + 답변 모달.
- 모달: `RichEditor`로 답변 HTML 편집. 비공개 문의(`!isPublicPost`)면 "공개 페이지에 표시되지 않음" 안내.
- 저장 → 새 액션 `answerInquiry({ id, answer })`:
  - `sanitizeRichHtml(answer)` 정제.
  - `isBlankHtml(clean)` 이면 `{ answer:null, status:'답변대기' }`, 아니면 `{ answer:clean, status:'답변완료' }`.
  - revalidate: `/admin`(layout, 사이드바 뱃지), `/inquiry`, `/inquiry/${id}`.

### 3. 답변 = 리치 HTML 렌더
- 공개 상세 [page.tsx] 답변 블록: `Paragraphs` → `rich-content` + `dangerouslySetInnerHTML(sanitizeRichHtml(answer))`.
- 비밀글 [SecretReveal.tsx] 답변: 동일.
- **문의 본문(사용자 작성)은 평문 `Paragraphs` 유지.**
- 기존 평문 답변은 줄바꿈이 사라질 수 있음(소량, 감수).

### 4. 데이터/검증 헬퍼
- 답변 prefill: `consult/actions.ts`의 `getInquiryAnswer(id)` 로 **온디맨드 조회**
  (다른 세션이 `lib/queries/admin.ts`를 동시 편집 중이라 공유 쿼리 수정을 피함).
- `inquiryAnswerSchema` (zod): `{ id: 양의 정수, answer: string(빈 문자열 허용) }`
  — `consult/actions.ts`에 **인라인**(다른 세션이 `forms.ts`를 동시 편집 중이라 회피).
- `isBlankHtml(html)` 순수 헬퍼: 태그·공백 제거 후 빈지 판정. 이미지·hr은 내용으로 봄(`lib/richtext/sanitize.ts`).

> 참고: 작업 트리를 다른 세션과 공유 중이라 공유 파일(`forms.ts`·`lib/queries/admin.ts`)을
> 건드리지 않도록 설계를 조정했다. 모든 변경은 신규/단독 소유 파일에 한정.

## 검증 (TDD)
1. `isBlankHtml`: `<p></p>`·공백·`<br>` → true / 텍스트·이미지 포함 → false (red→green).
2. `sanitizeRichHtml`: 기존 테스트 이동 후 통과 유지.
3. `pnpm test` 전체 통과, 변경 파일 lint·tsc 클린.
4. 임시 프리뷰 라우트로 답변 모달 렌더 확인(인증 게이트 우회) 후 삭제.

## 도메인 규칙 점검
회원제 없음(답변은 공개 게시판/비밀글 PIN으로만 전달, 로그인 없음) ✔ / 취업률·개강일·모집상태·신청분기·외부링크 무관 ✔.

## 변경 파일 (실제)
- 신규: `components/admin/RichEditor.tsx`, `lib/storage/actions.ts`
- 이동: `lib/notice/sanitize.*` → `lib/richtext/sanitize.*`(+`isBlankHtml`·테스트)
- notice: NoticeForm(RichEditor import), actions(업로드액션 제거·sanitize 경로), 공개 notice page(sanitize 경로)
- consult: actions(`answerInquiry`·`getInquiryAnswer`·인라인 스키마), ConsultTable(답변 버튼·모달)
- 공개 inquiry: [id]/page.tsx, [id]/SecretReveal.tsx (답변 HTML 렌더)
- (회피: `lib/queries/admin.ts`·`lib/validations/forms.ts` — 다른 세션 작업과 충돌 방지)
