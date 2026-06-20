"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "@/components/icons";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { deleteTrainingPhoto } from "./actions";

export function DeletePhotoButton({ id }: { id: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    if (pending) return;
    setPending(true);
    setError(null);
    const res = await deleteTrainingPhoto(id);
    if (!res.ok) {
      setError(res.error);
      setPending(false);
      return;
    }
    setPending(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 inline-flex items-center justify-center hover:bg-error-soft hover:text-error"
        aria-label="삭제"
      >
        <X size={14} />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="훈련사진 삭제">
        <div className="flex flex-col gap-4">
          <p className="text-[15px] text-body-strong leading-[1.6]">
            이 사진을 삭제할까요?
            <br />
            삭제하면 되돌릴 수 없습니다.
          </p>
          {error && <p className="text-[13px] text-error">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setOpen(false)}>
              취소
            </Button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={pending}
              className="inline-flex items-center justify-center rounded-button font-semibold leading-none tracking-[-0.2px] whitespace-nowrap transition active:scale-[0.98] h-10 px-4 text-[15px] bg-error text-white border border-error hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "삭제 중…" : "삭제"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
