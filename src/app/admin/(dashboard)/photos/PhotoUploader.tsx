"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon } from "@/components/icons";
import { validatePhotoFile } from "@/lib/storage/keys";
import { uploadToTarget } from "@/lib/storage/client";
import { downscaleImage } from "@/lib/storage/downscale";
import { Select } from "@/components/ui/Select";
import { LEAF_CATEGORIES, LEAF_LABELS, type LeafCategory } from "@/lib/gallery/categories";
import { createUploadTarget, addTrainingPhotos } from "./actions";

const CATEGORY_OPTIONS = [
  { value: "", label: "카테고리를 선택하세요" },
  ...LEAF_CATEGORIES.map((c) => ({ value: c, label: LEAF_LABELS[c] })),
];

export function PhotoUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<LeafCategory | "">("");
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    setError(null);
    if (!category) {
      setError("먼저 카테고리를 선택해 주세요.");
      return;
    }
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    for (const f of files) {
      const msg = validatePhotoFile(f);
      if (msg) {
        setError(msg);
        return;
      }
    }

    setBusy(true);
    try {
      const photos: { key: string; label: string }[] = [];
      for (const f of files) {
        const blob = await downscaleImage(f);
        const t = await createUploadTarget(blob.type || "image/jpeg");
        if (!t.ok) {
          setError(t.error);
          return;
        }
        await uploadToTarget(t.target, blob);
        photos.push({ key: t.target.key, label: f.name.replace(/\.[^.]+$/, "") });
      }
      const res = await addTrainingPhotos({ galleryCategory: category, photos });
      if (!res.ok) {
        setError(res.error);
        return;
      }
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
      <label className="block text-[14px] font-bold text-body-strong mb-2">
        카테고리 선택
      </label>
      <div className="mb-3">
        <Select
          value={category}
          options={CATEGORY_OPTIONS}
          onChange={(v) => setCategory(v as LeafCategory | "")}
          ariaLabel="카테고리 선택"
        />
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handleFiles(e.dataTransfer.files);
        }}
        disabled={busy || !category}
        className={`w-full border-2 border-dashed rounded-lg py-12 flex flex-col items-center justify-center gap-2 bg-primary-softer disabled:opacity-60 ${drag ? "border-primary" : "border-primary-border"}`}
      >
        <ImageIcon size={28} className="text-primary" />
        <p className="text-body-strong text-[15px] font-bold">
          {busy ? "업로드 중…" : "사진을 끌어다 놓거나 클릭해서 업로드"}
        </p>
        <p className="text-muted text-[13px]">JPG·PNG · 업로드 시 자동 축소</p>
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
