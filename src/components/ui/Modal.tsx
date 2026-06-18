"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { X } from "@/components/icons";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/** 중앙 정렬 모달. 오버레이 클릭·Esc·닫기 버튼으로 닫힌다. */
export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-hairline bg-surface-card shadow-pop">
        <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-4">
          {title ? <h2 className="text-[16px] font-bold text-ink">{title}</h2> : <span />}
          <button type="button" onClick={onClose} aria-label="닫기" className="text-muted hover:text-ink">
            <X size={20} />
          </button>
        </div>
        <div className="scrollbar-clean overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
