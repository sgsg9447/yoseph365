"use client";

// 기존 사진 모자이크 편집 → 새 키로 업로드 후 이미지 교체.
// 공개 URL을 fetch해 로컬 File로 만든 뒤 편집기에 넘긴다(캔버스 오염 방지).

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MosaicEditor } from "@/components/admin/MosaicEditor";
import { downscaleImage } from "@/lib/storage/downscale";
import { uploadToTarget } from "@/lib/storage/client";
import { createUploadTarget, replacePhotoImage } from "./actions";

export function EditPhotoButton({
  id,
  image,
  label,
}: {
  id: number;
  image: string;
  label: string;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(image);
      if (!res.ok) throw new Error("load failed");
      const blob = await res.blob();
      setFile(new File([blob], `${label || "photo"}.jpg`, { type: blob.type || "image/jpeg" }));
    } catch {
      setError("사진을 불러오지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function onDone(edited: Blob) {
    setBusy(true);
    setError(null);
    try {
      const blob = await downscaleImage(edited);
      const t = await createUploadTarget(blob.type || "image/jpeg");
      if (!t.ok) {
        setError(t.error);
        return;
      }
      await uploadToTarget(t.target, blob);
      const res = await replacePhotoImage({ id, key: t.target.key });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setFile(null);
      router.refresh();
    } catch {
      setError("교체 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        disabled={busy}
        className="absolute bottom-2 right-2 rounded-md px-2 py-1 text-[12px] font-bold bg-black/55 text-white disabled:opacity-60"
      >
        {busy ? "처리 중…" : "모자이크 편집"}
      </button>
      {error && (
        <span className="absolute top-10 left-2 right-2 text-center text-[11px] text-white bg-error/90 rounded px-1 py-0.5">
          {error}
        </span>
      )}
      {file && <MosaicEditor file={file} onDone={onDone} onCancel={() => setFile(null)} />}
    </>
  );
}
