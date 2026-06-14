# 사진 업로드 배관 (Supabase Storage·S3 호환) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 어드민/갤러리 연동 전에, 브라우저가 presigned PUT URL로 Supabase Storage(공개 버킷 `images`)에 이미지를 직접 업로드하고 객체 key를 돌려받는 "업로드 배관"을 만든다.

**Architecture:** Server Action(`getUploadUrl`)이 zod로 입력을 검증하고 presigned PUT URL을 발급한다. 브라우저는 그 URL로 파일을 Storage에 직접 올린다(서버 경유 X). DB/상태에는 전체 URL이 아니라 **객체 key만** 보관하고, 표시용 URL은 `NEXT_PUBLIC_IMAGE_BASE_URL` + key로 조합한다 → 나중에 실제 AWS S3로 옮길 때 env만 교체.

**Tech Stack:** Next.js 16.2.9 (App Router, Server Actions), TypeScript, zod v4, `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`, Supabase Storage(S3 호환), vitest + jsdom.

> **⚠️ AGENTS.md 준수:** Next 16.2.9는 학습 데이터와 API가 다를 수 있다. 라우트/`notFound`/Server Action 관련해 의심스러우면 `node_modules/next/dist/docs/`의 관련 문서를 먼저 읽고 진행한다.

> **⚠️ 보안:** `getUploadUrl`은 현재 인증이 없다. **임시·로컬 전용**이며, dev 테스트 UI는 `NODE_ENV === "production"`에서 `notFound()`로 차단한다. 어드민 인증 구축 후 이 액션을 인증 뒤로 게이팅하는 것은 범위 밖 후속 작업.

---

## File Structure

| 파일 | 책임 |
|---|---|
| `supabase/config.toml` (수정) | 공개 버킷 `images` 선언 |
| `.env.local` (수정, 커밋 안 함) | `S3_BUCKET` / `S3_ENDPOINT` / `NEXT_PUBLIC_IMAGE_BASE_URL` |
| `src/lib/validations/upload.ts` | zod 스키마 `uploadRequestSchema` (filename·contentType·size) |
| `src/lib/validations/upload.test.ts` | 스키마 단위 테스트 |
| `src/lib/s3/keys.ts` | `buildObjectKey(contentType)`, `publicImageUrl(key)` 순수 함수 |
| `src/lib/s3/keys.test.ts` | 순수 함수 단위 테스트 |
| `src/lib/s3/client.ts` | env 기반 `getS3Client()` 팩토리 |
| `src/lib/actions/upload.ts` | Server Action `getUploadUrl` |
| `src/lib/actions/upload.test.ts` | 액션 테스트(presigner·client 모킹) |
| `src/app/dev/upload/page.tsx` | dev 전용 테스트 페이지(프로덕션 차단) |
| `src/app/dev/upload/UploadTester.tsx` | 파일 선택→발급→PUT→미리보기 클라이언트 컴포넌트 |

---

## Task 1: 의존성 설치 · 버킷 선언 · 환경변수

**Files:**
- Modify: `package.json` (pnpm add)
- Modify: `supabase/config.toml` (버킷 선언)
- Modify: `.env.local` (env 추가 — 커밋하지 않음)

- [ ] **Step 1: AWS SDK 패키지 설치**

Run:
```bash
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```
Expected: 두 패키지가 `dependencies`에 추가됨.

- [ ] **Step 2: `supabase/config.toml`에 공개 버킷 선언**

`[storage]` 블록 아래의 주석 처리된 `# [storage.buckets.images]` 예시를 다음 실제 설정으로 교체(또는 그 자리에 추가):

```toml
[storage.buckets.images]
public = true
file_size_limit = "10MiB"
allowed_mime_types = ["image/jpeg", "image/png", "image/webp"]
```

- [ ] **Step 3: `.env.local`에 env 3줄 추가/수정**

