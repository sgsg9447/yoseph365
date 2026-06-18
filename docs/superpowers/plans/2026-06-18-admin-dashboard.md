# 운영 관리자 대시보드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 로그인 게이트형 운영 관리자 콘솔(`/admin`)을 8개 탭(셸+인증 포함)으로 구축하되, 실테이블 5개 탭은 실데이터 읽기로, 분석/배너 탭은 데모로 구현한다.

**Architecture:** Next 16 App Router. `app/admin/*` 실제 라우트 + 서버컴포넌트 우선. 읽기는 쿠키 인증 Supabase 서버 클라이언트(운영 원격 프로젝트 동일). 인터랙션(로그인·편집·토글·배너)만 client 컴포넌트로 분리. `src/middleware.ts`가 `/admin/*` 세션 게이팅. 쓰기 배선·분석 인프라·배너 영속화는 이번 범위 밖.

**Tech Stack:** Next 16, React 19, TypeScript strict, Tailwind v4(@theme 토큰), `@supabase/ssr`, zod(차후 쓰기), vitest + @testing-library, isomorphic-dompurify(배너 HTML 새니타이즈).

**참조 소스(마크업·카피의 source of truth):** `~/Downloads/design_handoff_admin_dashboard/reference/AdminDashboard.dc.html` (각 탭 `sc-if` 블록·`renderVals()`), `README.md`. 토큰: `src/app/globals.css`. 재사용 컴포넌트: `src/components/ui/{Button,Field,Badge,Card}.tsx`, 아이콘 `src/components/icons/index.tsx`, 로고 `public/logo/logo-primary.png`.

**스펙:** `docs/superpowers/specs/2026-06-18-admin-dashboard-design.md`

---

## 데이터 현실 메모 (계획 전제)

- `course`에는 `capacity`/`start_date` 컬럼이 **없다**. 읽기 대상은 `id, name, recruit_status`. 정원·개강일 입력칸은 로컬 state UI(빈값 시작, 이번엔 미영속).
- `application`에 나이 컬럼 **없음**. 핸드오프의 "· 52" 나이 표기는 생략. 과정은 `selected_courses[0]`.
- `inquiry.status`(답변대기/답변완료) → 화면 라벨 신규/완료로 매핑. interest는 `category`(국비지원/과정문의/기타).
- PII 마스킹: 이름·전화는 매퍼에서 마스킹.

## File Structure

생성:
- `src/lib/admin/mask.ts` — 이름/전화 마스킹 순수함수
- `src/lib/admin/banner.ts` — 배너 템플릿 파서 + 기본 배너 팩토리 + 타입
- `src/lib/queries/admin.ts` — 관리자 읽기 쿼리 + 뷰 매퍼
- `src/lib/supabase/middleware.ts` — 미들웨어 세션 갱신 헬퍼
- `src/middleware.ts` — `/admin/*` 게이팅
- `src/app/admin/layout.tsx` — 셸(서버: 카운트 조회) + `AdminShell` 래핑
- `src/app/admin/AdminShell.tsx` — client: 사이드바/탑바/모바일 드로어/active nav
- `src/app/admin/nav.ts` — 탭 메타(경로·라벨·아이콘·title·desc) 단일 소스
- `src/app/admin/page.tsx` — 대시보드(overview)
- `src/app/admin/loading.tsx`, `src/app/admin/error.tsx`
- `src/app/admin/login/page.tsx`, `src/app/admin/login/LoginForm.tsx`
- `src/app/admin/logout/route.ts`
- `src/app/admin/clicks/page.tsx`
- `src/app/admin/enroll/page.tsx`
- `src/app/admin/consult/page.tsx`
- `src/app/admin/courses/page.tsx`, `src/app/admin/courses/CourseEditor.tsx`
- `src/app/admin/banner/page.tsx`, `src/app/admin/banner/BannerManager.tsx`
- `src/app/admin/photos/page.tsx`
- `src/app/admin/notice/page.tsx`, `src/app/admin/notice/NoticeCompose.tsx`
- `src/components/admin/{KpiCard,StatusChip,FilterPills,ProgressBar,EmptyState,SectionCard}.tsx`
- 테스트: `src/lib/admin/mask.test.ts`, `src/lib/admin/banner.test.ts`, `src/lib/queries/admin.test.ts`

수정:
- `package.json` (isomorphic-dompurify 추가)
- `.env.local.example` (관리자 계정 발급 안내 주석 — 선택)

---

## Task 1: 의존성 추가 (DOMPurify)

**Files:** Modify `package.json`

- [ ] **Step 1: 설치**

Run: `pnpm add isomorphic-dompurify`
Expected: package.json dependencies에 `isomorphic-dompurify` 추가, 설치 성공.

- [ ] **Step 2: 커밋**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: 배너 HTML 새니타이즈용 isomorphic-dompurify 추가"
```

---

## Task 2: PII 마스킹 유틸 (TDD)

**Files:**
- Create: `src/lib/admin/mask.ts`
- Test: `src/lib/admin/mask.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// src/lib/admin/mask.test.ts
import { describe, it, expect } from "vitest";
import { maskName, maskPhone } from "./mask";

describe("maskName", () => {
  it("가운데 글자를 O로 가린다(3글자)", () => {
    expect(maskName("김지희")).toBe("김O희");
  });
  it("2글자는 마지막을 가린다", () => {
    expect(maskName("김희")).toBe("김O");
  });
  it("4글자 이상은 가운데를 모두 가린다", () => {
    expect(maskName("남궁민수")).toBe("남OO수");
  });
  it("빈/한 글자는 그대로", () => {
    expect(maskName("김")).toBe("김");
    expect(maskName("")).toBe("");
  });
});

