# 훈련사진 관리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 운영자가 어드민(`/admin/photos`)에서 훈련사진을 올리고/지우면 공개 `/photos` 갤러리에 그대로 반영되게 한다.

**Architecture:** 사진 1장 = `post`(category='훈련사진') 1행, `images=[객체키]`. 저장 백엔드는 `src/lib/storage/` 어댑터 한 곳에 격리하고(현재 Supabase Storage 공개 버킷), 앱의 나머지는 객체 키/공개 URL 문자열만 다룬다. 업로드는 브라우저→버킷 직접(서버 함수 크기 제한 회피). 기존 25장은 일회성 시드 스크립트로 버킷 이전.

**Tech Stack:** Next.js(App Router) Server Actions, Supabase Storage + Postgres(RLS), zod, vitest. 설계서: `docs/superpowers/specs/2026-06-20-training-photo-management-design.md`.

**전제(로컬):** `pnpm db:start`로 로컬 Supabase 실행 중. 어드민 로그인 가능 상태.

**비고(코드 컨벤션):**
- 테스트는 **순수 함수만** 단위 테스트한다(코드베이스 관례 — Supabase는 모킹하지 않음). 서버액션·쿼리·UI는 빌드/타입체크 + 수동(preview) 확인.
- 어드민 그리드는 `next/image` 대신 공개 갤러리와 동일하게 `<img>`를 쓴다(원격 호스트 config 불필요, S3 교체 시 변경 표면 축소).

---

### Task 1: 스토리지 순수 헬퍼 + 타입

**Files:**
- Create: `src/lib/storage/keys.ts`
- Create: `src/lib/storage/types.ts`
- Test: `src/lib/storage/keys.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성** — `src/lib/storage/keys.test.ts`

```ts
import { describe, it, expect } from "vitest";
import {
  extFromContentType,
  makeObjectKey,
  supabasePublicUrl,
  publicUrl,
  validatePhotoFile,
  TRAINING_PHOTOS_BUCKET,
} from "./keys";

describe("extFromContentType", () => {
  it("jpeg·png만 확장자를 반환", () => {
    expect(extFromContentType("image/jpeg")).toBe("jpg");
    expect(extFromContentType("image/png")).toBe("png");
  });
  it("허용 외 타입은 null", () => {
    expect(extFromContentType("image/gif")).toBeNull();
    expect(extFromContentType("application/pdf")).toBeNull();
  });
});

describe("makeObjectKey", () => {
  it("uuid.확장자 형식의 키를 만든다", () => {
    expect(makeObjectKey("image/jpeg")).toMatch(/^[0-9a-f-]{36}\.jpg$/);
    expect(makeObjectKey("image/png")).toMatch(/^[0-9a-f-]{36}\.png$/);
  });
  it("허용 외 타입은 null", () => {
    expect(makeObjectKey("image/webp")).toBeNull();
  });
});

describe("supabasePublicUrl", () => {
  it("공개 객체 URL을 조립(끝 슬래시 정규화)", () => {
    expect(supabasePublicUrl("http://localhost:54321", "training-photos", "a.jpg")).toBe(
      "http://localhost:54321/storage/v1/object/public/training-photos/a.jpg",
    );
    expect(supabasePublicUrl("http://x/", "b", "k.png")).toBe(
      "http://x/storage/v1/object/public/b/k.png",
    );
  });
});

describe("publicUrl", () => {
  it("환경변수 베이스 + 버킷으로 URL을 만든다", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
    expect(publicUrl("a.jpg")).toBe(
      `http://localhost:54321/storage/v1/object/public/${TRAINING_PHOTOS_BUCKET}/a.jpg`,
    );
  });
});

