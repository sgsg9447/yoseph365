"use client";

import { X } from "@/components/icons";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  if (!open) return null;

  return (
    // Dim overlay — click outside to close
    <div
      onClick={onClose}
      className="fixed inset-0 z-60 flex items-end justify-center bg-[rgba(12,10,9,0.5)]"
    >
      {/* Panel — stop propagation so clicks inside don't close */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] bg-surface-card rounded-[20px_20px_0_0] px-[22px] pt-[10px] pb-7 shadow-pop max-h-[92vh] overflow-y-auto"
        style={{ animation: "sheetUp .24s cubic-bezier(0.2,0,0,1)" }}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 rounded-full bg-hairline-strong mx-auto mb-[18px]" />

        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[20px] font-bold text-ink tracking-[-0.3px] m-0">{title}</h3>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="w-9 h-9 grid place-items-center rounded-full bg-surface-strong border-none text-body cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
