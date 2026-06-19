"use client";

import { useMemo, useState } from "react";
import type { InquiryView } from "@/lib/queries/admin";
import { countByDate, buildMonth } from "@/lib/admin/calendar";
import { Card } from "@/components/ui/Card";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** 월간 캘린더 — 날짜별 상담 건수 표시, 날짜 클릭 시 해당일 필터. */
export function ConsultCalendar({
  rows,
  selected,
  onSelect,
}: {
  rows: InquiryView[];
  selected: string | null;
  onSelect: (date: string | null) => void;
}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12

  const counts = useMemo(() => countByDate(rows), [rows]);
  const cells = useMemo(() => buildMonth(year, month), [year, month]);

  function move(delta: number) {
    const m = month + delta;
    if (m < 1) {
      setYear(year - 1);
      setMonth(12);
    } else if (m > 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(m);
    }
  }

  return (
    <Card padding={16}>
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => move(-1)} className="px-2 py-1 text-muted hover:text-ink" aria-label="이전 달">
          ‹
        </button>
        <span className="text-[15px] font-bold text-ink">
          {year}. {String(month).padStart(2, "0")}
        </span>
        <button type="button" onClick={() => move(1)} className="px-2 py-1 text-muted hover:text-ink" aria-label="다음 달">
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-[12px] font-semibold text-muted py-1">
            {w}
          </div>
        ))}
        {cells.map((c, i) => {
          if (!c.inMonth) return <div key={`b${i}`} />;
          const count = counts[c.date!] ?? 0;
          const isSel = selected === c.date;
          return (
            <button
              key={c.date}
              type="button"
              onClick={() => onSelect(isSel ? null : c.date)}
              className={[
                "aspect-square rounded-lg flex flex-col items-center justify-center text-[13px] transition",
                isSel
                  ? "bg-primary text-white"
                  : count > 0
                    ? "bg-primary-soft text-primary hover:bg-primary-border"
                    : "text-body hover:bg-hairline-soft",
              ].join(" ")}
            >
              <span>{c.day}</span>
              {count > 0 && (
                <span className={`text-[11px] font-bold ${isSel ? "text-white" : "text-primary"}`}>
                  {count}건
                </span>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