describe("maskPhone", () => {
  it("마지막 4자리를 가린다", () => {
    expect(maskPhone("010-1234-5678")).toBe("010-1234-••••");
  });
  it("하이픈 없는 입력도 정규화해 가린다", () => {
    expect(maskPhone("01012345678")).toBe("010-1234-••••");
  });
  it("형식 불명은 끝 4자만 가린다", () => {
    expect(maskPhone("12345")).toBe("1••••");
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test src/lib/admin/mask.test.ts`
Expected: FAIL (모듈/함수 없음).

- [ ] **Step 3: 최소 구현**

```ts
// src/lib/admin/mask.ts
/** 이름 가운데를 O로 마스킹. 김지희 → 김O희 */
export function maskName(name: string): string {
  const n = name.trim();
  if (n.length <= 1) return n;
  if (n.length === 2) return `${n[0]}O`;
  return `${n[0]}${"O".repeat(n.length - 2)}${n[n.length - 1]}`;
}

/** 전화 뒤 4자리 마스킹. 01012345678 → 010-1234-•••• */
export function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-••••`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-••••`;
  if (d.length > 4) return `${d.slice(0, d.length - 4)}••••`;
  return `${d.slice(0, 1)}••••`;
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm test src/lib/admin/mask.test.ts`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/admin/mask.ts src/lib/admin/mask.test.ts
git commit -m "feat: 관리자 PII 마스킹 유틸(이름·전화)"
```

---

## Task 3: 관리자 읽기 매퍼 (TDD)

DB Row → 화면 뷰 변환 + 상태 라벨 매핑. 순수함수만 테스트(네트워크 제외).

**Files:**
- Create: `src/lib/queries/admin.ts` (이 태스크에서는 매퍼·타입·상태매핑만; 조회 함수는 Task 4)
- Test: `src/lib/queries/admin.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// src/lib/queries/admin.test.ts
import { describe, it, expect } from "vitest";
import {
  toEnrollmentView,
  toInquiryView,
  inquiryStatusLabel,
  countPending,
  countNewInquiries,
} from "./admin";

const appRow = {
  id: 1, name: "김지희", phone: "01012345678",
  selected_courses: ["목공 기초 종합반", "집수리 실무반"],
  status: "신규" as const, created_at: "2026-06-15T02:00:00Z",
};

describe("toEnrollmentView", () => {
  it("이름·전화 마스킹 + 첫 과정 + 날짜 포맷", () => {
    const v = toEnrollmentView(appRow);
    expect(v.name).toBe("김O희");
    expect(v.phone).toBe("010-1234-••••");
    expect(v.course).toBe("목공 기초 종합반");
    expect(v.date).toBe("2026.06.15");
    expect(v.status).toBe("신규");
  });
});

describe("inquiryStatusLabel", () => {
  it("답변대기→신규, 답변완료→완료", () => {
    expect(inquiryStatusLabel("답변대기")).toBe("신규");
    expect(inquiryStatusLabel("답변완료")).toBe("완료");
  });
});

describe("toInquiryView", () => {
  it("마스킹 + 라벨 매핑 + interest=category", () => {
    const v = toInquiryView({
      id: 9, name: "박민수", phone: "01055556666",
      category: "국비지원" as const, course_id: null,
      content: "문의합니다", status: "답변대기" as const,
      created_at: "2026-06-17T05:00:00Z",
    });
    expect(v.name).toBe("박O수");
    expect(v.phone).toBe("010-5555-••••");
    expect(v.interest).toBe("국비지원");
    expect(v.status).toBe("신규");
    expect(v.message).toBe("문의합니다");
  });
});

describe("카운트 도출", () => {
  it("countPending = status '신규' 개수", () => {
    expect(countPending([{ status: "신규" }, { status: "상담중" }, { status: "신규" }])).toBe(2);
  });
  it("countNewInquiries = '답변대기' 개수", () => {
    expect(countNewInquiries([{ status: "답변대기" }, { status: "답변완료" }])).toBe(1);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test src/lib/queries/admin.test.ts`
Expected: FAIL (함수 없음).

- [ ] **Step 3: 최소 구현 (매퍼/타입/상태매핑/카운트만)**

```ts
// src/lib/queries/admin.ts
import { maskName, maskPhone } from "@/lib/admin/mask";
import type { Database } from "@/lib/supabase/database.types";

type ApplicationRow = Database["public"]["Tables"]["application"]["Row"];
type InquiryRow = Database["public"]["Tables"]["inquiry"]["Row"];

export type EnrollStatus = Database["public"]["Enums"]["application_status"]; // 신규/상담중/등록확인/보류

export interface EnrollmentView {
  id: number;
  name: string;
  course: string;
  phone: string;
  date: string;
  status: EnrollStatus;
}

export interface InquiryView {
  id: number;
  name: string;
  phone: string;
  interest: string;
  message: string;
  date: string;
  status: "신규" | "완료";
}

/** ISO → "YYYY.MM.DD" (KST 기준 단순 포맷) */
function fmtDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export function toEnrollmentView(
  r: Pick<ApplicationRow, "id" | "name" | "phone" | "selected_courses" | "status" | "created_at">,
): EnrollmentView {
  return {
    id: r.id,
    name: maskName(r.name),
    course: r.selected_courses[0] ?? "-",
    phone: maskPhone(r.phone),
    date: fmtDate(r.created_at),
    status: r.status,
  };
}

export function inquiryStatusLabel(s: InquiryRow["status"]): "신규" | "완료" {
  return s === "답변완료" ? "완료" : "신규";
}

export function toInquiryView(
  r: Pick<InquiryRow, "id" | "name" | "phone" | "category" | "course_id" | "content" | "status" | "created_at">,
): InquiryView {
  return {
    id: r.id,
    name: maskName(r.name),
    phone: maskPhone(r.phone),
    interest: r.course_id ?? r.category,
    message: r.content,
    date: fmtDate(r.created_at),
    status: inquiryStatusLabel(r.status),
  };
}

export function countPending(rows: { status: EnrollStatus }[]): number {
  return rows.filter((r) => r.status === "신규").length;
}

export function countNewInquiries(rows: { status: InquiryRow["status"] }[]): number {
  return rows.filter((r) => r.status === "답변대기").length;
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm test src/lib/queries/admin.test.ts`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/queries/admin.ts src/lib/queries/admin.test.ts
git commit -m "feat: 관리자 읽기 매퍼·상태매핑·카운트 도출(테스트 포함)"
```

---

## Task 4: 관리자 조회 함수 (서버, Supabase 실연결)

매퍼 위에 실제 Supabase 조회 함수 추가. 쿠키 인증 서버 클라이언트 사용(authenticated RLS).

**Files:** Modify `src/lib/queries/admin.ts` (append)

- [ ] **Step 1: 조회 함수 추가**

```ts
// src/lib/queries/admin.ts 하단에 추가
import { createClient } from "@/lib/supabase/server";

export async function getEnrollments(): Promise<EnrollmentView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("application")
    .select("id,name,phone,selected_courses,status,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toEnrollmentView);
}

export async function getInquiries(): Promise<InquiryView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inquiry")
    .select("id,name,phone,category,course_id,content,status,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toInquiryView);
}

export interface AdminCourseView {
  id: string;
  name: string;
  open: boolean; // recruit_status === '모집중'
  recruitStatus: Database["public"]["Enums"]["recruit_status"];
}

export async function getAdminCourses(): Promise<AdminCourseView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course")
    .select("id,name,recruit_status")
    .eq("is_deleted", false)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    open: c.recruit_status === "모집중",
    recruitStatus: c.recruit_status,
  }));
}

