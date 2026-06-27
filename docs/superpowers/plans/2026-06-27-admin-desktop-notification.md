# admin 데스크탑 알림 (폴링) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** admin 탭이 열려 있는 동안 새 수강신청·상담문의를 ~30초 폴링으로 감지해 OS 데스크탑 알림 + 소리로 운영자에게 알린다.

**Architecture:** RLS상 제출 테이블은 authenticated만 SELECT 가능하므로, 인증을 자체 체크하는 Next 라우트 핸들러(`/api/admin/notifications`)가 마지막 본 시각 이후 새 행을 조회해 PII 없는 알림 아이템(type·id·label)을 반환한다. 라벨 생성은 순수 함수로 분리해 단위 테스트한다. 클라이언트 컴포넌트가 polling → `new Notification()` + Web Audio 비프 + 클릭 이동을 담당하며 admin topbar에 마운트된다.

**Tech Stack:** Next.js(App Router, Next 16 route handler) · TypeScript · Supabase(@supabase/ssr 서버 클라이언트) · Web Notifications API · Web Audio API · vitest

참조 스펙: `docs/superpowers/specs/2026-06-27-admin-desktop-notification-design.md`

---

## File Structure

- Create: `src/lib/admin/notifications.ts` — 순수 라벨 로직 `buildNotificationItems`.
- Create: `src/lib/admin/notifications.test.ts` — 위 함수의 vitest 단위 테스트.
- Create: `src/app/api/admin/notifications/route.ts` — 인증된 GET 폴링 엔드포인트.
- Modify: `src/components/icons/index.tsx` — `Bell` 아이콘 추가.
- Create: `src/components/admin/DesktopNotifier.tsx` — 토글 UI + 폴링 + 알림/소리 클라이언트 컴포넌트.
- Modify: `src/app/admin/(dashboard)/AdminShell.tsx` — topbar에 `<DesktopNotifier/>` 마운트.

DB 마이그레이션·신규 의존성 없음.

---

## Task 1: 순수 라벨 로직 (`buildNotificationItems`)

**Files:**
- Create: `src/lib/admin/notifications.ts`
- Test: `src/lib/admin/notifications.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/admin/notifications.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { buildNotificationItems } from "./notifications";

const names = { "wood-101": "주중 목공 기초반", "int-201": "실내건축 산업기사반" };

describe("buildNotificationItems", () => {
  it("수강신청 1건은 과정명을 라벨로 쓴다", () => {
    const items = buildNotificationItems(
      [{ id: 12, selected_courses: ["wood-101"] }],
      [],
      names,
    );
    expect(items).toEqual([{ type: "application", id: 12, label: "주중 목공 기초반" }]);
  });

  it("여러 과정 선택은 'OO 외 N건'", () => {
    const items = buildNotificationItems(
      [{ id: 13, selected_courses: ["wood-101", "int-201"] }],
      [],
      names,
    );
    expect(items).toEqual([{ type: "application", id: 13, label: "주중 목공 기초반 외 1건" }]);
  });

  it("선택 과정 없음은 '신청 과정 미선택'", () => {
    const items = buildNotificationItems([{ id: 14, selected_courses: [] }], [], names);
    expect(items).toEqual([{ type: "application", id: 14, label: "신청 과정 미선택" }]);
  });

  it("알 수 없는 과정 id는 라벨에서 제외", () => {
    const items = buildNotificationItems([{ id: 15, selected_courses: ["ghost"] }], [], names);
    expect(items).toEqual([{ type: "application", id: 15, label: "신청 과정 미선택" }]);
  });

  it("상담문의는 course_id 있으면 과정명, 없으면 category", () => {
    const items = buildNotificationItems(
      [],
      [
        { id: 31, category: "과정문의", course_id: "wood-101" },
        { id: 32, category: "국비지원", course_id: null },
      ],
      names,
    );
    expect(items).toEqual([
      { type: "inquiry", id: 31, label: "주중 목공 기초반" },
      { type: "inquiry", id: 32, label: "국비지원" },
    ]);
  });

  it("수강신청 먼저, 그다음 상담문의 순서", () => {
    const items = buildNotificationItems(
      [{ id: 1, selected_courses: ["wood-101"] }],
      [{ id: 2, category: "기타", course_id: null }],
      names,
    );
    expect(items.map((i) => i.type)).toEqual(["application", "inquiry"]);
  });

  it("빈 입력은 빈 배열", () => {
    expect(buildNotificationItems([], [], {})).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/lib/admin/notifications.test.ts`
