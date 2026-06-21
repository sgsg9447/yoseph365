# 상담문의 비밀글(비밀번호 잠금) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 상담문의 게시판에 비밀글(작성자 4자리 PIN으로 잠금)을 추가하고, 실제 제출 문의를 개인정보 노출 없이 공개 게시판에 자동 게시한다.

**Architecture:** `inquiry` 테이블은 잠금 유지(연락처·해시 비노출). 공개 접근은 `SECURITY DEFINER` Postgres 함수 4개로만(목록·공개글 상세·작성·비밀글 검증). PIN은 pgcrypto bcrypt로 DB 안에서 해시. 프런트는 공개 게시판/상세를 목업→RPC로 교체, 바텀시트에 게시판 글쓰기 폼 추가.

**Tech Stack:** Next.js(App Router) · TypeScript strict · Supabase(PostgREST RPC) · pgcrypto · zod · Vitest

설계서: `docs/superpowers/specs/2026-06-21-inquiry-secret-post-design.md`

---

## 파일 구조 (생성/수정)

- **생성** `supabase/migrations/20260621120000_inquiry_secret_post.sql` — 컬럼·pgcrypto·함수 4개·GRANT
- **수정** `src/lib/supabase/database.types.ts` — inquiry 컬럼 3개 + Functions 타입 4개
- **수정** `src/components/icons/index.tsx` — `Lock` 아이콘 추가
- **수정** `src/lib/validations/forms.ts` — `inquiryPostSchema`, `verifySecretSchema`
- **수정** `src/lib/validations/forms.test.ts` — 위 스키마 테스트
- **수정** `src/lib/actions/submit.ts` — `submitInquiryPost`, `verifyInquiryPassword`
- **생성** `src/lib/queries/inquiry.ts` — 공개 목록/상세 RPC 조회 + 타입
- **생성** `src/components/overlay/InquiryPostForm.tsx` — 게시판 글쓰기 폼
- **수정** `src/components/overlay/ConsultSheet.tsx` — mode별 폼 분기
- **수정** `src/app/(public)/inquiry/InquiryBoard.tsx` — 목업→RPC, Lock 뱃지, 상태 4종
- **수정** `src/app/(public)/inquiry/page.tsx` — 서버에서 목록 조회 후 전달
- **수정** `src/app/(public)/inquiry/[id]/page.tsx` — RPC 조회 + 비밀글 분기
- **생성** `src/app/(public)/inquiry/[id]/SecretReveal.tsx` — 잠금 화면 + PIN 모달 + 본문 공개
- **수정** `src/app/admin/(dashboard)/consult/actions.ts` — `updateInquiryPublished`
- **수정** `src/app/admin/(dashboard)/consult/ConsultTable.tsx` — Lock/공개여부 표시 + 숨김 토글
- **수정** `src/lib/queries/admin.ts` — `InquiryView`에 `isPublicPost`·`isSecret`·`isPublished` 추가
- **삭제 안 함** `src/lib/data/inquiries.ts` — 더 이상 import되지 않으면 마지막 정리 태스크에서 제거

---

### Task 1: `Lock` 아이콘 추가

**Files:**
- Modify: `src/components/icons/index.tsx`

- [ ] **Step 1: `Reload` 함수 정의 바로 뒤(파일 끝)에 `Lock` 추가**

```tsx
export function Lock({ size = 24, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth, className)}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
```

- [ ] **Step 2: 타입체크 통과 확인**

Run: `pnpm exec tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add src/components/icons/index.tsx
git commit -m "feat: 비밀글 표시용 Lock 아이콘 추가"
```

---

### Task 2: zod 스키마 (`inquiryPostSchema`, `verifySecretSchema`) — TDD

**Files:**
- Modify: `src/lib/validations/forms.ts`
- Test: `src/lib/validations/forms.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성** — `forms.test.ts` 상단 import에 `inquiryPostSchema, verifySecretSchema` 추가하고, 파일 끝에 다음 블록 추가

```ts
describe("inquiryPostSchema", () => {
  const base = {
    name: "홍길동",
    phone: "010-1234-5678",
    category: "과정문의",
    courseId: "",
    title: "수업 시간이 궁금합니다",
    content: "오후반도 있나요?",
    email: "",
    isSecret: false,
    password: "",
  };

  it("기본 공개글을 통과시킨다", () => {
    expect(inquiryPostSchema.safeParse(base).success).toBe(true);
  });

  it("제목이 비면 거부한다", () => {
    expect(inquiryPostSchema.safeParse({ ...base, title: "" }).success).toBe(false);
  });

  it("본문이 비면 거부한다", () => {
    expect(inquiryPostSchema.safeParse({ ...base, content: "" }).success).toBe(false);
  });

  it("비밀글이면 4자리 숫자 PIN을 요구한다", () => {
    expect(
      inquiryPostSchema.safeParse({ ...base, isSecret: true, password: "" }).success,
    ).toBe(false);
    expect(
      inquiryPostSchema.safeParse({ ...base, isSecret: true, password: "12" }).success,
    ).toBe(false);
    expect(
      inquiryPostSchema.safeParse({ ...base, isSecret: true, password: "abcd" }).success,
    ).toBe(false);
    expect(
      inquiryPostSchema.safeParse({ ...base, isSecret: true, password: "1234" }).success,
    ).toBe(true);
  });

  it("잘못된 카테고리를 거부한다", () => {
    expect(inquiryPostSchema.safeParse({ ...base, category: "엉뚱" }).success).toBe(false);
  });
});

