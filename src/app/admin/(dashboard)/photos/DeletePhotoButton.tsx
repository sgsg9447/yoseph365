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
