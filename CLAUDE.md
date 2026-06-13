@AGENTS.md

# 성요셉목수학교 웹사이트 리뉴얼

국비지원 직업훈련기관 웹사이트. 기획 문서가 source of truth:
`/Users/seulgi/Documents/성요셉/기획 문서/` (Ch1~6, 데이터정의서 v2, 화면정의서 v2, 시드데이터, 엔지니어링설계서).

## 스택
- **Next.js 16 (App Router) + TypeScript + Tailwind v4** — pnpm
- **Supabase (Postgres + Auth)** — DB 접근은 `@supabase/supabase-js` 직접(ORM 없음), 관리자만 Auth
- **zod + Server Actions** — 폼 검증·제출
- 이미지: S3(+CloudFront), 이메일: Resend
- 호스팅: Vercel

## 핵심 도메인 규칙 (위반 금지)
- **회원제 없음.** 모든 신청·문의는 비로그인. Auth는 `/admin/*` 관리자 전용.
- **`course.funding_type`이 신청 흐름(A·B·C)을 결정** — 경기도무료→A, 국비지원→B, 자부담→C.
  - A: 온라인 폼 없음(서식 다운+이메일/방문 접수 안내만)
  - B·C: 웹은 "안내+가등록 문의"까지만. 고용24·큐넷은 외부 링크(연동 없음).
- **취업률·개강일·잔여석은 화면 미표시.** `schedule`은 운영자 내부용.
- `recruit_status`는 운영자 수동(모집예정/모집중/마감).
- 모든 삭제는 소프트 삭제(`is_deleted`).
- **RLS 필수**: 공개는 게시 콘텐츠 SELECT + 제출 테이블 INSERT만. 개인정보(name·phone) 든 application·inquiry·waitlist의 읽기·수정은 관리자만.

## 렌더링/SEO
- 홈·학원소개·국비지원: SSG/ISR
- 과정 목록·상세: ISR + 과정별 메타·JSON-LD(organic 유입 핵심 채널)
- 폼: CSR + Server Action

## 디렉토리
- `src/lib/supabase/{client,server}.ts` — Supabase 클라이언트 헬퍼
- `supabase/migrations/` — 스키마(+RLS), `supabase/seed.sql` — 시드

## 로컬 개발
- `pnpm dev` — Next 개발 서버
- `pnpm supabase start` / `stop` — 로컬 Supabase(Docker). start 출력의 anon key를 `.env.local`에 넣는다.
- `pnpm supabase db reset` — 마이그레이션 재적용 + seed 재투입