export interface AdminPhotoView { id: number; label: string; image: string | null; }

export async function getTrainingPhotos(): Promise<AdminPhotoView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("post")
    .select("id,title,images,category,is_published,is_deleted,created_at")
    .eq("category", "훈련사진")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((p) => ({ id: p.id, label: p.title, image: p.images[0] ?? null }));
}

export interface AdminNoticeView { id: number; title: string; body: string; date: string; pinned: boolean; }

export async function getAdminNotices(): Promise<AdminNoticeView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notice")
    .select("id,title,body,is_pinned,is_deleted,published_at,created_at")
    .eq("is_deleted", false)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((n) => ({
    id: n.id, title: n.title, body: n.body,
    date: fmtDate(n.published_at ?? n.created_at), pinned: n.is_pinned,
  }));
}

/** 사이드바 카운트 + overview KPI용 집계 */
export async function getSidebarCounts(): Promise<{ pending: number; newInquiries: number }> {
  const supabase = await createClient();
  const [{ count: pending }, { count: newInquiries }] = await Promise.all([
    supabase.from("application").select("id", { count: "exact", head: true }).eq("status", "신규"),
    supabase.from("inquiry").select("id", { count: "exact", head: true }).eq("status", "답변대기"),
  ]);
  return { pending: pending ?? 0, newInquiries: newInquiries ?? 0 };
}

export async function getOpenCourseCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("course").select("id", { count: "exact", head: true })
    .eq("is_deleted", false).eq("recruit_status", "모집중");
  return count ?? 0;
}
```

- [ ] **Step 2: 타입체크**

Run: `pnpm exec tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add src/lib/queries/admin.ts
git commit -m "feat: 관리자 조회 함수(신청·문의·과정·사진·공지·카운트)"
```

---

## Task 5: 인증 미들웨어 + 세션 헬퍼

**Files:**
- Create: `src/lib/supabase/middleware.ts`, `src/middleware.ts`

참고: 새 Next 버전 동작은 `node_modules/next/dist/docs/`의 middleware 문서를 먼저 확인할 것(AGENTS.md 지침).

- [ ] **Step 1: 세션 갱신 헬퍼 작성**

```ts
// src/lib/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";

/**
 * /admin/* 요청의 세션을 갱신하고 인증 여부에 따라 리다이렉트.
 * 미인증 + 로그인페이지 아님 → /admin/login
 * 인증됨 + 로그인페이지 → /admin
 */
export async function updateAdminSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isLogin = path === "/admin/login";

  if (!user && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }
  if (user && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }
  return response;
}
```

- [ ] **Step 2: 미들웨어 작성**

```ts
// src/middleware.ts
import type { NextRequest } from "next/server";
import { updateAdminSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateAdminSession(request);
}

