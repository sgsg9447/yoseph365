# 공지 에디터 강화 + 이미지 업로드 — 설계

## 배경
공지 글쓰기 에디터(Tiptap)의 툴바가 6개뿐(굵게·기울임·제목·• 목록·1.목록·링크)이고
본문에 이미지를 넣을 수 없다. "공지에서 흔히 쓰는" 편집 기능과 이미지 업로드를 추가한다.

## 스코프(실용 표준)
툴바 최종 구성(그룹 구분선으로 정리):

```
굵게 기울임 밑줄 취소선 | 제목H2 제목H3 | • 목록 1.목록 | 인용 구분선 | 좌 중 우 | 링크 이미지 | ↶ ↷
```

이미지 입력 경로 3가지: 툴바 버튼 · 드래그&드롭 · 붙여넣기.

비스코프(이번에 안 함): 글자색/형광펜/표/코드블록, 이미지 개별 리사이즈·정렬, 고아 이미지 자동 정리(GC).

## 핵심 발견
- **Tiptap v3 StarterKit가 이미 포함**: Underline·Strike·Blockquote·HorizontalRule·Heading·Undo(history).
  → 버튼만 노출하면 됨.
- **신규 의존성 2개만**: `@tiptap/extension-text-align`, `@tiptap/extension-image`.
- 업로드 인프라(`lib/storage`)가 이미 존재 → `createUploadTarget → uploadToTarget → publicUrl` 재사용.
  본문엔 `<img src>`만 삽입하고 갤러리용 `post` 행은 만들지 않는다.

## 설계

### 1. 이미지 업로드 흐름
1. 파일 선택/드롭/붙여넣기 → `validatePhotoFile`(JPG·PNG·10MB) 검증
2. 서버 액션 `createImageUploadTarget(contentType)` 로 업로드 대상 발급(기존 `makeTarget` 래핑)
3. `uploadToTarget(target, file)` 로 Supabase Storage에 직접 업로드
4. `publicUrl(target.key)` 로 공개 URL 조립 → `editor.chain().focus().setImage({ src }).run()`
- 버킷: 기존 `training-photos` 재사용(새 버킷 프로비저닝 회피).

### 2. sanitize 정책 (가장 위험한 지점)
- 본문 HTML은 저장(create/update)·공개 렌더 양쪽에서 sanitize된다.
- 이미지(`<img src>`)와 정렬(`style="text-align:..."`)이 sanitize에서 **살아남아야** 한다.
- → `sanitizeRichHtml(html)` 순수 헬퍼로 추출(`src/lib/notice/sanitize.ts`)하고
  notice create/update 액션 + 공개 렌더 페이지에서 사용. 배너의 별도 sanitize는 건드리지 않음.
- 계약을 테스트로 고정: img·text-align 보존, script 등 위험 태그 제거.

### 3. 렌더 CSS
- `.rich-content img` 규칙 1개 추가(max-width:100%, height:auto, 라운드, 상하 여백).
- 에디터·공개페이지가 같은 `.rich-content` 클래스를 쓰므로 한 번에 적용.

## 변경 파일
- `package.json` — 의존성 2개 추가
- `src/lib/notice/sanitize.ts` (신규) + `sanitize.test.ts` (신규)
- `src/app/admin/(dashboard)/notice/NoticeEditor.tsx` — 확장·툴바·이미지 업로드
- `src/app/admin/(dashboard)/notice/actions.ts` — `createImageUploadTarget` 추가 + `sanitizeRichHtml` 사용
- `src/app/(public)/notice/[id]/page.tsx` — `sanitizeRichHtml` 사용
- `src/app/globals.css` — `.rich-content img`

## 검증
1. `sanitizeRichHtml` 테스트: img·text-align 보존 / script 제거 (red→green)
2. `pnpm test` 통과
3. `pnpm lint` (변경 파일) 클린
4. 로컬에서 에디터로 이미지 삽입·정렬·서식 후 저장 → 공개 페이지 표시 확인

## 도메인 규칙 점검
회원제·취업률·개강일/잔여석·모집상태·신청분기·외부링크 — 무관(어드민 공지 에디터 한정). 위반 없음.
