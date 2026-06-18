"use client";

import { useState } from "react";

interface FilterPillsProps {
  items: string[];
  /** 초기 선택 항목 */
  active: string;
  /** 선택이 바뀔 때 호출(선택) */
  onChange?: (item: string) => void;
}

export function FilterPills({ items, active, onChange }: FilterPillsProps) {
  const [selected, setSelected] = useState(active);

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive = item === selected;
        return (
          <button
            key={item}
            type="button"
            aria-pressed={isActive}
            onClick={() => {
              setSelected(item);
              onChange?.(item);
            }}
            className={[
              "rounded-full px-4 h-9 text-[14px] font-semibold inline-flex items-center transition",
              isActive
                ? "bg-primary text-white"
                : "bg-transparent text-body border border-hairline-strong hover:bg-hairline-soft",
            ].join(" ")}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}