// /admin 과 그 하위만 가로챈다(정적 자원 제외).
export const config = {
  matcher: ["/admin/:path*"],
};
```

- [ ] **Step 3: 타입체크 + 빌드 확인**

Run: `pnpm exec tsc --noEmit`
Expected: 에러 없음. (런타임 검증은 Task 7 로그인 화면 후 수동 확인)

- [ ] **Step 4: 커밋**

```bash
git add src/lib/supabase/middleware.ts src/middleware.ts
git commit -m "feat: /admin 세션 게이팅 미들웨어"
```

---

## Task 6: 로그인 화면 + 로그아웃

핸드오프 "A. Login" 섹션(README 66–72행, reference의 login `sc-if` 블록) 1:1 재현.

**Files:**
- Create: `src/app/admin/login/page.tsx`, `src/app/admin/login/LoginForm.tsx`, `src/app/admin/logout/route.ts`

- [ ] **Step 1: LoginForm (client)**

```tsx
// src/app/admin/login/LoginForm.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setErr(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setLoading(false);
    if (error) {
      setErr("아이디 또는 비밀번호가 올바르지 않습니다.");
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <div
      onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
      className="flex flex-col gap-4"
    >
      <Field
        label="아이디(이메일)" type="email" value={email}
        onChange={(e) => setEmail(e.target.value)} autoComplete="username"
      />
      <Field
        label="비밀번호" type="password" value={pw}
        onChange={(e) => setPw(e.target.value)} autoComplete="current-password"
      />
      {err && <p className="text-[14px] text-error">{err}</p>}
      <Button fullWidth size="lg" onClick={submit} disabled={loading}>
        {loading ? "로그인 중…" : "로그인"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: login/page.tsx (서버, 핸드오프 카드 레이아웃)**

```tsx
// src/app/admin/login/page.tsx
import Image from "next/image";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "관리자 로그인 · 성요셉목수학교" };

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-canvas-soft p-6">
      <div
        className="relative w-full max-w-[430px] bg-white rounded-xl border border-hairline overflow-hidden"
        style={{ padding: "44px 40px 40px", boxShadow: "0 12px 32px rgba(28,26,24,.10)" }}
      >
        <div
          aria-hidden
          className="absolute pointer-events-none rounded-full"
          style={{ width: 280, height: 280, top: -140, right: -100, filter: "blur(60px)", opacity: 0.5, background: "var(--color-gradient-sky)" }}
        />
        <div className="relative flex flex-col gap-3">
          <Image src="/logo/logo-primary.png" alt="성요셉목수학교" width={160} height={40} style={{ height: 40, width: "auto" }} priority />
          <span className="self-start text-[13px] font-semibold text-primary bg-primary-soft rounded-full px-3 py-1">운영 관리 시스템</span>
          <h1 className="text-[28px] font-bold text-ink">관리자 로그인</h1>
          <p className="text-[15px] text-muted">학원 운영 현황과 신청·상담을 관리합니다.</p>
          <div className="mt-2"><LoginForm /></div>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: logout route**

```ts
// src/app/admin/logout/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/admin/login", request.url));
}
```

- [ ] **Step 4: 수동 검증 (실 Supabase 계정 필요)**

Supabase 대시보드 → Authentication → Users에서 관리자 계정 1개 생성(이메일/비번).
Run: `pnpm dev` → `/admin` 접근 → `/admin/login`으로 리다이렉트되는지, 로그인 성공 시 `/admin`(아직 빈 페이지/다음 태스크)로 가는지 확인.
Expected: 미인증 리다이렉트 동작, 로그인 성공 시 세션 쿠키 발급.

- [ ] **Step 5: 커밋**

```bash
git add src/app/admin/login src/app/admin/logout
git commit -m "feat: 관리자 로그인 화면과 로그아웃"
```

---

## Task 7: 탭 메타 + 셸 레이아웃 + 재사용 컴포넌트

핸드오프 "B. Dashboard" 셸(README 74–96행). 사이드바 8항목·탑바·모바일 드로어.

**Files:**
- Create: `src/app/admin/nav.ts`, `src/app/admin/AdminShell.tsx`, `src/app/admin/layout.tsx`, `src/app/admin/loading.tsx`, `src/app/admin/error.tsx`
- Create: `src/components/admin/{SectionCard,StatusChip,FilterPills,ProgressBar,EmptyState,KpiCard}.tsx`

- [ ] **Step 1: nav.ts (탭 단일 소스)**

```ts
// src/app/admin/nav.ts
export interface AdminTab {
  key: string;
  href: string;
  label: string;
  title: string;
  desc: string;
  countKey?: "pending" | "newInquiries";
}

export const ADMIN_TABS: AdminTab[] = [
  { key: "overview", href: "/admin", label: "대시보드", title: "대시보드", desc: "학원 운영 현황 요약" },
  { key: "clicks", href: "/admin/clicks", label: "과정별 클릭률", title: "과정별 클릭률", desc: "과정 상세 페이지 클릭·전환" },
  { key: "enroll", href: "/admin/enroll", label: "수강신청 현황", title: "수강신청 현황", desc: "수강신청·가등록 접수 내역", countKey: "pending" },
  { key: "consult", href: "/admin/consult", label: "상담문의", title: "상담문의 현황", desc: "상담 문의 접수 내역", countKey: "newInquiries" },
  { key: "course", href: "/admin/courses", label: "과정 수정", title: "과정 수정", desc: "과정 정보·모집상태 관리" },
  { key: "banner", href: "/admin/banner", label: "배너 관리", title: "배너 관리", desc: "홈 히어로 배너 슬라이드 관리" },
  { key: "photo", href: "/admin/photos", label: "훈련 사진", title: "훈련 사진 업로드", desc: "훈련 현장 사진 관리" },
  { key: "notice", href: "/admin/notice", label: "공지사항", title: "공지사항 게시판", desc: "공지 작성·관리" },
];
```

- [ ] **Step 2: 재사용 컴포넌트 (작은 프레젠테이션)**

`src/components/admin/SectionCard.tsx` — 제목+옵션 액션을 가진 카드 래퍼(기존 `Card` 위에).
`src/components/admin/StatusChip.tsx` — 상태 문자열 → 톤 매핑 칩(기존 `Badge` 위에): 모집중/승인/완료=success, 마감/취소=neutral, 신규/대기=solid, 보류=neutral.
`src/components/admin/FilterPills.tsx` — 정적 필터 pill 행(active 1개 primary, 나머지 outline). props: `items: string[]`, `active: string`.
`src/components/admin/ProgressBar.tsx` — props `pct:number`, `thick?:boolean`; track `bg-hairline-soft`, fill `bg-primary`.
`src/components/admin/EmptyState.tsx` — props `message:string`; 가운데 정렬 안내(아이콘+문구). 내부용이므로 상담CTA 없음.
`src/components/admin/KpiCard.tsx` — props `label, value, delta?, icon`; 핸드오프 KPI 카드(README 104행).

각 컴포넌트는 reference의 해당 클래스(`.b-*`, KPI 카드, 진행바)를 토큰으로 옮긴다. 구현 시 reference의 정확한 패딩·폰트 크기(README "Typography"·"Radii" 절) 준수.

- [ ] **Step 3: AdminShell.tsx (client)**

요구사항:
- props: `tabs: AdminTab[]`, `counts: { pending: number; newInquiries: number }`, `children`.
- `usePathname()`로 active 판정(정확 일치 또는 하위경로).
- 사이드바: width 252px, 로고(`logo-primary.png` h36), nav 8항목(README 79–84행 스타일). active=primary-soft/primary/600. `countKey` 있으면 count>0일 때 trailing solid pill.
- 하단 로그아웃 버튼 → `<form method="post" action="/admin/logout">` 제출(hover error-soft).
- 탑바: 스티키, 좌측 현재 탭 title/desc, 우측 날짜("2026. 06. 18 (목)", `<md` 숨김) + 아바타 pill("관"/"관리자").
- `<lg`(1000px): 사이드바 오프캔버스(translate-x), 탑바 햄버거 토글, 오버레이 클릭 닫기. `useState(open)`.
- title/desc는 active 탭 메타에서.

- [ ] **Step 4: layout.tsx (서버 — 카운트 조회 + 로그인경로 분기)**

```tsx
// src/app/admin/layout.tsx
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { AdminShell } from "./AdminShell";
import { ADMIN_TABS } from "./nav";
import { getSidebarCounts } from "@/lib/queries/admin";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // 로그인 페이지는 셸 없이 렌더(미들웨어가 인증 분기). 경로는 헤더로 판별.
  const h = await headers();
  const pathname = h.get("x-pathname") ?? h.get("next-url") ?? "";
  if (pathname.startsWith("/admin/login")) {
    return <>{children}</>;
  }
  const counts = await getSidebarCounts();
  return (
    <AdminShell tabs={ADMIN_TABS} counts={counts}>
      {children}
    </AdminShell>
  );
}
```

주의: Next 16에서 layout이 현재 경로를 직접 알기 어려우면, 대안으로 **login을 별도 route group**으로 분리해 셸 밖에 둔다 — `src/app/admin/(auth)/login/page.tsx` + `src/app/admin/(dashboard)/layout.tsx`. 구현 중 `headers()`로 경로 판별이 불안정하면 이 route group 방식으로 전환할 것. (권장: route group 방식이 더 견고.)

- [ ] **Step 5: loading.tsx / error.tsx**

```tsx
// src/app/admin/loading.tsx
export default function Loading() {
  return <div className="p-7"><div className="h-8 w-48 bg-hairline-soft rounded animate-pulse" /></div>;
}
```
```tsx
// src/app/admin/error.tsx
"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-7 flex flex-col gap-3 items-start">
      <p className="text-body">데이터를 불러오지 못했습니다.</p>
      <button onClick={reset} className="text-primary font-semibold">다시 시도</button>
    </div>
  );
}
```

- [ ] **Step 6: 검증**

Run: `pnpm exec tsc --noEmit && pnpm dev`
수동: 로그인 후 `/admin` 셸(사이드바·탑바) 표시, nav 클릭 시 active 이동, 모바일 폭에서 드로어 동작.

- [ ] **Step 7: 커밋**

```bash
git add src/app/admin/nav.ts src/app/admin/AdminShell.tsx src/app/admin/layout.tsx src/app/admin/loading.tsx src/app/admin/error.tsx src/components/admin
git commit -m "feat: 관리자 셸(사이드바·탑바·모바일 드로어)과 공통 컴포넌트"
```

---

## Task 8: 수강신청 현황 탭 (읽기)

핸드오프 "3. enroll"(README 113–116행). 테이블 카드.

**Files:** Create `src/app/admin/enroll/page.tsx`

- [ ] **Step 1: page.tsx (서버)**

```tsx
// src/app/admin/enroll/page.tsx
import { getEnrollments } from "@/lib/queries/admin";
import { SectionCard } from "@/components/admin/SectionCard";
import { StatusChip } from "@/components/admin/StatusChip";
import { FilterPills } from "@/components/admin/FilterPills";
import { EmptyState } from "@/components/admin/EmptyState";