Expected: FAIL — `buildNotificationItems` is not exported / module not found.

- [ ] **Step 3: Write minimal implementation**

`src/lib/admin/notifications.ts`:
```ts
// admin 데스크탑 알림용 순수 라벨 로직. 서버·클라이언트 어디서도 import 가능(부수효과 없음).

export type NotifType = "application" | "inquiry";

export interface NotifItem {
  type: NotifType;
  id: number;
  label: string;
}

interface AppRow {
  id: number;
  selected_courses: string[];
}

interface InqRow {
  id: number;
  category: string;
  course_id: string | null;
}

/** 수강신청 과정 라벨: 1개면 과정명, 여러 개면 'OO 외 N건', 없으면 '신청 과정 미선택'. */
function applicationLabel(courseIds: string[], courseNames: Record<string, string>): string {
  const names = courseIds.map((id) => courseNames[id]).filter((n): n is string => Boolean(n));
  if (names.length === 0) return "신청 과정 미선택";
  if (names.length === 1) return names[0];
  return `${names[0]} 외 ${names.length - 1}건`;
}

/** 새 수강신청·상담문의 행을 PII 없는 알림 아이템으로 변환. 수강신청 먼저, 그다음 상담문의. */
export function buildNotificationItems(
  apps: AppRow[],
  inquiries: InqRow[],
  courseNames: Record<string, string>,
): NotifItem[] {
  const items: NotifItem[] = [];
  for (const a of apps) {
    items.push({ type: "application", id: a.id, label: applicationLabel(a.selected_courses, courseNames) });
  }
  for (const q of inquiries) {
    const label = (q.course_id && courseNames[q.course_id]) || q.category;
    items.push({ type: "inquiry", id: q.id, label });
  }
  return items;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/lib/admin/notifications.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin/notifications.ts src/lib/admin/notifications.test.ts
git commit -m "feat: 데스크탑 알림 라벨 생성 순수 로직 + 테스트"
```

---

## Task 2: 폴링 라우트 핸들러 (`GET /api/admin/notifications`)

**Files:**
- Create: `src/app/api/admin/notifications/route.ts`

- [ ] **Step 1: Write the route handler**

`src/app/api/admin/notifications/route.ts`:
```ts
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildNotificationItems } from "@/lib/admin/notifications";

// 관리자 데스크탑 알림 폴링용. authenticated만 접근(미들웨어 matcher가 /admin/*만 잡으므로 자체 체크).
// PII(이름·연락처·본문)는 조회·반환하지 않는다.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const serverTime = new Date().toISOString();
  const since = request.nextUrl.searchParams.get("since");

  // 첫 폴링(기준선 설정): 백로그를 알림으로 재생하지 않는다.
  if (!since) {
    return NextResponse.json({ serverTime, items: [] });
  }

  const [appsRes, inqRes] = await Promise.all([
    supabase.from("application").select("id, selected_courses").gt("created_at", since),
    supabase.from("inquiry").select("id, category, course_id").gt("created_at", since),
  ]);

  const apps = appsRes.data ?? [];
  const inquiries = inqRes.data ?? [];

  const courseIds = new Set<string>();
  for (const a of apps) for (const c of a.selected_courses) courseIds.add(c);
  for (const q of inquiries) if (q.course_id) courseIds.add(q.course_id);

  const courseNames: Record<string, string> = {};
  if (courseIds.size > 0) {
    const { data: courses } = await supabase
      .from("course")
      .select("id, name")
      .in("id", [...courseIds]);
    for (const c of courses ?? []) courseNames[c.id] = c.name;
  }

  const items = buildNotificationItems(apps, inquiries, courseNames);
  return NextResponse.json({ serverTime, items });
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors related to this file.

- [ ] **Step 3: Manually verify auth gate (unauthenticated → 401)**

Run dev server (`pnpm dev`), then:
Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/admin/notifications`
Expected: `401`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/notifications/route.ts
git commit -m "feat: 데스크탑 알림 폴링 라우트(/api/admin/notifications) 추가"
```

---

## Task 3: Bell 아이콘 추가

**Files:**
- Modify: `src/components/icons/index.tsx`

- [ ] **Step 1: Add the Bell icon**

`src/components/icons/index.tsx` 끝부분(마지막 `export function` 뒤)에 추가:
```tsx
export function Bell({ size = 24, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth, className)}>
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    </svg>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/icons/index.tsx
git commit -m "feat: Bell 아이콘 추가"
```

---

## Task 4: DesktopNotifier 클라이언트 컴포넌트

**Files:**
- Create: `src/components/admin/DesktopNotifier.tsx`

- [ ] **Step 1: Write the component**

`src/components/admin/DesktopNotifier.tsx`:
```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "@/components/icons";
import type { NotifItem, NotifType } from "@/lib/admin/notifications";

