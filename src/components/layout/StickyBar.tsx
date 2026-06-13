"use client";

import { Phone } from "@/components/icons";

interface StickyBarProps {
  onConsult?: () => void;
}

export function StickyBar({ onConsult }: StickyBarProps) {
  return (
    // .sticky-bar class: fixed bottom-right, hidden ≥760px via globals.css
    <div className="sticky-bar" style={{ position: "fixed", bottom: 20, right: 16, zIndex: 40 }}>
      <button
        onClick={onConsult}
        aria-label="상담문의"
        className="inline-flex items-center gap-[9px] h-14 px-[22px] rounded-full bg-primary text-white border-none text-[16.5px] font-bold cursor-pointer font-[inherit]"
        style={{ boxShadow: "0 8px 24px rgba(37,99,235,0.38), 0 2px 6px rgba(26,26,24,0.18)" }}
      >
        <Phone size={20} strokeWidth={2.2} />
        상담문의
      </button>
    </div>
  );
}