describe("validatePhotoFile", () => {
  it("jpeg·png는 통과(null)", () => {
    expect(validatePhotoFile({ type: "image/jpeg", size: 1000 })).toBeNull();
    expect(validatePhotoFile({ type: "image/png", size: 1000 })).toBeNull();
  });
  it("허용 외 타입은 메시지", () => {
    expect(validatePhotoFile({ type: "image/gif", size: 1000 })).toMatch(/JPG·PNG/);
  });
  it("10MB 초과는 메시지", () => {
    expect(validatePhotoFile({ type: "image/jpeg", size: 11 * 1024 * 1024 })).toMatch(/10MB/);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm exec vitest run src/lib/storage/keys.test.ts`
Expected: FAIL — `Cannot find module './keys'`

- [ ] **Step 3: 타입 작성** — `src/lib/storage/types.ts`

```ts
// 스토리지 백엔드 어댑터 타입. 백엔드 특이사항은 이 디렉터리 안에만 존재한다.
export type StorageDriver = "supabase" | "s3";

// 브라우저가 백엔드로 직접 업로드하기 위한 정보(드라이버별 형태가 다르다).
export type UploadTarget =
  | { driver: "supabase"; bucket: string; key: string }
  | { driver: "s3"; key: string; uploadUrl: string; headers: Record<string, string> }; // 미래
```

- [ ] **Step 4: 순수 헬퍼 구현** — `src/lib/storage/keys.ts`

```ts
// 스토리지 순수 헬퍼 — node/cookie 의존 없이 서버·클라이언트 양쪽에서 import 가능.
export const TRAINING_PHOTOS_BUCKET = "training-photos";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png" };

/** content-type → 확장자. 허용 외 타입은 null. */
export function extFromContentType(contentType: string): string | null {
  return ALLOWED[contentType] ?? null;
}

/** 업로드용 객체 키 생성(uuid.ext). 허용 외 타입이면 null. */
export function makeObjectKey(contentType: string): string | null {
  const ext = extFromContentType(contentType);
  return ext ? `${crypto.randomUUID()}.${ext}` : null;
}

/** Supabase 공개 버킷 객체 URL 조립(순수). */
export function supabasePublicUrl(baseUrl: string, bucket: string, key: string): string {
  return `${baseUrl.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${key}`;
}

/** 객체 키 → 공개 URL. 현재 드라이버: supabase. */
export function publicUrl(key: string): string {
  return supabasePublicUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    TRAINING_PHOTOS_BUCKET,
    key,
  );
}

/** 업로드 전 파일 검증. 통과 시 null, 실패 시 사용자용 메시지. */
export function validatePhotoFile(file: { type: string; size: number }): string | null {
  if (!extFromContentType(file.type)) return "JPG·PNG 이미지만 올릴 수 있습니다.";
  if (file.size > MAX_BYTES) return "한 장당 최대 10MB까지 올릴 수 있습니다.";
  return null;
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `pnpm exec vitest run src/lib/storage/keys.test.ts`
Expected: PASS (5 describe 블록 통과)

- [ ] **Step 6: 커밋**

```bash
git add src/lib/storage/keys.ts src/lib/storage/types.ts src/lib/storage/keys.test.ts
git commit -m "feat: 훈련사진 스토리지 순수 헬퍼(키 생성·URL·검증) 추가"
```

---

### Task 2: 업로드 입력 zod 스키마

**Files:**
- Modify: `src/lib/validations/forms.ts` (끝에 추가)
- Test: `src/lib/validations/forms.test.ts` (describe 추가)

- [ ] **Step 1: 실패하는 테스트 작성** — `src/lib/validations/forms.test.ts` 의 import에 `trainingPhotoAddSchema` 추가하고 파일 끝에 describe 추가

import 라인에 추가:
```ts
  trainingPhotoAddSchema,
```

파일 끝에 추가:
```ts
describe("trainingPhotoAddSchema", () => {
  it("키·라벨 목록을 통과시킨다", () => {
    const r = trainingPhotoAddSchema.safeParse({
      photos: [{ key: "a.jpg", label: "현장" }, { key: "b.png", label: "" }],
    });
    expect(r.success).toBe(true);
  });
  it("빈 배열은 거부", () => {
    expect(trainingPhotoAddSchema.safeParse({ photos: [] }).success).toBe(false);
  });
  it("key 누락은 거부", () => {
    expect(
      trainingPhotoAddSchema.safeParse({ photos: [{ label: "x" }] }).success,
    ).toBe(false);
  });
  it("50장 초과는 거부", () => {
    const photos = Array.from({ length: 51 }, (_, i) => ({ key: `${i}.jpg`, label: "" }));
    expect(trainingPhotoAddSchema.safeParse({ photos }).success).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm exec vitest run src/lib/validations/forms.test.ts`
Expected: FAIL — `trainingPhotoAddSchema` is not exported / undefined

- [ ] **Step 3: 스키마 구현** — `src/lib/validations/forms.ts` 끝에 추가

```ts
// 관리자 — 훈련사진 추가(업로드 완료된 객체 키 목록)
export const trainingPhotoAddSchema = z.object({
  photos: z
    .array(
      z.object({
        key: z.string().trim().min(1).max(200),
        label: z.string().trim().max(100).default(""),
      }),
    )
    .min(1, "업로드할 사진이 없습니다")
    .max(50, "한 번에 최대 50장까지 올릴 수 있습니다"),
});
export type TrainingPhotoAddInput = z.infer<typeof trainingPhotoAddSchema>;
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm exec vitest run src/lib/validations/forms.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/lib/validations/forms.ts src/lib/validations/forms.test.ts
git commit -m "test: 훈련사진 추가 입력 스키마(trainingPhotoAddSchema)"
```

---

### Task 3: 스토리지 서버 어댑터

**Files:**
- Create: `src/lib/storage/server.ts`

서버 전용(쿠키 세션 사용). 업로드 대상 발급 + 객체 삭제. `actions.ts`만 import한다.

- [ ] **Step 1: 구현** — `src/lib/storage/server.ts`

```ts
import { createClient } from "@/lib/supabase/server";
import { makeObjectKey, TRAINING_PHOTOS_BUCKET } from "./keys";
import type { UploadTarget } from "./types";

/** 브라우저가 직접 올릴 업로드 대상 발급. 현재 드라이버: supabase. */
export async function createUploadTarget(contentType: string): Promise<UploadTarget | null> {
  const key = makeObjectKey(contentType);
  if (!key) return null;
  return { driver: "supabase", bucket: TRAINING_PHOTOS_BUCKET, key };
}

/** 버킷 객체 삭제(best-effort). 현재 드라이버: supabase. */
export async function removeObjects(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const sb = await createClient();
  await sb.storage.from(TRAINING_PHOTOS_BUCKET).remove(keys);
}
```

- [ ] **Step 2: 타입체크**

Run: `pnpm exec tsc --noEmit`
Expected: 통과(에러 없음). (이 파일 관련 에러 없음 — 미사용 export 경고는 무시)

- [ ] **Step 3: 커밋**

```bash
git add src/lib/storage/server.ts
git commit -m "feat: 스토리지 서버 어댑터(업로드 대상 발급·객체 삭제)"
```

---

### Task 4: 스토리지 클라이언트 어댑터

**Files:**
- Create: `src/lib/storage/client.ts`

- [ ] **Step 1: 구현** — `src/lib/storage/client.ts`

```ts
import { createClient } from "@/lib/supabase/client";
import type { UploadTarget } from "./types";

/** 업로드 대상에 파일을 직접 업로드. 드라이버별 분기. */
export async function uploadToTarget(target: UploadTarget, file: File): Promise<void> {
  switch (target.driver) {
    case "supabase": {
      const sb = createClient();
      const { error } = await sb.storage
        .from(target.bucket)
        .upload(target.key, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      return;
    }
    default:
      throw new Error(
        `지원하지 않는 스토리지 드라이버: ${(target as { driver: string }).driver}`,
      );
  }
}
```

- [ ] **Step 2: 타입체크**

Run: `pnpm exec tsc --noEmit`
Expected: 통과

- [ ] **Step 3: 커밋**

```bash
git add src/lib/storage/client.ts
git commit -m "feat: 스토리지 클라이언트 어댑터(직접 업로드)"
```

---

### Task 5: 버킷 마이그레이션

**Files:**
- Create: `supabase/migrations/20260620140000_training_photos_bucket.sql`

- [ ] **Step 1: 마이그레이션 작성**

```sql
-- 훈련사진 공개 버킷 + RLS. (config.toml 버킷은 db reset 때만 생성되는 함정 회피 → SQL로 명시 생성)
insert into storage.buckets (id, name, public)
values ('training-photos', 'training-photos', true)
on conflict (id) do nothing;

-- 공개 읽기 (공개 버킷이라 public URL은 정책 없이도 열리지만, Storage API 접근 위해 명시)
create policy "training photos public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'training-photos');

-- 관리자(authenticated)만 업로드/삭제
create policy "training photos admin insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'training-photos');

create policy "training photos admin delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'training-photos');
```

- [ ] **Step 2: 로컬 적용 + 버킷 확인**

Run: `pnpm db:reset`
Expected: 마이그레이션이 에러 없이 적용된다.

Run(확인): `pnpm exec supabase db reset` 출력에 위 마이그레이션 파일명이 포함되고, 다음으로 버킷 존재 확인 —
`echo "select id,public from storage.buckets where id='training-photos';" | pnpm exec supabase db execute --local 2>/dev/null || true`
Expected: `training-photos | t` 한 줄. (db execute가 환경에 없으면 Supabase Studio Storage 탭에서 버킷 존재만 확인.)

- [ ] **Step 3: 커밋**

```bash
git add supabase/migrations/20260620140000_training_photos_bucket.sql
git commit -m "feat: 훈련사진 공개 버킷·RLS 마이그레이션"
```

---

### Task 6: 어드민 서버액션 + 어드민 쿼리 URL 변환

**Files:**
- Create: `src/app/admin/(dashboard)/photos/actions.ts`
- Modify: `src/lib/queries/admin.ts` (`getTrainingPhotos` 매핑에 publicUrl 적용 + import)

- [ ] **Step 1: 서버액션 작성** — `src/app/admin/(dashboard)/photos/actions.ts`

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createUploadTarget as makeTarget, removeObjects } from "@/lib/storage/server";
import { trainingPhotoAddSchema } from "@/lib/validations/forms";
import type { UploadTarget } from "@/lib/storage/types";

export type PhotoResult = { ok: true } | { ok: false; error: string };

const GENERIC = "처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";

/** 업로드 대상 발급(브라우저 직접 업로드용). */
export async function createUploadTarget(
  contentType: string,
): Promise<{ ok: true; target: UploadTarget } | { ok: false; error: string }> {
  const target = await makeTarget(contentType);
  if (!target) return { ok: false, error: "JPG·PNG 이미지만 올릴 수 있습니다." };
  return { ok: true, target };
}

/** 업로드 완료된 사진들을 post 행으로 기록. */
export async function addTrainingPhotos(input: unknown): Promise<PhotoResult> {
  const parsed = trainingPhotoAddSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }
  const rows = parsed.data.photos.map((p) => ({
    category: "훈련사진" as const,
    title: p.label || "훈련 현장 사진",
    images: [p.key],
  }));

  const supabase = await createClient();
  const { error } = await supabase.from("post").insert(rows);
  if (error) return { ok: false, error: GENERIC };

  revalidatePath("/admin/photos");
  revalidatePath("/photos");
  return { ok: true };
}

/** 사진 삭제 — post 행 소프트삭제 + 버킷 객체 제거. */
export async function deleteTrainingPhoto(id: number): Promise<PhotoResult> {
  if (!Number.isInteger(id) || id <= 0) return { ok: false, error: "잘못된 요청입니다." };

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("post")
    .select("images")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("post").update({ is_deleted: true }).eq("id", id);
  if (error) return { ok: false, error: GENERIC };

  const key = row?.images?.[0];
  if (key) await removeObjects([key]);

  revalidatePath("/admin/photos");
  revalidatePath("/photos");
  return { ok: true };
}
```

- [ ] **Step 2: 어드민 쿼리 URL 변환** — `src/lib/queries/admin.ts`

상단 import 구역에 추가:
```ts
import { publicUrl } from "@/lib/storage/keys";
```

`getTrainingPhotos`의 return 매핑을 교체(기존: `image: p.images[0] ?? null`):
```ts
  return (data ?? []).map((p) => ({
    id: p.id,
    label: p.title,
    image: p.images[0] ? publicUrl(p.images[0]) : null,
  }));
```

- [ ] **Step 3: 타입체크**

Run: `pnpm exec tsc --noEmit`
Expected: 통과

- [ ] **Step 4: 커밋**

```bash
git add "src/app/admin/(dashboard)/photos/actions.ts" src/lib/queries/admin.ts
git commit -m "feat: 훈련사진 서버액션(업로드 대상·추가·삭제)·어드민 쿼리 URL 변환"
```

---

### Task 7: 업로더 · 삭제 버튼 클라이언트 컴포넌트

**Files:**
- Create: `src/app/admin/(dashboard)/photos/PhotoUploader.tsx`
- Create: `src/app/admin/(dashboard)/photos/DeletePhotoButton.tsx`

- [ ] **Step 1: 업로더 작성** — `src/app/admin/(dashboard)/photos/PhotoUploader.tsx`

```tsx
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon } from "@/components/icons";
import { validatePhotoFile } from "@/lib/storage/keys";
import { uploadToTarget } from "@/lib/storage/client";
import { createUploadTarget, addTrainingPhotos } from "./actions";

export function PhotoUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    setError(null);
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    for (const f of files) {
      const msg = validatePhotoFile(f);
      if (msg) { setError(msg); return; }
    }

    setBusy(true);
    try {
      const photos: { key: string; label: string }[] = [];
      for (const f of files) {
        const t = await createUploadTarget(f.type);
        if (!t.ok) { setError(t.error); return; }
        await uploadToTarget(t.target, f);
        photos.push({ key: t.target.key, label: f.name.replace(/\.[^.]+$/, "") });
      }
      const res = await addTrainingPhotos({ photos });
      if (!res.ok) { setError(res.error); return; }
      router.refresh();
    } catch {
      setError("업로드 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
        disabled={busy}
        className={`w-full border-2 border-dashed rounded-lg py-12 flex flex-col items-center justify-center gap-2 bg-primary-softer disabled:opacity-60 ${drag ? "border-primary" : "border-primary-border"}`}
      >
        <ImageIcon size={28} className="text-primary" />
        <p className="text-body-strong text-[15px] font-bold">
          {busy ? "업로드 중…" : "사진을 끌어다 놓거나 클릭해서 업로드"}
        </p>
        <p className="text-muted text-[13px]">JPG·PNG 최대 10MB</p>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && <p className="text-error text-[13px] mt-2">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: 삭제 버튼 작성** — `src/app/admin/(dashboard)/photos/DeletePhotoButton.tsx`

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "@/components/icons";
import { deleteTrainingPhoto } from "./actions";

export function DeletePhotoButton({ id }: { id: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (busy) return;
    if (!confirm("이 사진을 삭제할까요? 되돌릴 수 없습니다.")) return;
    setBusy(true);
    const res = await deleteTrainingPhoto(id);
    setBusy(false);
    if (!res.ok) { alert(res.error); return; }
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={busy}
      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 inline-flex items-center justify-center hover:bg-error-soft hover:text-error disabled:opacity-50"
      aria-label="삭제"
    >
      <X size={14} />
    </button>
  );
}
```

- [ ] **Step 3: 타입체크**

Run: `pnpm exec tsc --noEmit`
Expected: 통과

- [ ] **Step 4: 커밋**

```bash
git add "src/app/admin/(dashboard)/photos/PhotoUploader.tsx" "src/app/admin/(dashboard)/photos/DeletePhotoButton.tsx"
git commit -m "feat: 훈련사진 업로더·삭제 버튼 클라이언트 컴포넌트"
```

---

### Task 8: 어드민 페이지 배선

**Files:**
- Modify: `src/app/admin/(dashboard)/photos/page.tsx` (전체 교체)

- [ ] **Step 1: 페이지 교체** — `src/app/admin/(dashboard)/photos/page.tsx`

```tsx
import { getTrainingPhotos } from "@/lib/queries/admin";
import { PhotoUploader } from "./PhotoUploader";
import { DeletePhotoButton } from "./DeletePhotoButton";

export default async function PhotosPage() {
  const photos = await getTrainingPhotos();

  return (
    <div>
      <PhotoUploader />

      {photos.length === 0 ? (
        <p className="text-muted text-[14px] mt-6 text-center">
          아직 업로드된 사진이 없습니다.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-[4/3] rounded-[14px] overflow-hidden"
            >
              {photo.image !== null ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.image}
                  alt={photo.label}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{
                    background:
                      "repeating-linear-gradient(45deg, #eef1f4 0, #eef1f4 10px, #f7f9fb 10px, #f7f9fb 20px)",
                  }}
                />
              )}

              <span className="absolute bottom-2 left-2 bg-black/55 text-white text-[12px] font-medium rounded-md px-2 py-1">
                {photo.label}
              </span>

              <DeletePhotoButton id={photo.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 타입체크 + 린트**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: 통과 (이전 `ImageIcon`/`X`/`Image` import는 제거됨 — 미사용 import 경고 없음)

- [ ] **Step 3: 수동 확인(preview)** — 어드민 `/admin/photos` 접속(로그인 상태)

확인: 드롭존 표시 → JPG 1장 업로드 → 그리드에 카드 등장(파일명 칩) → X로 삭제 → 카드 사라짐. 콘솔/네트워크 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add "src/app/admin/(dashboard)/photos/page.tsx"
git commit -m "feat: 어드민 훈련사진 페이지 업로드·삭제 배선"
```

---

### Task 9: 공개 갤러리 연동 + 빈 상태

**Files:**
- Create: `src/lib/queries/photos.ts`
- Create: `src/app/(public)/photos/PhotosEmptyCta.tsx`
- Modify: `src/app/(public)/photos/TrainingGallery.tsx` (하드코딩 → prop)
- Modify: `src/app/(public)/photos/page.tsx` (DB 조회 + 빈 상태)

- [ ] **Step 1: 공개 쿼리 작성** — `src/lib/queries/photos.ts`

```ts
import { createPublicClient } from "@/lib/supabase/public";
import { publicUrl } from "@/lib/storage/keys";

/** 공개 훈련사진 갤러리 — 게시·미삭제 사진 URL 목록(최신 먼저). */
export async function getTrainingGalleryPhotos(): Promise<string[]> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("post")
    .select("images,created_at")
    .eq("category", "훈련사진")
    .eq("is_published", true)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .map((p) => p.images[0])
    .filter((k): k is string => Boolean(k))
    .map((k) => publicUrl(k));
}
```

- [ ] **Step 2: 빈 상태 CTA 작성** — `src/app/(public)/photos/PhotosEmptyCta.tsx`

```tsx
"use client";

import { Phone } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { useConsult } from "@/components/layout/SiteShell";
import { PHONE_MAIN } from "@/lib/data/site";

export function PhotosEmptyCta() {
  const { openConsult } = useConsult();
  return (
    <div style={{ textAlign: "center", padding: "48px 0" }}>
      <p className="text-muted text-[15px]">아직 등록된 훈련 사진이 없습니다.</p>
      <p className="text-muted text-[14px]" style={{ marginTop: 6, marginBottom: 18 }}>
        궁금한 점은 상담으로 편하게 문의해 주세요.
      </p>
      <div className="flex justify-center">
        <Button
          variant="primary"
          size="lg"
          leftIcon={<Phone size={20} strokeWidth={2.2} />}
          onClick={() => openConsult("consult")}
        >
          전화로 무료 상담
        </Button>
      </div>
      <a
        href={`tel:${PHONE_MAIN}`}
        className="text-[18px] font-bold text-primary no-underline"
        style={{ display: "inline-block", marginTop: 12 }}
      >
        {PHONE_MAIN}
      </a>
    </div>
  );
}
```

- [ ] **Step 3: 갤러리 prop화** — `src/app/(public)/photos/TrainingGallery.tsx`

(a) 모듈 상단 하드코딩 상수 삭제 — 다음 블록을 제거:
```ts
// /public/photos/training-detail/1.JPG … 25.JPG
const PHOTOS = Array.from(
  { length: 25 },
  (_, i) => `/photos/training-detail/${i + 1}.JPG`,
);
```

(b) 컴포넌트 시그니처를 prop 받도록 변경하고 함수 첫 줄에서 별칭:
```ts
export function TrainingGallery({ photos }: { photos: string[] }) {
  const PHOTOS = photos;
```
(기존 `export function TrainingGallery() {` 한 줄을 위 두 줄로 교체. 이후 본문의 모든 `PHOTOS` 참조는 그대로 동작.)

- [ ] **Step 4: 공개 페이지 배선** — `src/app/(public)/photos/page.tsx` (전체 교체)

```tsx
// T32 — 훈련 사진 갤러리 페이지
// 어드민에서 관리하는 훈련사진(post category='훈련사진')을 갤러리로 보여준다.

import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { TrainingGallery } from "./TrainingGallery";
import { PhotosEmptyCta } from "./PhotosEmptyCta";
import { getTrainingGalleryPhotos } from "@/lib/queries/photos";

export const metadata: Metadata = {
  title: "훈련 사진 — 성요셉목수학교",
  description:
    "실제 시공 현장과 같은 장비·공정으로 실습하는 훈련 현장을 사진으로 만나보세요.",
};

export default async function PhotosPage() {
  const photos = await getTrainingGalleryPhotos();

  return (
    <>
      <PageHero
        eyebrow="훈련 사진"
        title="현장과 같은 실습 환경"
        sub="보여주기식이 아닌, 실제와 같은 장비·공정으로 실습하는 훈련 현장을 사진으로 만나보세요."
      />
      <section className="wrap band" style={{ paddingTop: 36 }}>
        {photos.length === 0 ? (
          <PhotosEmptyCta />
        ) : (
          <TrainingGallery photos={photos} />
        )}
      </section>
    </>
  );
}
```

- [ ] **Step 5: 타입체크 + 린트**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: 통과

- [ ] **Step 6: 수동 확인(preview)** — 공개 `/photos` 접속

확인(시드 전): 사진이 없으면 빈 상태(상담 CTA) 표시. (Task 8에서 업로드한 1장이 있으면 그 1장이 갤러리에 표시되고 클릭 시 라이트박스.) 콘솔 에러 없음.

- [ ] **Step 7: 커밋**

```bash
git add src/lib/queries/photos.ts "src/app/(public)/photos/PhotosEmptyCta.tsx" "src/app/(public)/photos/TrainingGallery.tsx" "src/app/(public)/photos/page.tsx"
git commit -m "feat: 공개 훈련사진 갤러리를 DB 연동으로 전환 + 빈 상태"
```

---

### Task 10: 기존 25장 시드 스크립트

**Files:**
- Create: `scripts/seed-training-photos.mjs`
- Modify: `package.json` (scripts에 `seed:photos` 추가)

- [ ] **Step 1: 시드 스크립트 작성** — `scripts/seed-training-photos.mjs`

```js
// 기존 public/photos/training-detail/1~25.JPG 를 Supabase Storage 버킷으로 이전하고
// post(category='훈련사진') 행을 생성한다. 일회성. 키는 seed-01..25.jpg.
// 실행: pnpm seed:photos  (= node --env-file=.env.local scripts/seed-training-photos.mjs)
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("환경변수 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY 가 필요합니다.");
  process.exit(1);
}

const BUCKET = "training-photos";
const COUNT = 25;
const dir = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "photos",
  "training-detail",
);

const sb = createClient(url, key, { auth: { persistSession: false } });

for (let i = 1; i <= COUNT; i++) {
  const buf = await readFile(join(dir, `${i}.JPG`));
  const objectKey = `seed-${String(i).padStart(2, "0")}.jpg`;

  const up = await sb.storage
    .from(BUCKET)
    .upload(objectKey, buf, { contentType: "image/jpeg", upsert: true });
  if (up.error) {
    console.error(`업로드 실패 ${i}:`, up.error.message);
    process.exit(1);
  }

  const ins = await sb
    .from("post")
    .insert({ category: "훈련사진", title: `훈련 현장 사진 ${i}`, images: [objectKey] });
  if (ins.error) {
    console.error(`행 생성 실패 ${i}:`, ins.error.message);
    process.exit(1);
  }
  console.log(`✓ ${i}/${COUNT}`);
}
console.log("완료: 25장 이전");
```

- [ ] **Step 2: package.json 스크립트 추가** — `scripts`에 한 줄 추가

```json
    "seed:photos": "node --env-file=.env.local scripts/seed-training-photos.mjs",
```
(주의: Node 20.6+ 필요. 그 미만이면 `NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SECRET_KEY=... node scripts/seed-training-photos.mjs`로 실행.)

- [ ] **Step 3: 로컬 실행**

Run: `pnpm seed:photos`
Expected: `✓ 1/25` … `✓ 25/25`, `완료: 25장 이전`.

- [ ] **Step 4: 확인(preview)** — 공개 `/photos` 새로고침

확인: 25장(+이전 테스트 업로드분)이 justified 그리드로 표시. 어드민 `/admin/photos`에도 동일 카드들.

- [ ] **Step 5: 커밋**

```bash
git add scripts/seed-training-photos.mjs package.json
git commit -m "chore: 기존 훈련사진 25장 버킷 이전 시드 스크립트"
```

---

### Task 11: 정적 25장 제거 + .env.example 정리

**Files:**
- Delete: `public/photos/training-detail/1~25.JPG`
- Modify: `.env.example` (S3 섹션 주석 현행화)

- [ ] **Step 1: 정적 파일 제거** (시드가 성공해 버킷이 단일 소스가 된 뒤)

Run: `git rm "public/photos/training-detail/"*.JPG`
Expected: 25개 파일 stage된 삭제.

- [ ] **Step 2: .env.example 현행화** — S3 섹션 주석 교체

기존:
```
# S3 (훈련사진 등 이미지) — 어드민 presigned 업로드
```
교체:
```
# 이미지 저장: 현재는 Supabase Storage 공개 버킷 'training-photos' 사용(마이그레이션으로 생성).
# 아래 S3 변수는 미래 S3 드라이버(src/lib/storage) 교체용 예약 — 현재 미사용.
```

- [ ] **Step 3: 빌드 확인**

Run: `pnpm build`
Expected: 빌드 성공(정적 파일 참조 없음 — 하드코딩 제거 완료).

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit -m "chore: 훈련사진 정적 25장 제거(버킷 이전 완료)·env 주석 현행화"
```

---

## 배포 시 주의(운영 환경)

1. 마이그레이션 적용(버킷 생성): Supabase 클라우드에 `supabase db push` 등으로 `20260620140000_training_photos_bucket.sql` 반영.
2. 운영 env(`.env`/배포 시크릿)로 시드 1회: `NEXT_PUBLIC_SUPABASE_URL=<운영> SUPABASE_SECRET_KEY=<운영> node scripts/seed-training-photos.mjs`.
   - **시드 전에는 공개 `/photos`가 빈 상태**(상담 CTA)로 보인다 — 마이그레이션·배포 직후 시드를 실행할 것.
3. 정적 25장 제거 커밋이 배포에 포함되므로, 시드가 끝난 뒤 갤러리는 버킷에서 읽는다.

## 전체 검증

- [ ] `pnpm test` — 전체 단위 테스트 통과(keys, forms 포함)
- [ ] `pnpm lint` — 통과
- [ ] `pnpm build` — 통과
- [ ] 수동: 어드민 업로드(다중) → 공개 반영 → 어드민 삭제 → 공개에서 사라짐(버킷 객체도 제거)