export default async function EnrollPage() {
  const rows = await getEnrollments();
  return (
    <div className="flex flex-col gap-5">
      <FilterPills items={["전체", "대기", "승인", "취소"]} active="전체" />
      <SectionCard padding={0}>
        {rows.length === 0 ? (
          <EmptyState message="아직 수강신청 내역이 없습니다." />
        ) : (
          <div>
            {/* 헤더 grid: 1.4fr 1.6fr 1.3fr 0.8fr 0.9fr / bg canvas-soft */}
            <div className="hidden md:grid px-5 py-3 bg-canvas-soft text-[13px] font-semibold text-muted"
                 style={{ gridTemplateColumns: "1.4fr 1.6fr 1.3fr 0.8fr 0.9fr" }}>
              <span>신청자</span><span>과정</span><span>연락처</span><span>신청일</span><span className="text-right">상태</span>
            </div>
            {rows.map((r) => (
              <div key={r.id}
                   className="grid items-center px-5 py-4 border-t border-hairline-soft text-[15px]"
                   style={{ gridTemplateColumns: "1.4fr 1.6fr 1.3fr 0.8fr 0.9fr" }}>
                <span className="font-semibold text-ink">{r.name}</span>
                <span className="text-body">{r.course}</span>
                <span className="text-body">{r.phone}</span>
                <span className="text-muted">{r.date}</span>
                <span className="text-right"><StatusChip status={r.status} /></span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
```

- [ ] **Step 2: 검증**

Run: `pnpm dev` → `/admin/enroll`. 실 데이터/빈 상태 확인. `pnpm exec tsc --noEmit` 통과.

- [ ] **Step 3: 커밋**

```bash
git add src/app/admin/enroll
git commit -m "feat: 수강신청 현황 탭(실데이터 읽기)"
```

---

## Task 9: 상담문의 탭 (읽기)

핸드오프 "4. consult"(README 117–118행). 문의 카드 스택.

**Files:** Create `src/app/admin/consult/page.tsx`

- [ ] **Step 1: page.tsx (서버)**

```tsx
// src/app/admin/consult/page.tsx
import { getInquiries } from "@/lib/queries/admin";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Phone } from "@/components/icons";
import { EmptyState } from "@/components/admin/EmptyState";

export default async function ConsultPage() {
  const rows = await getInquiries();
  if (rows.length === 0) return <EmptyState message="접수된 상담 문의가 없습니다." />;
  return (
    <div className="flex flex-col gap-[14px]">
      {rows.map((q) => (
        <Card key={q.id} padding={20}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[16px] font-bold text-ink">{q.name}</span>
            <span className="text-muted text-[14px]">{q.phone}</span>
            <span className="text-[12px] font-semibold text-primary bg-primary-soft rounded-full px-2.5 py-1">{q.interest}</span>
            <span className="ml-auto">
              <Badge tone={q.status === "신규" ? "solid" : "neutral"}>{q.status}</Badge>
            </span>
          </div>
          <p className="mt-3 text-body text-[15px] leading-[1.6]">{q.message}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-muted-soft text-[13px] mr-auto">{q.date}</span>
            <Button size="sm" leftIcon={<Phone width={15} height={15} />}>전화 상담</Button>
            <Button size="sm" variant="outline">완료 처리</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
```
(전화/완료 버튼은 이번엔 비배선 — 다음 PR에서 `tel:` 및 상태 mutation 연결.)

- [ ] **Step 2: 검증 + 커밋**

Run: `pnpm dev` → `/admin/consult` 확인, `pnpm exec tsc --noEmit`.
```bash
git add src/app/admin/consult
git commit -m "feat: 상담문의 현황 탭(실데이터 읽기)"
```

---

## Task 10: 과정 수정 탭 (읽기 + 로컬 편집 UI)

핸드오프 "5. course"(README 120–121행). 읽기는 서버, 편집은 client 로컬 state.

**Files:** Create `src/app/admin/courses/page.tsx`, `src/app/admin/courses/CourseEditor.tsx`

- [ ] **Step 1: page.tsx (서버 → 데이터 전달)**

```tsx
// src/app/admin/courses/page.tsx
import { getAdminCourses } from "@/lib/queries/admin";
import { CourseEditor } from "./CourseEditor";
import { EmptyState } from "@/components/admin/EmptyState";

export default async function CoursesPage() {
  const courses = await getAdminCourses();
  if (courses.length === 0) return <EmptyState message="등록된 과정이 없습니다." />;
  return <CourseEditor initial={courses} />;
}
```

- [ ] **Step 2: CourseEditor.tsx (client, 로컬 state)**

요구사항(README 121행):
- props `initial: AdminCourseView[]`. `useState`로 편집 상태 보유(name, capacity, start, open per 과정).
- 카드별: 헤더 "과정 #{id}" + 모집중/마감 토글 pill(모집중=success-soft/녹점, 마감=surface-strong/회점) → `toggle` 로컬.
- 본문 grid `2fr 1fr 1.3fr`: 과정명 / 정원 / 개강일 (controlled `Field`). 정원·개강일은 DB에 없으므로 빈값 시작(이번엔 미영속).
- 푸터 "저장" primary 버튼 = 프레젠테이션(다음 PR 배선). 클릭 시 토스트/콘솔 정도.
- `import type { AdminCourseView } from "@/lib/queries/admin";`

- [ ] **Step 3: 검증 + 커밋**

Run: `pnpm dev` → `/admin/courses` 토글·입력 동작, `pnpm exec tsc --noEmit`.
```bash
git add src/app/admin/courses
git commit -m "feat: 과정 수정 탭(읽기 + 로컬 편집 UI)"
```

---

## Task 11: 훈련 사진 탭 (읽기)

핸드오프 "7. photo"(README 153–155행).

**Files:** Create `src/app/admin/photos/page.tsx`

- [ ] **Step 1: page.tsx (서버)**

요구사항:
- `getTrainingPhotos()` 결과로 갤러리 그리드(`<md` 2열 / `>=md` 3열), 타일 `aspect-[4/3]` radius 14px.
- `image` 있으면 `next/image`로, 없으면 대각선 줄무늬 placeholder bg(README "Banner preview tints"의 stripe).
- 타일 좌하단 파일명 chip(label), 우상단 원형 삭제버튼(hover error) — 삭제는 비배선(다음 PR).
- 상단 dashed 업로드 dropzone(primary-softer) "사진을 끌어다 놓거나 클릭해서 업로드 · JPG·PNG 최대 10MB" — 클릭/드롭은 비배선.
- 빈 갤러리도 dropzone는 표시.

- [ ] **Step 2: 검증 + 커밋**

Run: `pnpm dev` → `/admin/photos`, `pnpm exec tsc --noEmit`.
```bash
git add src/app/admin/photos
git commit -m "feat: 훈련 사진 탭(실데이터 읽기)"
```

---

## Task 12: 공지 탭 (읽기 + 로컬 작성 UI)

핸드오프 "8. notice"(README 157–160행). 2단(작성폼 + 목록).

**Files:** Create `src/app/admin/notice/page.tsx`, `src/app/admin/notice/NoticeCompose.tsx`

- [ ] **Step 1: page.tsx (서버)**

```tsx
// src/app/admin/notice/page.tsx
import { getAdminNotices } from "@/lib/queries/admin";
import { NoticeCompose } from "./NoticeCompose";

export default async function NoticePage() {
  const notices = await getAdminNotices();
  return <NoticeCompose initial={notices} />;
}
```

- [ ] **Step 2: NoticeCompose.tsx (client, 2단 + 로컬 state)**

요구사항(README 158–160행):
- props `initial: AdminNoticeView[]`. `useState`로 목록·제목·내용.
- 레이아웃 `.admin-2col`: `<lg` 1열(작성폼 먼저, order) / `>=lg` `1.35fr 1fr` (작성폼 우측 sticky).
- 작성: H2 "새 공지 작성" + 제목 `Field` + 내용 `Field as="textarea"` rows 5 + "공지 등록" fullWidth primary. `addNotice`가 오늘 날짜로 prepend(빈 제목 무시). **로컬 state만(미영속, 다음 PR 배선).**
- 목록: 카드별 고정(pinned) pill + 제목(16/700) + 삭제버튼(로컬 filter) + 본문 + 날짜.
- `import type { AdminNoticeView } from "@/lib/queries/admin";`

- [ ] **Step 3: 검증 + 커밋**

Run: `pnpm dev` → `/admin/notice` 작성/삭제(로컬) 동작, `pnpm exec tsc --noEmit`.
```bash
git add src/app/admin/notice
git commit -m "feat: 공지 탭(읽기 + 로컬 작성 UI)"
```

---

## Task 13: 대시보드(overview) + 클릭률 탭 (데모 + 실집계 혼합)

핸드오프 "1. overview"(README 103–108행), "2. clicks"(109–112행).

**Files:** Create `src/app/admin/page.tsx`, `src/app/admin/clicks/page.tsx`

- [ ] **Step 1: 데모 상수 정의 (page 내부 또는 nav 옆 모듈)**

```ts
// overview/clicks 공용 데모 데이터 (분석 인프라 도입 전까지)
export const DEMO_KPI = { visitors: 342, visitorsDelta: "▲12% 어제 대비", enroll: 58, enrollDelta: "▲8건", consult: 7, consultNew: "신규 3건 대기 중" };
export const DEMO_COURSE_CLICKS = [
  { name: "목공 기초 종합반", clicks: 1240, conv: "전환 42", pct: 100 },
  { name: "집수리 실무반", clicks: 980, conv: "전환 31", pct: 79 },
  { name: "인테리어 시공반", clicks: 870, conv: "전환 27", pct: 70 },
  { name: "가구제작 심화반", clicks: 540, conv: "전환 12", pct: 44 },
  { name: "목공기능사 자격대비반", clicks: 410, conv: "전환 9", pct: 33 },
];
```
(위치: `src/app/admin/demo.ts`로 두고 두 페이지에서 import.)

- [ ] **Step 2: overview page.tsx (서버 — KPI 데모 + 실집계 혼합)**

요구사항(README 104·107행):
- KPI 4카드: 오늘 방문자 `DEMO_KPI.visitors`(데모), 이번 달 수강신청 `DEMO_KPI.enroll`(데모), 상담 대기 `DEMO_KPI.consult`(데모), **모집 중 과정 `await getOpenCourseCount()`개**(실집계, "전체 N개 중"의 전체는 `getAdminCourses().length`).
- 2단 below: ① "과정별 클릭률 TOP 5" 카드(데모 `DEMO_COURSE_CLICKS`, `ProgressBar`) + "자세히 →"(→ /admin/clicks). ② "최근 수강신청" 카드 = `(await getEnrollments()).slice(0,4)` (실데이터, 이니셜 아바타+이름+과정+StatusChip) + "전체 →"(→ /admin/enroll).
- KPI 그리드 `<md` 2열 / `>=md` 4열.

- [ ] **Step 3: clicks page.tsx (데모)**

요구사항(README 110–112행):
- 필터 pill 행 "최근 30일"(active) "최근 7일" "전체"(정적, `FilterPills`).
- 카드: H2 "과정 상세 페이지 클릭 & 전환" + sub. 과정별: 이름 + "**{clicks}** 클릭 · {conv}" + 14px 두꺼운 `ProgressBar pct thick`. 데이터 `DEMO_COURSE_CLICKS`.

- [ ] **Step 4: 검증 + 커밋**

Run: `pnpm dev` → `/admin`, `/admin/clicks`. `pnpm exec tsc --noEmit`.
```bash
git add src/app/admin/page.tsx src/app/admin/clicks src/app/admin/demo.ts
git commit -m "feat: 대시보드·클릭률 탭(KPI 데모 + 모집중/최근신청 실집계)"
```

---

## Task 14: 배너 템플릿 파서 (TDD)

핸드오프 "6. banner"(README 123–151행). 먼저 파서/타입/팩토리를 TDD로.

**Files:**
- Create: `src/lib/admin/banner.ts`
- Test: `src/lib/admin/banner.test.ts`

- [ ] **Step 1: 실패하는 테스트**

```ts
// src/lib/admin/banner.test.ts
import { describe, it, expect } from "vitest";
import { parseRows, parseLines, makeDefaultBanner } from "./banner";

describe("parseRows", () => {
  it("'항목 | 가격' 줄을 [label, price]로 파싱", () => {
    expect(parseRows("수강료 | 0원\n교재비 | 5만원")).toEqual([
      ["수강료", "0원"], ["교재비", "5만원"],
    ]);
  });
  it("빈 줄/공백 줄 무시", () => {
    expect(parseRows("a | 1\n\n  \nb | 2")).toEqual([["a", "1"], ["b", "2"]]);
  });
  it("구분자 없으면 가격은 빈 문자열", () => {
    expect(parseRows("항목만")).toEqual([["항목만", ""]]);
  });
});

describe("parseLines", () => {
  it("줄 단위 배열, 빈 줄 제거", () => {
    expect(parseLines("첫째\n둘째\n\n셋째")).toEqual(["첫째", "둘째", "셋째"]);
  });
});

describe("makeDefaultBanner", () => {
  it("center/sky 기본 배너를 고유 id로 생성", () => {
    const b = makeDefaultBanner();
    expect(b.mode).toBe("template");
    expect(b.template).toBe("center");
    expect(b.tint).toBe("sky");
    expect(b.active).toBe(true);
    expect(typeof b.id).toBe("string");
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test src/lib/admin/banner.test.ts`
Expected: FAIL.

- [ ] **Step 3: 구현**

```ts
// src/lib/admin/banner.ts
export type BannerMode = "template" | "image" | "html";
export type BannerTemplate = "price" | "bignum" | "center" | "phone" | "qa";
export type BannerTint = "peach" | "sky" | "lavender" | "mint" | "rose" | "sand" | "blue" | "slate";

export interface Banner {
  id: string;
  active: boolean;
  mode: BannerMode;
  template: BannerTemplate;
  tint: BannerTint;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  rows: string;        // price textarea raw
  big: string;
  bigCaption: string;
  bullets: string;     // phone textarea raw
  phone: string;
  question: string;
  answer: string;
  imgDesktop: string;
  imgMobile: string;
  alt: string;
  link: string;
  html: string;
  htmlLabel: string;
}

/** "항목 | 가격" 줄들을 [label, price][]로 파싱 */
export function parseRows(raw: string): [string, string][] {
  return raw.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const [label, ...rest] = l.split("|");
    return [label.trim(), rest.join("|").trim()] as [string, string];
  });
}

/** 줄 단위 배열(빈 줄 제거) */
export function parseLines(raw: string): string[] {
  return raw.split("\n").map((l) => l.trim()).filter(Boolean);
}

let seq = 0;
export function makeDefaultBanner(): Banner {
  seq += 1;
  return {
    id: `b-${Date.now()}-${seq}`,
    active: true, mode: "template", template: "center", tint: "sky",
    eyebrow: "", title: "새 배너", body: "", cta: "",
    rows: "", big: "", bigCaption: "", bullets: "", phone: "",
    question: "", answer: "", imgDesktop: "", imgMobile: "",
    alt: "", link: "", html: "", htmlLabel: "새 배너",
  };
}

export const BANNER_TINTS: Record<BannerTint, string> = {
  peach: "#f6f2eb", sky: "#eaf1fb", lavender: "#f1eef8", mint: "#e9f5ef",
  rose: "#faeef1", sand: "#f4f1ec", blue: "#eaf0fe", slate: "#eef1f5",
};

export const DEMO_BANNERS: Banner[] = [
  { ...makeDefaultBanner(), template: "center", tint: "peach", title: "수강료 0원", body: "경기도 전액지원 과정", htmlLabel: "수강료 0원" },
  { ...makeDefaultBanner(), template: "center", tint: "sky", title: "신규 과정 모집", body: "7월 개강 과정 안내", htmlLabel: "신규 과정 모집" },
  { ...makeDefaultBanner(), template: "bignum", tint: "lavender", big: "78%", bigCaption: "재취업률", title: "", htmlLabel: "재취업률 78%" },
];
```

> 주의(도메인 규칙 2): `DEMO_BANNERS`의 "재취업률 78%"는 핸드오프 데모 콘텐츠다. 이는 **관리자 배너 편집기의 예시 데이터**일 뿐 공개 사이트에 자동 노출되지 않는다(배너는 미영속). 실제 공개 배너로 쓸 때 취업률 수치 금지 규칙을 운영자가 지켜야 함 — 편집기 HTML/템플릿 경고와 함께 둔다. 데모값이 부담되면 중립 문구로 교체 가능.

- [ ] **Step 4: 통과 확인**

Run: `pnpm test src/lib/admin/banner.test.ts`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/admin/banner.ts src/lib/admin/banner.test.ts
git commit -m "feat: 배너 템플릿 파서·타입·기본 배너 팩토리(테스트 포함)"
```

---

## Task 15: 배너 관리 탭 (데모·로컬 state)

핸드오프 "6. banner"(README 123–151행). 2단(편집기 좌 + 리스트 우 sticky).

**Files:** Create `src/app/admin/banner/page.tsx`, `src/app/admin/banner/BannerManager.tsx`

- [ ] **Step 1: page.tsx (데모 데이터 주입)**

```tsx
// src/app/admin/banner/page.tsx
import { BannerManager } from "./BannerManager";
import { DEMO_BANNERS } from "@/lib/admin/banner";

export default function BannerPage() {
  return <BannerManager initial={DEMO_BANNERS} />;
}
```

- [ ] **Step 2: BannerManager.tsx (client, 로컬 state)**

요구사항(README 124–151행):
- state: `banners: Banner[]`, `selectedId: string | null`.
- **리스트(우, sticky)**: 헤더 "배너 슬라이드" + "{활성 개수}개 노출 중"; "+ 새 배너 추가"(→ `makeDefaultBanner()` append + select). 카드별: 순서번호 틴트 사각 + 제목 + kind 라벨 + on/off 스위치(`.b-switch`, on=primary). 액션 편집/↑/↓/🗑(`moveB ±1` 배열 swap, 삭제 filter+선택해제). 선택 카드 `.is-sel`(primary 보더+링).
- **편집기(좌)**: 미선택 시 dashed empty("편집할 배너를 선택하세요").
  - 모드 스위치 3열 `.b-opt`: 템플릿+폼 / 이미지 업로드 / HTML 직접 (active=`.is-on` primary-soft).
  - 프리뷰 `.bnr-prev`(min-h 236, p 34/36, radius16) 틴트 배경:
    - template: 선택 템플릿 렌더(price/bignum/center/phone/qa).
    - image: 업로드 chip 또는 placeholder(45° stripe).
    - html: **DOMPurify.sanitize 후** `dangerouslySetInnerHTML`. 빈값 → code 아이콘 placeholder. `import DOMPurify from "isomorphic-dompurify";`
  - 폼(모드별):
    - template: 템플릿 picker pill 5종 + 8 틴트 스와치 + "윗줄 배지"(eyebrow) + 템플릿별 필드(price=제목+가격 textarea, bignum=큰숫자+설명+본문, center=제목+본문, phone=제목+안내 textarea+전화번호, qa=질문+답변) + (phone 외) "버튼 문구"(cta).
    - image: 안내 note + 데스크톱(1600×440)·모바일(800×800) dashed 업로드(클릭 시 더미 파일명 set) + alt + 링크.
    - html: 빨간 경고 note(README 146행 문구) + "관리용 이름"(htmlLabel) + "HTML 코드" monospace textarea rows10.
  - 푸터: 삭제(error outline) + 저장하기(primary; 프로토타입은 선택 해제만).
- 모든 필드 편집은 `updB(id, patch)`로 로컬 state 갱신.
- 2단 `.admin-2col`: `<lg` 1열 / `>=lg` `1.35fr 1fr` (편집기 좌, 리스트 우 sticky).

- [ ] **Step 3: 검증**

Run: `pnpm dev` → `/admin/banner`. 추가/선택/토글/순서/삭제/모드전환/필드편집/프리뷰 동작. HTML 모드에 `<script>alert(1)</script>` 입력 시 새니타이즈로 미실행 확인. `pnpm exec tsc --noEmit`.

- [ ] **Step 4: 커밋**

```bash
git add src/app/admin/banner
git commit -m "feat: 배너 관리 탭(데모·로컬 state·HTML 새니타이즈)"
```

---

## Task 16: 최종 점검

- [ ] **Step 1: 린트·타입·테스트**

Run: `pnpm lint && pnpm exec tsc --noEmit && pnpm test`
Expected: 모두 통과.

- [ ] **Step 2: 빌드**

Run: `pnpm build`
Expected: 성공(미들웨어·admin 라우트 포함).

- [ ] **Step 3: 도메인 규칙 재점검(수동 체크리스트)**

- 공개 사이트 무수정(`app/(public)/*` diff 없음).
- 공개 화면에 취업률/개강일/잔여석 노출 없음(관리자 내부만).
- 가입 UI 없음 / 인증은 `/admin`만.
- 배너 HTML 새니타이즈 적용.

- [ ] **Step 4: 커밋(필요 시 자잘한 수정만)**

```bash
git commit -am "chore: 관리자 대시보드 린트·빌드 정리"
```

---

## Self-Review (작성자 점검 결과)

- **스펙 커버리지:** 인증·셸·8탭·상태처리·모바일·테스트·커밋분할 모두 태스크로 매핑됨. KPI/클릭률/배너 데모, 5탭 읽기 실연결 반영.
- **데이터 정합:** `course`에 capacity/start 없음 → 로컬 입력으로 처리(Task 10 명시). `application` 나이 없음 → 생략(Task 3 명시).
- **타입 일관성:** `AdminCourseView`, `EnrollmentView`, `InquiryView`, `AdminPhotoView`, `AdminNoticeView`, `Banner` 모두 정의 위치(Task 3·4·14)와 사용처 일치.
- **미해결 위험:** layout의 현재경로 판별 — `headers()` 불안정 시 route group 분리(Task 7 Step4 대안 명시). 구현자는 route group 방식 우선 고려 권장.
- **범위 밖(다음 PR):** 쓰기 배선·분석 인프라·배너 영속화 — 스펙·Task 16에 명시.
