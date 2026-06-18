"use client";

import { useEffect, useRef, useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
}

/**
 * 상담문의(InterestCoursePicker)와 동일한 드롭다운 UI.
 * 버튼 + 쉐브론, 선택 옵션은 primary-soft 강조. 바깥 클릭 시 닫힘.
 */
export function Select({ value, options, onChange, ariaLabel }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative rounded-[14px] border border-hairline-strong bg-surface-card"
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-[11px] text-left"
      >
        <span className="min-w-0 truncate text-[15px] font-bold text-ink">
          {selected?.label ?? ""}
        </span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className="flex-none transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-72 overflow-auto rounded-[14px] border border-hairline bg-surface-card shadow-pop">
          {options.map((o, i) => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={[
                  "block w-full px-4 py-3 text-left text-[15px]",
                  i === options.length - 1 ? "" : "border-b border-hairline-soft",
                  active ? "bg-primary-soft text-primary font-bold" : "text-body-strong font-semibold",
                ].join(" ")}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