기존 `S3_REGION` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`는 그대로 두고, 빈 `S3_BUCKET=` 값을 채우고 두 줄을 추가:

```
S3_BUCKET=images
S3_ENDPOINT=http://127.0.0.1:54321/storage/v1/s3
NEXT_PUBLIC_IMAGE_BASE_URL=http://127.0.0.1:54321/storage/v1/object/public/images
```

- [ ] **Step 4: 로컬 Supabase에 버킷 반영**

Run:
```bash
supabase stop && supabase start
```
Expected: 정상 기동. (Docker/로컬 Supabase 필요. 기동 후 Studio Storage에 `images` 버킷이 보이면 성공.)

- [ ] **Step 5: 커밋 (config.toml만 — `.env.local`은 gitignore)**

```bash
git add package.json pnpm-lock.yaml supabase/config.toml
git commit -m "chore: 사진 업로드용 의존성·공개 버킷(images) 설정"
```

---

## Task 2: 업로드 요청 zod 스키마

**Files:**
- Create: `src/lib/validations/upload.ts`
- Test: `src/lib/validations/upload.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `src/lib/validations/upload.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { uploadRequestSchema } from "./upload";

describe("uploadRequestSchema", () => {
  const base = { filename: "site.jpg", contentType: "image/jpeg", size: 1024 };

  it("유효한 입력을 통과시킨다", () => {
    expect(uploadRequestSchema.safeParse(base).success).toBe(true);
  });
  it("png·webp도 허용", () => {
    expect(uploadRequestSchema.safeParse({ ...base, contentType: "image/png" }).success).toBe(true);
    expect(uploadRequestSchema.safeParse({ ...base, contentType: "image/webp" }).success).toBe(true);
  });
  it("허용 안 된 타입(gif)은 거부", () => {
    expect(uploadRequestSchema.safeParse({ ...base, contentType: "image/gif" }).success).toBe(false);
  });
  it("10MB 초과는 거부", () => {
    expect(uploadRequestSchema.safeParse({ ...base, size: 10 * 1024 * 1024 + 1 }).success).toBe(false);
  });
  it("size가 0 이하면 거부", () => {
    expect(uploadRequestSchema.safeParse({ ...base, size: 0 }).success).toBe(false);
  });
  it("filename이 비면 거부", () => {
    expect(uploadRequestSchema.safeParse({ ...base, filename: " " }).success).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test src/lib/validations/upload.test.ts`
Expected: FAIL — `./upload` 모듈 없음(Cannot find module).

- [ ] **Step 3: 스키마 구현**

Create `src/lib/validations/upload.ts`:
```ts
import { z } from "zod";

export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const uploadRequestSchema = z.object({
  filename: z.string().trim().min(1, "파일 이름을 확인해 주세요").max(255),
  contentType: z.enum(ALLOWED_IMAGE_TYPES, {
    message: "JPG·PNG·WEBP 이미지만 업로드할 수 있어요",
  }),
  size: z
    .number()
    .int()
    .positive("파일 크기를 확인해 주세요")
    .max(MAX_UPLOAD_SIZE, "이미지는 10MB 이하만 업로드할 수 있어요"),
});

export type UploadRequest = z.infer<typeof uploadRequestSchema>;
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test src/lib/validations/upload.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: 커밋**

```bash
git add src/lib/validations/upload.ts src/lib/validations/upload.test.ts
git commit -m "feat: 업로드 요청 zod 스키마(타입·용량 검증) 추가"
```

---

## Task 3: 객체 key / 공개 URL 순수 함수

**Files:**
- Create: `src/lib/s3/keys.ts`
- Test: `src/lib/s3/keys.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `src/lib/s3/keys.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";
import { buildObjectKey, publicImageUrl } from "./keys";

describe("buildObjectKey", () => {
  it("contentType에 맞는 확장자로 posts/ 경로 key를 만든다", () => {
    expect(buildObjectKey("image/png")).toMatch(/^posts\/[0-9a-f-]{36}\.png$/);
    expect(buildObjectKey("image/jpeg")).toMatch(/^posts\/[0-9a-f-]{36}\.jpg$/);
    expect(buildObjectKey("image/webp")).toMatch(/^posts\/[0-9a-f-]{36}\.webp$/);
  });
  it("호출마다 다른 key를 만든다", () => {
    expect(buildObjectKey("image/webp")).not.toBe(buildObjectKey("image/webp"));
  });
});

describe("publicImageUrl", () => {
  it("base URL과 key를 슬래시 하나로 합친다", () => {
    vi.stubEnv("NEXT_PUBLIC_IMAGE_BASE_URL", "http://127.0.0.1:54321/storage/v1/object/public/images");
    expect(publicImageUrl("posts/abc.png")).toBe(
      "http://127.0.0.1:54321/storage/v1/object/public/images/posts/abc.png",
    );
  });
  it("base 끝에 슬래시가 있어도 중복되지 않는다", () => {
    vi.stubEnv("NEXT_PUBLIC_IMAGE_BASE_URL", "http://base/images/");
    expect(publicImageUrl("posts/x.jpg")).toBe("http://base/images/posts/x.jpg");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test src/lib/s3/keys.test.ts`
Expected: FAIL — `./keys` 모듈 없음.

- [ ] **Step 3: 구현**

