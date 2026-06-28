"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, X } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { validatePhotoFile } from "@/lib/storage/keys";
import { uploadToTarget } from "@/lib/storage/client";
import { createUploadTarget, addTrainingPhotos } from "./actions";
import { MosaicEditor } from "@/components/admin/MosaicEditor";

type Staged = {
  id: string;
  file: File;
  edited: Blob | null;
  previewUrl: string;
};

export function PhotoUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [staged, setStaged] = useState<Staged[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 언마운트 시 미리보기 URL 정리 (최신 staged를 ref로 미러링)
  const stagedRef = useRef<Staged[]>([]);
  useEffect(() => {
    stagedRef.current = staged;
  }, [staged]);
  useEffect(() => () => stagedRef.current.forEach((s) => URL.revokeObjectURL(s.previewUrl)), []);

  function addFiles(fileList: FileList | null) {
    setError(null);
    if (!fileList || fileList.length === 0) return;
    const incoming = Array.from(fileList);
    for (const f of incoming) {
      const msg = validatePhotoFile(f);
      if (msg) {
        setError(msg);
        return;
      }
    }
    setStaged((prev) => [
      ...prev,
      ...incoming.map((f) => ({
        id: crypto.randomUUID(),
        file: f,
        edited: null as Blob | null,
        previewUrl: URL.createObjectURL(f),
      })),
    ]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeItem(id: string) {
    setStaged((prev) => {
      const item = prev.find((s) => s.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((s) => s.id !== id);
    });
  }

  function handleEditDone(id: string, blob: Blob) {
    setStaged((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        URL.revokeObjectURL(s.previewUrl);
        return { ...s, edited: blob, previewUrl: URL.createObjectURL(blob) };
      }),
    );
    setEditingId(null);
  }

  async function uploadAll() {
    if (staged.length === 0 || busy) return;
    setError(null);
    setBusy(true);
    try {
      const photos: { key: string; label: string }[] = [];
      for (const s of staged) {
        const up = s.edited ?? s.file;
        const msg = validatePhotoFile(up);
        if (msg) {
          setError(msg);
          setBusy(false);
          return;
        }
        const t = await createUploadTarget(up.type);
        if (!t.ok) {
          setError(t.error);
          setBusy(false);
          return;
        }
        await uploadToTarget(t.target, up);
        photos.push({ key: t.target.key, label: s.file.name.replace(/\.[^.]+$/, "") });
      }
      const res = await addTrainingPhotos({ photos });
      if (!res.ok) {
        setError(res.error);
        setBusy(false);
        return;
      }
      staged.forEach((s) => URL.revokeObjectURL(s.previewUrl));
      setStaged([]);
      router.refresh();
    } catch {
      setError("업로드 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  const editing = staged.find((s) => s.id === editingId) ?? null;

  return (
    <div>
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
          addFiles(e.dataTransfer.files);
        }}
        disabled={busy}
        className={`w-full border-2 border-dashed rounded-lg py-12 flex flex-col items-center justify-center gap-2 bg-primary-softer disabled:opacity-60 ${drag ? "border-primary" : "border-primary-border"}`}
      >
        <ImageIcon size={28} className="text-primary" />
        <p className="text-body-strong text-[15px] font-bold">사진을 끌어다 놓거나 클릭해서 추가</p>
        <p className="text-muted text-[13px]">JPG·PNG 최대 10MB · 업로드 전 모자이크 편집 가능</p>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        hidden
        onChange={(e) => addFiles(e.target.files)}
      />

      {error && <p className="text-error text-[13px] mt-2">{error}</p>}

      {staged.length > 0 && (
        <>
          <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {staged.map((s) => (
              <li
                key={s.id}
                className="rounded-lg border border-hairline overflow-hidden bg-surface-card"
              >
                <div className="relative aspect-[4/3] bg-[#0c0c0c]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.previewUrl} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeItem(s.id)}
                    disabled={busy}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 inline-flex items-center justify-center hover:bg-error-soft hover:text-error"
                    aria-label="제거"
                  >
                    <X size={14} />
                  </button>
                  {s.edited && (
                    <span className="absolute bottom-2 left-2 text-[11px] font-semibold text-white bg-primary/90 rounded px-1.5 py-0.5">
                      모자이크 적용됨
                    </span>
                  )}
                </div>
                <div className="p-2">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    fullWidth
                    disabled={busy}
                    onClick={() => setEditingId(s.id)}
                  >
                    모자이크 편집
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex justify-end">
            <Button variant="primary" size="sm" type="button" disabled={busy} onClick={uploadAll}>
              {busy ? "업로드 중…" : `${staged.length}장 업로드`}
            </Button>
          </div>
        </>
      )}

      {editing && (
        <MosaicEditor
          file={editing.file}
          onDone={(blob) => handleEditDone(editing.id, blob)}
          onCancel={() => setEditingId(null)}
        />
      )}
    </div>
  );
}
