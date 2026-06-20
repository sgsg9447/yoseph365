"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import type { CurriculumEditRow } from "@/lib/queries/admin";
import { parseLines } from "@/lib/admin/banner";
import { Button } from "@/components/ui/Button";
import { updateCurriculum } from "./actions";

interface RowDraft {
  round: string;
  unit: string;
  contents: string; // 줄 단위
  hours: string;
  place: string;
}

function toDraft(r: CurriculumEditRow): RowDraft {
  return {
    round: String(r.round),
    unit: r.unit,
    contents: r.contents.join("\n"),
    hours: r.hours == null ? "" : String(r.hours),
    place: r.place,
  };
}

const inputCls =
  "w-full bg-surface-card text-ink text-[14px] rounded-[6px] border border-hairline px-2.5 py-1.5 outline-none focus:border-primary focus:bg-white";

export function CurriculumEditor({
  courseId,
  initial,
}: {
  courseId: string;
  initial: CurriculumEditRow[];
}) {
  const [rows, setRows] = useState<RowDraft[]>(() => initial.map(toDraft));
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function patch(i: number, key: keyof RowDraft, val: string) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
    setMsg(null);
  }
  function addRow() {
    const nextRound = rows.length ? Math.max(...rows.map((r) => Number(r.round) || 0)) + 1 : 1;
    setRows((prev) => [...prev, { round: String(nextRound), unit: "", contents: "", hours: "", place: "" }]);
  }
  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
    setMsg(null);
  }

  function save() {
    setMsg(null);
    start(async () => {
      const payload = {
        courseId,
        rows: rows.map((r) => ({
          round: Number(r.round) || 0,
          unit: r.unit,
          contents: parseLines(r.contents),
          hours: r.hours.trim() === "" ? null : Number(r.hours),
          place: r.place,
        })),
      };
      const res = await updateCurriculum(payload);
      setMsg(res.ok ? { ok: true, text: "저장되었습니다." } : { ok: false, text: res.error });
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="hidden md:grid grid-cols-[48px_1.2fr_2fr_56px_1fr_32px] gap-2 text-[12px] font-semibold text-muted px-1">
        <span>회차</span>
        <span>능력단위</span>
        <span>훈련내용(줄바꿈으로 구분)</span>
        <span>시간</span>
        <span>교육장소</span>
        <span />
      </div>
      {rows.map((r, i) => (
        <div
          key={i}
          className="grid grid-cols-2 md:grid-cols-[48px_1.2fr_2fr_56px_1fr_32px] gap-2 items-start border-t border-hairline-soft pt-2"
        >
          <input className={inputCls} value={r.round} onChange={(e) => patch(i, "round", e.target.value)} />
          <input className={inputCls} value={r.unit} onChange={(e) => patch(i, "unit", e.target.value)} placeholder="능력단위" />
          <AutoGrowTextarea
            className={inputCls}
            value={r.contents}
            onChange={(v) => patch(i, "contents", v)}
            placeholder="훈련내용(여러 줄 가능)"
          />
          <input className={inputCls} value={r.hours} onChange={(e) => patch(i, "hours", e.target.value)} placeholder="6" />
          <input className={inputCls} value={r.place} onChange={(e) => patch(i, "place", e.target.value)} placeholder="강의실" />
          <button
            type="button"
            onClick={() => removeRow(i)}
            aria-label="행 삭제"
            className="h-8 text-muted hover:text-error"
          >
            ✕
          </button>
        </div>
      ))}

      <div className="flex items-center justify-between mt-2">
        <Button variant="outline" size="sm" onClick={addRow}>
          + 회차 추가
        </Button>
        <div className="flex items-center gap-3">
          {msg && <span className={`text-[13px] ${msg.ok ? "text-success" : "text-error"}`}>{msg.text}</span>}
          <Button size="sm" onClick={save} disabled={pending}>
            {pending ? "저장 중…" : "커리큘럼 저장"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** 내용 높이에 맞춰 자동으로 늘어나는 textarea — 한 줄일 땐 다른 입력칸과 같은 높이. */
function AutoGrowTextarea({
  value,
  onChange,
  className,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`; // +2 = 위·아래 1px 테두리 보정
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      className={className}
      style={{ resize: "none", overflow: "hidden" }}
    />
  );
}