const POLL_MS = 30_000;
const LS_ENABLED = "admin-notify-enabled";
const LS_SOUND = "admin-notify-sound";

const PAGE: Record<NotifType, string> = {
  application: "/admin/enroll",
  inquiry: "/admin/consult",
};
const TITLE: Record<NotifType, string> = {
  application: "새 수강신청",
  inquiry: "새 상담문의",
};

type Status = "off" | "ok" | "error" | "denied" | "unsupported";

export function DesktopNotifier() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const [sound, setSound] = useState(true);
  const [status, setStatus] = useState<Status>("off");
  const [open, setOpen] = useState(false);
  const sinceRef = useRef<string | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const soundRef = useRef(true);

  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  // 마운트 후 저장된 설정 복원(SSR 불일치 방지).
  useEffect(() => {
    if (!("Notification" in window)) {
      setStatus("unsupported");
      return;
    }
    setSound(localStorage.getItem(LS_SOUND) !== "0");
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    if (localStorage.getItem(LS_ENABLED) === "1" && Notification.permission === "granted") {
      setEnabled(true);
    }
  }, []);

  const playBeep = useCallback(() => {
    if (!soundRef.current) return;
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = audioRef.current ?? new Ctx();
      audioRef.current = ctx;
      if (ctx.state === "suspended") void ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    } catch {
      // 오디오 차단 환경은 무시.
    }
  }, []);

  const fire = useCallback(
    (item: NotifItem) => {
      try {
        const n = new Notification(TITLE[item.type], {
          body: item.label,
          tag: `${item.type}-${item.id}`,
        });
        n.onclick = () => {
          window.focus();
          router.push(PAGE[item.type]);
          n.close();
        };
      } catch {
        // 알림 생성 실패는 무시.
      }
    },
    [router],
  );

  // 폴링 루프.
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setStatus("ok");

    async function poll() {
      try {
        const q = sinceRef.current ? `?since=${encodeURIComponent(sinceRef.current)}` : "";
        const res = await fetch(`/api/admin/notifications${q}`, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { serverTime: string; items: NotifItem[] };
        if (cancelled) return;
        const isBaseline = sinceRef.current === null;
        sinceRef.current = data.serverTime;
        if (!isBaseline && data.items.length > 0) {
          data.items.forEach(fire);
          playBeep();
        }
        setStatus("ok");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    void poll();
    const timer = setInterval(() => void poll(), POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [enabled, fire, playBeep]);

  const enable = useCallback(async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    const perm =
      Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (perm !== "granted") {
      if (perm === "denied") setStatus("denied");
      return;
    }
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = audioRef.current ?? new Ctx();
      audioRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();
    } catch {
      // 오디오 준비 실패는 무시(알림은 동작).
    }
    sinceRef.current = null;
    localStorage.setItem(LS_ENABLED, "1");
    setEnabled(true);
  }, []);

  const disable = useCallback(() => {
    localStorage.setItem(LS_ENABLED, "0");
    setEnabled(false);
    setStatus("off");
  }, []);

  const toggleSound = useCallback(() => {
    setSound((s) => {
      const next = !s;
      localStorage.setItem(LS_SOUND, next ? "1" : "0");
      return next;
    });
  }, []);

  // 점 표시는 정상(초록)·오류(빨강)만. denied는 점 없이 팝오버 문구로 안내.
  const dotClass = status === "ok" ? "bg-success" : status === "error" ? "bg-error" : "";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="데스크탑 알림 설정"
        className="relative p-2 rounded-lg text-body-strong hover:bg-hairline-soft transition-colors"
      >
        <Bell size={20} className={enabled ? "text-primary" : "text-muted"} />
        {dotClass && (
          <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${dotClass}`} />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 mt-2 w-[260px] bg-white border border-hairline rounded-xl shadow-lg p-3 z-40 text-[14px]">
            <p className="font-semibold text-ink mb-2">데스크탑 알림</p>

            {status === "unsupported" ? (
              <p className="text-muted text-[13px]">이 브라우저는 알림을 지원하지 않습니다.</p>
            ) : status === "denied" ? (
              <p className="text-muted text-[13px]">
                브라우저에서 알림이 차단되어 있습니다. 주소창의 자물쇠 → 알림 허용으로 변경해 주세요.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="flex items-center justify-between">
                  <span className="text-body-strong">새 접수 알림</span>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => (e.target.checked ? void enable() : disable())}
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-body-strong">소리</span>
                  <input type="checkbox" checked={sound} onChange={toggleSound} />
                </label>
                <p className="text-muted text-[12px] mt-1">
                  {enabled
                    ? status === "error"
                      ? "연결 오류 — 자동 재시도 중입니다."
                      : "탭이 열려 있는 동안 새 수강신청·상담문의를 알려드립니다."
                    : "켜면 새 수강신청·상담문의를 데스크탑 알림으로 받습니다."}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: no errors. (`text-primary`/`text-muted`/`bg-success`/`bg-error`/`bg-hairline-soft` tokens come from `src/app/globals.css`.)

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/DesktopNotifier.tsx
git commit -m "feat: 데스크탑 알림 클라이언트 컴포넌트(DesktopNotifier)"
```

---

## Task 5: AdminShell topbar에 마운트

**Files:**
- Modify: `src/app/admin/(dashboard)/AdminShell.tsx`

- [ ] **Step 1: Import the component**

`AdminShell.tsx` 상단 import 블록에 추가:
```tsx
import { DesktopNotifier } from "@/components/admin/DesktopNotifier";
```

- [ ] **Step 2: Mount in topbar (날짜 옆)**

`AdminShell.tsx`의 topbar 우측 영역을 아래로 교체:
```tsx
          <div className="flex items-center gap-3">
            <DesktopNotifier />
            {/* Date — hidden below md */}
            <span className="hidden md:block text-[14px] text-muted">{today}</span>
          </div>
```

- [ ] **Step 3: Typecheck + build**

Run: `pnpm exec tsc --noEmit && pnpm build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add "src/app/admin/(dashboard)/AdminShell.tsx"
git commit -m "feat: admin topbar에 데스크탑 알림 토글 마운트"
```

---

## Task 6: 전체 검증 (preview)

- [ ] **Step 1: dev 서버 + 로그인**

`pnpm dev` 실행 → `/admin/login` 로그인.

- [ ] **Step 2: 알림 켜기**

topbar 종 버튼 → "새 접수 알림" 체크 → 브라우저 권한 허용. 종이 primary 색 + 초록 점(정상) 확인.

- [ ] **Step 3: 새 접수 생성 → 알림 확인**

다른 탭에서 공개 사이트 상담문의(바텀시트) 또는 수강신청(`/apply`) 제출.
~30초 내 OS 데스크탑 배너 + 소리. 배너 클릭 시 해당 admin 페이지로 이동.

- [ ] **Step 4: 연결 오류 표시 확인**

dev 서버를 잠시 끄거나 네트워크 차단 → 다음 폴링에서 종의 점이 빨강(error), 팝오버에 "연결 오류 — 자동 재시도 중" 표시.

---

## Self-Review

- **Spec coverage:** 폴링 감지(Task 2) · PII 제외(Task 2 select 컬럼) · 과정/구분 라벨(Task 1) · 소리+뮤트(Task 4) · 백로그 미재생(Task 2 `since` 없으면 빈 배열 + Task 4 baseline) · 연결오류 표시(Task 4 status) · topbar 마운트(Task 5) · 단위 테스트(Task 1) · 인증 401(Task 2) — 모두 매핑됨.
- **Placeholder scan:** 없음. 모든 코드 스텝에 전체 코드 포함.
- **Type consistency:** `NotifItem`/`NotifType`은 Task 1에서 export, Task 4에서 import. 라우트(Task 2)는 `buildNotificationItems` 사용. 색 토큰(`success`/`error`)은 globals.css에 존재 확인(`warning`은 없어 미사용).