describe("verifySecretSchema", () => {
  it("숫자 4자리만 통과시킨다", () => {
    expect(verifySecretSchema.safeParse({ id: 1, password: "1234" }).success).toBe(true);
    expect(verifySecretSchema.safeParse({ id: 1, password: "12" }).success).toBe(false);
    expect(verifySecretSchema.safeParse({ id: 1, password: "abcd" }).success).toBe(false);
    expect(verifySecretSchema.safeParse({ id: 0, password: "1234" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm exec vitest run src/lib/validations/forms.test.ts`
Expected: FAIL — `inquiryPostSchema is not exported` (또는 undefined)

- [ ] **Step 3: 스키마 구현** — `forms.ts`의 `consultSchema` 정의 바로 뒤에 추가

```ts
const pin4 = z.string().trim().regex(/^[0-9]{4}$/, "비밀번호는 숫자 4자리로 입력해 주세요");

// 게시판 글쓰기(공개 문의글) — 비밀글이면 PIN 필수
export const inquiryPostSchema = z
  .object({
    name: z.string().trim().min(1, "이름을 입력해 주세요").max(50),
    phone,
    category: z.enum(["국비지원", "과정문의", "기타"]),
    courseId: optText(80),
    title: z.string().trim().min(1, "제목을 입력해 주세요").max(200),
    content: z.string().trim().min(1, "문의 내용을 입력해 주세요").max(1000),
    email: optEmail,
    isSecret: z.boolean().optional().default(false),
    password: z.string().trim().optional().default(""),
  })
  .superRefine((v, ctx) => {
    if (v.isSecret && !/^[0-9]{4}$/.test(v.password)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "비밀글 비밀번호는 숫자 4자리로 입력해 주세요",
      });
    }
  });
export type InquiryPostInput = z.infer<typeof inquiryPostSchema>;

// 비밀글 열람 검증
export const verifySecretSchema = z.object({
  id: z.number().int().positive(),
  password: pin4,
});
export type VerifySecretInput = z.infer<typeof verifySecretSchema>;
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm exec vitest run src/lib/validations/forms.test.ts`
Expected: PASS (전체 그린)

- [ ] **Step 5: Commit**

```bash
git add src/lib/validations/forms.ts src/lib/validations/forms.test.ts
git commit -m "test: 비밀글 작성·검증 zod 스키마(inquiryPostSchema·verifySecretSchema)"
```

---

### Task 3: 마이그레이션 SQL 작성

**Files:**
- Create: `supabase/migrations/20260621120000_inquiry_secret_post.sql`

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- =============================================================
-- 상담문의 비밀글 + 공개 게시판 노출
-- 설계: docs/superpowers/specs/2026-06-21-inquiry-secret-post-design.md
-- 원칙: inquiry 테이블은 잠금 유지(연락처·해시 비노출).
--       공개 접근은 SECURITY DEFINER 함수로만, 안전 컬럼만 반환.
-- =============================================================

create extension if not exists pgcrypto;

alter table inquiry
  add column if not exists is_public_post boolean not null default false,  -- 게시판 공개 글
  add column if not exists is_secret      boolean not null default false,  -- 비밀글 여부
  add column if not exists is_published   boolean not null default true,   -- 어드민 숨김 토글
  add column if not exists password_hash  text;                            -- bcrypt(비밀글만)

-- ---------- 작성 ----------
create or replace function submit_public_inquiry(
  p_name text, p_phone text, p_category inquiry_category,
  p_course_id text, p_title text, p_content text,
  p_is_secret boolean, p_password text
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
begin
  if coalesce(p_is_secret, false) and (p_password is null or p_password !~ '^[0-9]{4}$') then
    raise exception 'invalid_password';
  end if;
  insert into inquiry (
    name, phone, category, course_id, title, content,
    is_public_post, is_secret, is_published, password_hash, privacy_agreed
  ) values (
    p_name, p_phone, p_category, nullif(p_course_id, ''), p_title, p_content,
    true, coalesce(p_is_secret, false), true,
    case when coalesce(p_is_secret, false) then crypt(p_password, gen_salt('bf')) else null end,
    true
  )
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------- 목록 (안전 컬럼만) ----------
create or replace function list_public_inquiries()
returns table (
  id bigint, title text, category inquiry_category,
  status inquiry_status, is_secret boolean,
  author_masked text, created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select i.id, i.title, i.category, i.status, i.is_secret,
         left(i.name, 1) || repeat('*', greatest(char_length(i.name) - 1, 0)),
         i.created_at
  from inquiry i
  where i.is_public_post = true and i.is_published = true
  order by i.created_at desc;
$$;

-- ---------- 공개글 상세 (비밀글이면 본문·답변 null) ----------
create or replace function get_public_inquiry(p_id bigint)
returns table (
  id bigint, title text, category inquiry_category, status inquiry_status,
  is_secret boolean, author_masked text, content text, answer text, created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select i.id, i.title, i.category, i.status, i.is_secret,
         left(i.name, 1) || repeat('*', greatest(char_length(i.name) - 1, 0)),
         case when i.is_secret then null else i.content end,
         case when i.is_secret then null else i.answer end,
         i.created_at
  from inquiry i
  where i.id = p_id and i.is_public_post = true and i.is_published = true;
$$;

-- ---------- 비밀글 검증(PIN 일치 시에만 본문·답변) ----------
create or replace function verify_secret_inquiry(p_id bigint, p_password text)
returns table (
  id bigint, title text, category inquiry_category, status inquiry_status,
  author_masked text, content text, answer text, created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select i.id, i.title, i.category, i.status,
         left(i.name, 1) || repeat('*', greatest(char_length(i.name) - 1, 0)),
         i.content, i.answer, i.created_at
  from inquiry i
  where i.id = p_id
    and i.is_public_post = true and i.is_published = true
    and i.is_secret = true and i.password_hash is not null
    and i.password_hash = crypt(p_password, i.password_hash);
$$;

-- ---------- 실행 권한(anon·authenticated) ----------
grant execute on function submit_public_inquiry(text, text, inquiry_category, text, text, text, boolean, text) to anon, authenticated;
grant execute on function list_public_inquiries() to anon, authenticated;
grant execute on function get_public_inquiry(bigint) to anon, authenticated;
grant execute on function verify_secret_inquiry(bigint, text) to anon, authenticated;
```

- [ ] **Step 2: SQL 문법 점검(로컬 supabase가 떠 있으면)**

Run: `cat supabase/migrations/20260621120000_inquiry_secret_post.sql | head -5`
Expected: 파일이 존재하고 내용이 보임 (로컬 DB 적용은 Task 4에서)

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260621120000_inquiry_secret_post.sql
git commit -m "feat: 상담문의 비밀글·공개게시판 마이그레이션(pgcrypto·RPC 4종)"
```

---

### Task 4: 마이그레이션 운영 적용 + 타입 갱신 ⚠️ 사용자 확인 필요

**Files:**
- Modify: `src/lib/supabase/database.types.ts`

> ⚠️ `.env.local`이 **운영 Supabase**를 가리킨다. 적용 전 사용자에게 확인받는다.

- [ ] **Step 1: 사용자에게 "운영 DB에 마이그레이션 적용" 확인받기**

확인 후, 연결된 프로젝트에 적용:
Run: `pnpm dlx supabase db push`  (또는 운영 SQL 에디터에 위 마이그레이션 실행)
Expected: 함수 4개·컬럼 3개 생성 성공

- [ ] **Step 2: `database.types.ts`에 inquiry 컬럼 3개 추가**

`inquiry` 테이블의 `Row`/`Insert`/`Update`에 다음 필드를 각각 추가한다(`Row`는 값 타입, `Insert`/`Update`는 `?` 옵셔널):

```ts
// Row 에:
is_public_post: boolean
is_secret: boolean
is_published: boolean
password_hash: string | null
// Insert/Update 에:
is_public_post?: boolean
is_secret?: boolean
is_published?: boolean
password_hash?: string | null
```

- [ ] **Step 3: `database.types.ts`의 public `Functions` 블록에 함수 4개 타입 추가**

`Functions: {` 블록 안(현재 `graphql` 옆)에 추가:

```ts
submit_public_inquiry: {
  Args: {
    p_name: string; p_phone: string;
    p_category: Database["public"]["Enums"]["inquiry_category"];
    p_course_id: string; p_title: string; p_content: string;
    p_is_secret: boolean; p_password: string;
  };
  Returns: number;
};
list_public_inquiries: {
  Args: Record<PropertyKey, never>;
  Returns: {
    id: number; title: string;
    category: Database["public"]["Enums"]["inquiry_category"];
    status: Database["public"]["Enums"]["inquiry_status"];
    is_secret: boolean; author_masked: string; created_at: string;
  }[];
};
get_public_inquiry: {
  Args: { p_id: number };
  Returns: {
    id: number; title: string;
    category: Database["public"]["Enums"]["inquiry_category"];
    status: Database["public"]["Enums"]["inquiry_status"];
    is_secret: boolean; author_masked: string;
    content: string | null; answer: string | null; created_at: string;
  }[];
};
verify_secret_inquiry: {
  Args: { p_id: number; p_password: string };
  Returns: {
    id: number; title: string;
    category: Database["public"]["Enums"]["inquiry_category"];
    status: Database["public"]["Enums"]["inquiry_status"];
    author_masked: string; content: string; answer: string | null; created_at: string;
  }[];
};
```

- [ ] **Step 4: 타입체크 통과 확인**

Run: `pnpm exec tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/database.types.ts
git commit -m "chore: 비밀글 RPC·inquiry 컬럼 DB 타입 반영"
```

---

### Task 5: 서버 액션 (`submitInquiryPost`, `verifyInquiryPassword`)

**Files:**
- Modify: `src/lib/actions/submit.ts`

- [ ] **Step 1: import에 새 스키마 추가**

`submit.ts` 상단 import 수정:

```ts
import {
  applicationSchema,
  consultSchema,
  inquiryPostSchema,
  verifySecretSchema,
} from "@/lib/validations/forms";
```

- [ ] **Step 2: 공개 게시판 글 타입 + 액션 2개 추가** — 파일 끝에 추가

```ts
export interface PublicInquiryDetail {
  id: number;
  title: string;
  category: string;
  status: string;
  authorMasked: string;
  content: string;
  answer: string | null;
  createdAt: string;
}

export type VerifyResult =
  | { ok: true; post: PublicInquiryDetail }
  | { ok: false; error: string };

// 게시판 글쓰기(공개 문의) → submit_public_inquiry RPC
export async function submitInquiryPost(input: unknown): Promise<SubmitResult> {
  const parsed = inquiryPostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }
  const v = parsed.data;
  const sb = createPublicClient();
  const { error } = await sb.rpc("submit_public_inquiry", {
    p_name: v.name,
    p_phone: v.phone,
    p_category: v.category,
    p_course_id: v.courseId,
    p_title: v.title,
    p_content: v.content,
    p_is_secret: v.isSecret,
    p_password: v.password,
  });
  if (error) return { ok: false, error: GENERIC_ERROR };
  return { ok: true };
}

// 비밀글 열람 검증 → verify_secret_inquiry RPC
export async function verifyInquiryPassword(input: unknown): Promise<VerifyResult> {
  const parsed = verifySecretSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "비밀번호는 숫자 4자리로 입력해 주세요." };
  }
  const v = parsed.data;
  const sb = createPublicClient();
  const { data, error } = await sb.rpc("verify_secret_inquiry", {
    p_id: v.id,
    p_password: v.password,
  });
  if (error) return { ok: false, error: GENERIC_ERROR };
  const row = data?.[0];
  if (!row) return { ok: false, error: "비밀번호가 일치하지 않습니다." };
  return {
    ok: true,
    post: {
      id: row.id,
      title: row.title,
      category: row.category,
      status: row.status,
      authorMasked: row.author_masked,
      content: row.content,
      answer: row.answer,
      createdAt: row.created_at,
    },
  };
}
```

- [ ] **Step 3: 타입체크 통과 확인**

Run: `pnpm exec tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 4: Commit**

```bash
git add src/lib/actions/submit.ts
git commit -m "feat: 비밀글 작성·열람검증 서버 액션(RPC 연동)"
```

---

### Task 6: 공개 목록/상세 조회 헬퍼 (`queries/inquiry.ts`)

**Files:**
- Create: `src/lib/queries/inquiry.ts`

- [ ] **Step 1: 조회 헬퍼 작성**

```ts
import { createPublicClient } from "@/lib/supabase/public";

export interface PublicInquiryListItem {
  id: number;
  title: string;
  category: string;
  status: string;
  isSecret: boolean;
  authorMasked: string;
  createdAt: string;
}

export interface PublicInquiryView extends PublicInquiryListItem {
  content: string | null; // 비밀글이면 null
  answer: string | null;
}

// 공개 게시판 목록
export async function fetchPublicInquiries(): Promise<PublicInquiryListItem[]> {
  const sb = createPublicClient();
  const { data, error } = await sb.rpc("list_public_inquiries");
  if (error || !data) throw new Error("inquiry_list_failed");
  return data.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    status: r.status,
    isSecret: r.is_secret,
    authorMasked: r.author_masked,
    createdAt: r.created_at,
  }));
}

// 공개글 상세(비밀글이면 content·answer는 null)
export async function fetchPublicInquiry(id: number): Promise<PublicInquiryView | null> {
  const sb = createPublicClient();
  const { data, error } = await sb.rpc("get_public_inquiry", { p_id: id });
  if (error) throw new Error("inquiry_detail_failed");
  const r = data?.[0];
  if (!r) return null;
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    status: r.status,
    isSecret: r.is_secret,
    authorMasked: r.author_masked,
    createdAt: r.created_at,
    content: r.content,
    answer: r.answer,
  };
}
```

- [ ] **Step 2: 타입체크 통과 확인**

Run: `pnpm exec tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add src/lib/queries/inquiry.ts
git commit -m "feat: 공개 상담문의 목록·상세 RPC 조회 헬퍼"
```

---

### Task 7: 게시판 글쓰기 폼 (`InquiryPostForm`) + 시트 분기

**Files:**
- Create: `src/components/overlay/InquiryPostForm.tsx`
- Modify: `src/components/overlay/ConsultSheet.tsx`

- [ ] **Step 1: `InquiryPostForm` 작성**

```tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Field, ReqLabel } from "@/components/ui/Field";
import { Lock, Check } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { submitInquiryPost } from "@/lib/actions/submit";
import { formatPhoneInput } from "@/lib/formatters/input";

const CATEGORIES = ["국비지원", "과정문의", "기타"] as const;

export function InquiryPostForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("과정문의");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [email, setEmail] = useState("");
  const [isSecret, setIsSecret] = useState(false);
  const [password, setPassword] = useState("");
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sb = createClient();
    sb.from("course")
      .select("id, name")
      .eq("is_deleted", false)
      .order("sort_order")
      .then(({ data }) => setCourses(data ?? []));
  }, []);

  const handleSubmit = async () => {
    if (pending) return;
    setError(null);
    setPending(true);
    const res = await submitInquiryPost({
      name, phone, category, courseId, title, content, email, isSecret, password,
    });
    setPending(false);
    if (res.ok) onDone();
    else setError(res.error);
  };

  return (
    <div className="flex flex-col gap-[14px]">
      <Field label="제목" placeholder="문의 제목을 입력해 주세요" required value={title}
        maxLength={200} onChange={(e) => setTitle(e.target.value)} />

      <div className="flex flex-col gap-[7px]">
        <ReqLabel>구분</ReqLabel>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" onClick={() => setCategory(c)}
              className="h-[38px] px-4 rounded-full text-[14px] font-semibold border transition-colors"
              style={{
                background: c === category ? "var(--color-primary)" : "var(--color-surface-card)",
                color: c === category ? "#fff" : "var(--color-body-strong)",
                borderColor: c === category ? "var(--color-primary)" : "var(--color-hairline-strong)",
              }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <Field label="문의 내용" as="textarea" required placeholder="궁금하신 점을 자유롭게 남겨주세요"
        value={content} maxLength={1000} onChange={(e) => setContent(e.target.value)} />

      <Field label="이름" placeholder="홍길동" required value={name}
        maxLength={50} onChange={(e) => setName(e.target.value)} />
      <Field label="연락처" type="tel" inputMode="numeric" placeholder="010-0000-0000" required
        value={phone} maxLength={13}
        onChange={(e) => setPhone(formatPhoneInput(e.target.value, (e.nativeEvent as InputEvent).inputType))} />
      <Field label="이메일" type="email" inputMode="email" placeholder="선택 입력"
        value={email} onChange={(e) => setEmail(e.target.value)} />

      {/* 비밀글 */}
      <div className="flex flex-col gap-[10px] p-4 bg-surface-strong border border-hairline rounded-button">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={isSecret} onChange={(e) => setIsSecret(e.target.checked)}
            className="w-[18px] h-[18px] accent-[var(--color-primary)]" />
          <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-body-strong">
            <Lock size={15} strokeWidth={2.2} /> 비밀글로 작성
          </span>
        </label>
        {isSecret && (
          <Field label="비밀번호 (숫자 4자리)" type="password" inputMode="numeric"
            placeholder="••••" required value={password} maxLength={4}
            onChange={(e) => setPassword(e.target.value.replace(/[^0-9]/g, ""))} />
        )}
        <p className="text-[13px] text-muted-soft m-0 leading-[1.5]">
          비밀글은 작성자만 비밀번호로 확인할 수 있고, 관리자가 답변합니다.
        </p>
      </div>

      {error && <p className="text-[13.5px] text-error leading-[1.5] m-0">{error}</p>}

      <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} disabled={pending}>
        {pending ? "등록 중…" : "문의 등록"}
      </Button>
      <p className="text-[13px] text-muted-soft text-center m-0 leading-[1.5]">
        연락처는 답변 안내 목적이며 게시판에 공개되지 않습니다.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: `ConsultSheet`에서 inquiry 모드면 새 폼 사용**

`ConsultSheet.tsx`에 `import { InquiryPostForm } from "./InquiryPostForm";` 추가하고, 완료 화면 분기(`done ? ... : <ConsultForm .../>`)에서 미완료 분기를 다음으로 교체:

```tsx
) : isInquiry ? (
  <InquiryPostForm onDone={() => setDone(true)} />
) : (
  <ConsultForm onDone={() => setDone(true)} submitLabel={submitLabel} />
)}
```

또한 완료 문구가 상담 기준이므로, inquiry 모드 완료 문구를 분기한다(완료 화면 `<p>` 텍스트):

```tsx
{isInquiry
  ? "문의가 등록되었어요. 작성하신 내용은 게시판에서 확인하실 수 있고, 관리자가 1영업일 안에 답변드립니다."
  : "상담이 접수되었어요. 담당 선생님이 1영업일 안에 전화드려 국비지원 자격과 과정을 안내해 드립니다."}
```

- [ ] **Step 3: 타입체크 + 기존 시트 테스트 통과 확인**

Run: `pnpm exec tsc --noEmit && pnpm exec vitest run src/components/overlay/ConsultSheet.test.tsx`
Expected: 타입 에러 없음, 테스트 PASS (실패 시 ConsultSheet.test의 기대 문구를 새 분기에 맞게 수정)

- [ ] **Step 4: Commit**

```bash
git add src/components/overlay/InquiryPostForm.tsx src/components/overlay/ConsultSheet.tsx
git commit -m "feat: 상담문의 게시판 글쓰기 폼(제목·구분·비밀글 PIN) + 시트 분기"
```

---

### Task 8: 공개 게시판 목록 — 목업→RPC + Lock 뱃지 + 상태 4종

**Files:**
- Modify: `src/app/(public)/inquiry/page.tsx`
- Modify: `src/app/(public)/inquiry/InquiryBoard.tsx`

- [ ] **Step 1: `page.tsx`에서 서버 조회 후 전달 (에러는 빈 배열로 폴백)**

`page.tsx`의 `import { InquiryBoard }` 아래에 추가하고, `<InquiryBoard />`를 `<InquiryBoard posts={posts} loadError={loadError} />`로 교체:

```tsx
import { fetchPublicInquiries, type PublicInquiryListItem } from "@/lib/queries/inquiry";

export const dynamic = "force-dynamic"; // 제출 즉시 반영

// ...컴포넌트 함수 본문 시작 부분:
let posts: PublicInquiryListItem[] = [];
let loadError = false;
try {
  posts = await fetchPublicInquiries();
} catch {
  loadError = true;
}
```

(`InquiryPage`를 `async function`으로 바꾼다.)

- [ ] **Step 2: `InquiryBoard`를 props 기반으로 교체**

`InquiryBoard.tsx`에서 `INQUIRY_POSTS` import·사용을 제거하고 props를 받는다. 핵심 변경:

```tsx
import { Lock } from "@/components/icons";
import type { PublicInquiryListItem } from "@/lib/queries/inquiry";

const CAT_MAP: Record<string, string> = { 국비지원: "국비지원", 과정문의: "과정 문의", 기타: "기타" };

export function InquiryBoard({
  posts,
  loadError,
}: {
  posts: PublicInquiryListItem[];
  loadError: boolean;
}) {
  const [cat, setCat] = useState<string>("전체");
  const [q, setQ] = useState("");
  const { openConsult } = useConsult();

  const list = posts.filter(
    (p) =>
      (cat === "전체" || CAT_MAP[p.category] === cat) &&
      (!q || p.title.includes(q)),
  );
  // ...기존 마크업 유지. 날짜 표기는 p.createdAt.slice(0, 10).
```

목록 행에서 제목 옆에 비밀글이면 Lock 뱃지를 넣는다(기존 `board-title` span 앞):

```tsx
{p.isSecret && (
  <Lock size={14} strokeWidth={2.2} className="flex-shrink-0 text-muted" aria-label="비밀글" />
)}
```

행 매핑은 `id`/`title`/`status`/`category`/`createdAt`을 새 필드명으로 사용하도록 수정:
- `p.status` → 그대로(Badge)
- `p.cat` → `CAT_MAP[p.category] ?? p.category`
- `p.date` → `p.createdAt.slice(0, 10)`

에러/빈 상태(기존 "검색 결과가 없습니다" 자리 위/주변):

```tsx
{loadError ? (
  <div style={{ padding: "40px 0", textAlign: "center" }}>
    <p style={{ fontSize: 15, color: "var(--color-muted)", margin: "0 0 12px" }}>
      목록을 불러오지 못했습니다.
    </p>
    <a href={"tel:" + PHONE_MAIN} style={{ color: "var(--color-primary)", fontWeight: 700 }}>
      전화 문의 {PHONE_MAIN}
    </a>
  </div>
) : list.length === 0 ? (
  <p style={{ padding: "40px 0", textAlign: "center", fontSize: 15, color: "var(--color-muted)", margin: 0 }}>
    {posts.length === 0 ? "아직 등록된 문의가 없습니다. 첫 문의를 남겨보세요." : "검색 결과가 없습니다."}
  </p>
) : null}
```

(로딩 스켈레톤: 서버에서 `force-dynamic`으로 즉시 데이터를 받으므로 별도 클라이언트 로딩 상태는 불필요. `app/(public)/inquiry/loading.tsx`가 있으면 라우트 전환 시 스켈레톤이 노출된다.)

- [ ] **Step 3: 타입체크 + 빌드 일부 확인**

Run: `pnpm exec tsc --noEmit`
Expected: 에러 없음 (`INQUIRY_POSTS` 미사용으로 인한 미해결 import 없음)

- [ ] **Step 4: Commit**

```bash
git add "src/app/(public)/inquiry/page.tsx" "src/app/(public)/inquiry/InquiryBoard.tsx"
git commit -m "feat: 상담문의 게시판 목록 DB 연동(RPC) + 비밀글 Lock 뱃지·상태 처리"
```

---

### Task 9: 상세 페이지 — RPC 조회 + 비밀글 잠금/PIN 모달

**Files:**
- Modify: `src/app/(public)/inquiry/[id]/page.tsx`
- Create: `src/app/(public)/inquiry/[id]/SecretReveal.tsx`

- [ ] **Step 1: `SecretReveal` 클라이언트 컴포넌트 작성(잠금 화면 + PIN 모달 + 본문 공개)**

```tsx
"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Lock } from "@/components/icons";
import { verifyInquiryPassword, type PublicInquiryDetail } from "@/lib/actions/submit";

function Paragraphs({ text, color, size }: { text: string; color: string; size: number }) {
  return (
    <>
      {text.split("\n").map((ln, i) => (
        <p key={i} style={{ fontSize: size, color, lineHeight: 1.85, margin: i === 0 ? 0 : "14px 0 0", wordBreak: "keep-all" }}>
          {ln}
        </p>
      ))}
    </>
  );
}

export function SecretReveal({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<PublicInquiryDetail | null>(null);

  const submit = async () => {
    if (pending) return;
    setError(null);
    setPending(true);
    const res = await verifyInquiryPassword({ id, password: pin });
    setPending(false);
    if (res.ok) {
      setPost(res.post);
      setOpen(false);
    } else {
      setError(res.error);
    }
  };

  if (post) {
    return (
      <div style={{ padding: "32px 4px 36px", borderBottom: "1px solid var(--color-hairline)" }}>
        <Paragraphs text={post.content} color="var(--color-body)" size={17} />
        {post.answer && (
          <div style={{ marginTop: 28, background: "var(--color-primary-soft)", border: "1px solid var(--color-primary-border)", borderRadius: 18, padding: 24 }}>
            <strong style={{ display: "block", marginBottom: 10, color: "var(--color-ink)" }}>성요셉목수학교 답변</strong>
            <Paragraphs text={post.answer} color="var(--color-body-strong)" size={16.5} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: "48px 4px", textAlign: "center" }}>
      <span style={{ display: "inline-grid", placeItems: "center", width: 56, height: 56, borderRadius: 16, background: "var(--color-surface-strong)", color: "var(--color-muted)", marginBottom: 16 }}>
        <Lock size={26} strokeWidth={2} />
      </span>
      <p style={{ fontSize: 16, color: "var(--color-body)", margin: "0 0 20px" }}>
        비밀글입니다. 작성 시 입력한 비밀번호를 입력해 주세요.
      </p>
      <Button variant="primary" size="md" onClick={() => setOpen(true)}>비밀번호 입력</Button>

      <Modal open={open} onClose={() => setOpen(false)} title="비밀글 확인">
        <div className="flex flex-col gap-[14px]">
          <Field label="비밀번호 (숫자 4자리)" type="password" inputMode="numeric" placeholder="••••"
            value={pin} maxLength={4} autoFocus
            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))} />
          {error && <p className="text-[13.5px] text-error m-0">{error}</p>}
          <Button variant="primary" size="lg" fullWidth onClick={submit} disabled={pending}>
            {pending ? "확인 중…" : "확인"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
```

(`Modal` props는 `open/onClose/title/children` — 위 사용부가 그대로 맞다.)

- [ ] **Step 2: `page.tsx`를 RPC 조회 + 비밀글 분기로 교체**

목업 import(`getInquiryById`·`getAdjacentInquiries`·`Inquiry`) 제거. 대신:

```tsx
import { fetchPublicInquiry } from "@/lib/queries/inquiry";
import { SecretReveal } from "./SecretReveal";

export const dynamic = "force-dynamic";
```

`generateMetadata`와 본문에서 `getInquiryById(Number(id))` → `await fetchPublicInquiry(Number(id))`로 교체. `post`가 없으면 기존 "찾을 수 없습니다" 화면 유지.

제목 블록의 메타에서 `작성자=post.authorMasked`, `작성일=post.createdAt.slice(0,10)`, **조회수 항목은 제거**(함수가 반환하지 않음). 구분 Badge는 `CAT_MAP` 적용.

본문/답변 영역을 비밀글 분기로 교체:

```tsx
{post.isSecret ? (
  <SecretReveal id={post.id} />
) : (
  <>
    {/* 기존 본문 Paragraphs */}
    {/* 기존 답변/대기 블록 (post.answer 기준) */}
  </>
)}
```

이전/다음 글 네비게이션은 RPC에 인접 조회가 없으므로 **이번 범위에서 제거**(설계 비범위). 하단 "목록으로" + `InquiryWriteButton`은 유지.

- [ ] **Step 3: 타입체크 통과 확인**

Run: `pnpm exec tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 4: Commit**

```bash
git add "src/app/(public)/inquiry/[id]/page.tsx" "src/app/(public)/inquiry/[id]/SecretReveal.tsx"
git commit -m "feat: 상담문의 상세 DB 연동 + 비밀글 PIN 모달 열람"
```

---

### Task 10: 어드민 — 공개글/비밀글 표시 + 숨김 토글

**Files:**
- Modify: `src/lib/queries/admin.ts`
- Modify: `src/app/admin/(dashboard)/consult/actions.ts`
- Modify: `src/app/admin/(dashboard)/consult/ConsultTable.tsx`

- [ ] **Step 1: `InquiryView`·`toInquiryView`·`getInquiries`에 필드 추가** — `src/lib/queries/admin.ts`

(a) `InquiryView` 인터페이스(현 `id`~`memo`)에 추가:

```ts
  title: string | null;
  isPublicPost: boolean;
  isSecret: boolean;
  isPublished: boolean;
```

(b) `toInquiryView`의 `Pick<InquiryRow, ...>`에 `"title" | "is_public_post" | "is_secret" | "is_published"`를 추가하고, 반환 객체에 추가:

```ts
    title: r.title,
    isPublicPost: r.is_public_post,
    isSecret: r.is_secret,
    isPublished: r.is_published,
```

(c) `getInquiries`의 select 문자열을 다음으로 교체:

```ts
.select("id,name,phone,category,course_id,content,status,created_at,admin_memo,title,is_public_post,is_secret,is_published")
```

- [ ] **Step 2: 숨김 토글 액션 추가** — `consult/actions.ts`에 추가

```ts
export async function updateInquiryPublished(id: number, published: boolean) {
  const sb = await createClient();
  const { error } = await sb.from("inquiry").update({ is_published: published }).eq("id", id);
  if (error) return { ok: false as const, error: "변경에 실패했습니다." };
  revalidatePath("/admin/consult");
  return { ok: true as const };
}
```

(파일 상단의 기존 `createClient`/`revalidatePath` import 패턴을 그대로 사용.)

- [ ] **Step 3: `ConsultTable`에 표시 + 숨김 토글** — `src/app/admin/(dashboard)/consult/ConsultTable.tsx`

(a) import에 추가: `import { Lock } from "@/components/icons";` 및 `import { updateInquiryPublished } from "./actions";` (기존 `updateInquiryStatus, updateInquiryMemo` import에 합쳐도 됨).

(b) 행/상세에서 문의 이름(또는 제목) 옆에 표시 뱃지를 넣는다. 게시판 공개글만 대상:

```tsx
{row.isPublicPost && (
  <span className="inline-flex items-center gap-1">
    {row.isSecret && <Lock size={13} strokeWidth={2.2} className="text-muted" aria-label="비밀글" />}
    <Badge tone={row.isPublished ? "neutral" : "warning"}>
      {row.isPublished ? "게시판" : "숨김"}
    </Badge>
  </span>
)}
```

(c) 상세 모달 액션 영역에 숨김 토글 버튼(공개글일 때만):

```tsx
{row.isPublicPost && (
  <Button
    variant="outline"
    size="sm"
    onClick={() =>
      startTransition(async () => {
        await updateInquiryPublished(row.id, !row.isPublished);
      })
    }
  >
    {row.isPublished ? "게시판에서 숨기기" : "다시 공개" }
  </Button>
)}
```

(기존 `useTransition`의 `startTransition`을 재사용. `Badge`의 `warning` tone이 없으면 `neutral`로 대체.)

- [ ] **Step 4: 타입체크 + 어드민 테스트 통과 확인**

Run: `pnpm exec tsc --noEmit && pnpm exec vitest run src/lib/queries/admin.test.ts src/lib/admin/inquiry.test.ts`
Expected: PASS (테스트가 새 필드로 깨지면 픽스처에 기본값 추가)

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries/admin.ts "src/app/admin/(dashboard)/consult/actions.ts" "src/app/admin/(dashboard)/consult/ConsultTable.tsx"
git commit -m "feat: 어드민 상담문의에 공개글·비밀글 표시 + 숨김 토글"
```

---

### Task 11: 목업 데이터 정리 + 전체 검증

**Files:**
- Delete: `src/lib/data/inquiries.ts` (더 이상 import되지 않을 때만)

- [ ] **Step 1: 잔여 import 확인**

Run: `grep -rn "lib/data/inquiries\|INQUIRY_POSTS\|getInquiryById\|getAdjacentInquiries" src/`
Expected: 결과 없음 → 안전하게 삭제 가능

- [ ] **Step 2: 목업 파일 삭제**

Run: `git rm src/lib/data/inquiries.ts`
Expected: 삭제됨

- [ ] **Step 3: 전체 테스트·린트·빌드**

Run: `pnpm test && pnpm lint && pnpm build`
Expected: 모두 통과

- [ ] **Step 4: 브라우저 검증(preview)** — 게시판에서 ① 공개글 작성→목록 즉시 노출, ② 비밀글 작성→목록에 Lock 뱃지, ③ 비밀글 상세에서 틀린 PIN→오류, 맞는 PIN→본문 공개 확인. 스크린샷으로 증빙.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: 상담문의 목업 데이터 제거(DB 연동 완료)"
```

---

## 도메인 규칙 점검 (구현·리뷰 시 매번)
- ✅ 회원제 없음 — 비밀글은 PIN 기반, 로그인/회원가입 없음.
- ✅ 개인정보 보호 — `inquiry` 공개 SELECT 금지 유지. RPC는 연락처·해시 미반환, 작성자 마스킹.
- ✅ 상담문의 = 바텀시트(글쓰기 폼), 수강신청 = 별도 페이지 — 패턴 유지.
- ✅ 외부 시스템 흉내 없음.
- ✅ UI 카피 한국어·정중·과장 없음.