Create `src/lib/s3/keys.ts`:
```ts
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// 충돌 없는 객체 key 생성. 예: posts/3f2a...-uuid.png
export function buildObjectKey(contentType: string): string {
  const ext = EXT_BY_MIME[contentType] ?? "bin";
  return `posts/${crypto.randomUUID()}.${ext}`;
}

// 저장된 key를 공개 URL로 변환. base는 env로 주입 → 저장소 이전 시 env만 교체.
export function publicImageUrl(key: string): string {
  const base = (process.env.NEXT_PUBLIC_IMAGE_BASE_URL ?? "").replace(/\/$/, "");
  return `${base}/${key}`;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test src/lib/s3/keys.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: 커밋**

```bash
git add src/lib/s3/keys.ts src/lib/s3/keys.test.ts
git commit -m "feat: S3 객체 key 생성·공개 URL 조합 유틸 추가"
```

---

## Task 4: S3 client 팩토리

**Files:**
- Create: `src/lib/s3/client.ts`

(얇은 env 래퍼 — 단위 테스트 없음. 타입체크로만 검증.)

- [ ] **Step 1: 구현**

Create `src/lib/s3/client.ts`:
```ts
import { S3Client } from "@aws-sdk/client-s3";

// endpoint를 env로 주입 → 로컬 Supabase Storage / 실제 AWS 양쪽 호환.
// Supabase S3 호환 엔드포인트는 path-style를 요구하므로 forcePathStyle: true.
export function getS3Client(): S3Client {
  return new S3Client({
    region: process.env.S3_REGION ?? "local",
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
}
```

- [ ] **Step 2: 타입체크 통과 확인**

Run: `pnpm exec tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add src/lib/s3/client.ts
git commit -m "feat: 설정 가능한 S3 client 팩토리 추가"
```

---

## Task 5: getUploadUrl Server Action

**Files:**
- Create: `src/lib/actions/upload.ts`
- Test: `src/lib/actions/upload.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `src/lib/actions/upload.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// presigner와 client는 네트워크/자격증명에 의존하므로 모킹한다.
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(async () => "https://signed.example/put?sig=1"),
}));
vi.mock("@/lib/s3/client", () => ({ getS3Client: () => ({}) }));

import { getUploadUrl } from "./upload";

beforeEach(() => {
  vi.stubEnv("S3_BUCKET", "images");
  vi.stubEnv("NEXT_PUBLIC_IMAGE_BASE_URL", "http://base/images");
});

describe("getUploadUrl", () => {
  const valid = { filename: "site.jpg", contentType: "image/jpeg", size: 1024 };

  it("유효 입력에 presigned URL·key·publicUrl을 반환", async () => {
    const r = await getUploadUrl(valid);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.uploadUrl).toContain("https://signed.example");
      expect(r.key).toMatch(/^posts\/[0-9a-f-]{36}\.jpg$/);
      expect(r.publicUrl).toBe(`http://base/images/${r.key}`);
    }
  });
  it("허용 안 된 타입은 거부", async () => {
    const r = await getUploadUrl({ ...valid, contentType: "image/gif" });
    expect(r.ok).toBe(false);
  });
  it("10MB 초과는 거부", async () => {
    const r = await getUploadUrl({ ...valid, size: 11 * 1024 * 1024 });
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test src/lib/actions/upload.test.ts`
Expected: FAIL — `./upload` 모듈 없음.

- [ ] **Step 3: 액션 구현**

Create `src/lib/actions/upload.ts`:
```ts
"use server";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Client } from "@/lib/s3/client";
import { buildObjectKey, publicImageUrl } from "@/lib/s3/keys";
import { uploadRequestSchema } from "@/lib/validations/upload";

export type UploadUrlResult =
  | { ok: true; uploadUrl: string; key: string; publicUrl: string }
  | { ok: false; error: string };

const GENERIC_ERROR = "업로드 준비 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";

// presigned PUT URL 발급. ⚠️ 인증 없음 — 임시·로컬 전용. 어드민 게이팅은 후속.
export async function getUploadUrl(input: unknown): Promise<UploadUrlResult> {
  const parsed = uploadRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }
  const { contentType } = parsed.data;
  const key = buildObjectKey(contentType);
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(getS3Client(), command, { expiresIn: 300 });
    return { ok: true, uploadUrl, key, publicUrl: publicImageUrl(key) };
  } catch {
    return { ok: false, error: GENERIC_ERROR };
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test src/lib/actions/upload.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: 커밋**

```bash
git add src/lib/actions/upload.ts src/lib/actions/upload.test.ts
git commit -m "feat: presigned 업로드 URL 발급 Server Action(getUploadUrl) 추가"
```

---

## Task 6: dev 전용 테스트 UI + 수동 검증

**Files:**
- Create: `src/app/dev/upload/page.tsx`
- Create: `src/app/dev/upload/UploadTester.tsx`

(브라우저 동작 검증 — 단위 테스트 대신 수동 확인.)

- [ ] **Step 1: dev 전용 페이지 작성(프로덕션 차단)**

Create `src/app/dev/upload/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { UploadTester } from "./UploadTester";

// dev 전용. 네비에 연결하지 않으며 프로덕션에서는 404.
export default function DevUploadPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main style={{ maxWidth: 480, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>업로드 배관 테스트(dev)</h1>
      <UploadTester />
    </main>
  );
}
```

- [ ] **Step 2: 업로드 테스터 클라이언트 컴포넌트 작성**

Create `src/app/dev/upload/UploadTester.tsx`:
```tsx
"use client";

import { useState } from "react";
import { getUploadUrl } from "@/lib/actions/upload";

export function UploadTester() {
  const [status, setStatus] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");

  async function handleFile(file: File) {
    setStatus("발급 중…");
    setPreviewUrl("");
    const res = await getUploadUrl({
      filename: file.name,
      contentType: file.type,
      size: file.size,
    });
    if (!res.ok) {
      setStatus(`실패: ${res.error}`);
      return;
    }
    setStatus("업로드 중…");
    const put = await fetch(res.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!put.ok) {
      setStatus(`업로드 실패: HTTP ${put.status}`);
      return;
    }
    setStatus(`성공 · key: ${res.key}`);
    setPreviewUrl(res.publicUrl);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
      {status && <p style={{ fontSize: 14 }}>{status}</p>}
      {previewUrl && (
        // 갤러리 연동 전 임시 미리보기 — next/image 대신 plain img (remotePatterns 설정 불필요)
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="업로드 미리보기" style={{ maxWidth: "100%", borderRadius: 8 }} />
      )}
    </div>
  );
}
```

- [ ] **Step 3: 개발 서버에서 수동 검증**

Run: `pnpm dev` 후 브라우저에서 `http://localhost:3000/dev/upload` 접속.
Expected:
- 이미지(jpg/png/webp) 선택 → "성공 · key: posts/…" 표시 + 미리보기 이미지가 보임.
- Supabase Studio → Storage → `images` 버킷에 `posts/…` 객체가 생김.
- gif 등 비허용 파일 선택 시 "실패: JPG·PNG·WEBP …" 메시지.

> 검증 실패 시 점검 순서: (1) `supabase start` 기동 여부, (2) `.env.local`의 `S3_ENDPOINT`·`S3_BUCKET`·키, (3) 버킷이 public인지, (4) presigned PUT의 `Content-Type` 헤더가 발급 시 contentType과 일치하는지.

- [ ] **Step 4: 커밋**

```bash
git add src/app/dev/upload/page.tsx src/app/dev/upload/UploadTester.tsx
git commit -m "feat: dev 전용 업로드 테스트 페이지(프로덕션 차단) 추가"
```

---

## Task 7: 전체 검증

- [ ] **Step 1: 린트**

Run: `pnpm lint`
Expected: 에러 없음.

- [ ] **Step 2: 전체 테스트**

Run: `pnpm test`
Expected: 기존 + 신규(upload·keys·action) 모두 PASS.

- [ ] **Step 3: 빌드**

Run: `pnpm build`
Expected: 성공. (Server Action `getUploadUrl`이 "use server"에서 정상 빌드되는지 확인.)

> 빌드 시 `dev/upload`가 정적 분석되더라도 런타임 `notFound()` 가드로 프로덕션 노출은 차단된다.

---

## Self-Review (작성자 점검 결과)

- **Spec 커버리지:** §1 결정(저장소/버킷/방식/key) → Task1·3·5. §2 env → Task1. §3 버킷 선언 → Task1. §4 모듈 → Task2~6. §5 흐름 → Task5·6. §6 검증/에러 → Task2·5. §7 보안(인증 없음·dev 차단) → Task5 주석·Task6 notFound. §8 테스트 → Task2·3·5. §9 사용자 작업 → Task1. 모두 매핑됨.
- **플레이스홀더:** 없음(모든 코드 전체 기재).
- **타입 일관성:** `buildObjectKey(contentType)`/`publicImageUrl(key)`/`uploadRequestSchema`/`getUploadUrl`/`UploadUrlResult` 명칭이 정의·사용처에서 일치.
- **범위:** 단일 플랜으로 적정(어드민·갤러리·AWS 이전은 §10 후속으로 분리).
