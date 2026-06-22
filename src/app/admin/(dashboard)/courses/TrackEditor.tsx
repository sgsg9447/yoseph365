"use client";

import { useState, useTransition } from "react";
import type { TrackEditRow, TrackExamEditRow } from "@/lib/queries/admin";
import { parseLines } from "@/lib/admin/banner";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { updateTrack } from "./actions";

const STATUSES = ["모집예정", "모집중", "마감"] as const;

const inputCls =
  "w-full bg-surface-card text-ink text-[14px] rounded-[6px] border border-hairline px-2.5 py-1.5 outline-none focus:border-primary focus:bg-white";

interface ExamDraft {
  round: string;
  applyStart: string;
  applyEnd: string;
  examStart: string;
  examEnd: string;
  result1: string;
  result2: string;
}

function toExamDraft(e: TrackExamEditRow): ExamDraft {
  return {
    round: e.round,
    applyStart: e.applyStart,
    applyEnd: e.applyEnd,
    examStart: e.examStart,
    examEnd: e.examEnd,
    result1: e.resultDates[0] ?? "",
    result2: e.resultDates[1] ?? "",
  };
}

export function TrackEditor({ courseId, initial }: { courseId: string; initial: TrackEditRow[] }) {
  if (initial.length === 0) {
    return <p className="text-[14px] text-muted">등록된 트랙이 없습니다.</p>;
  }
  return (
    <div className="flex flex-col gap-6">
      {initial.map((t) => (
        <TrackBlock key={t.id} courseId={courseId} track={t} />
      ))}
    </div>
  );
}

function TrackBlock({ courseId, track }: { courseId: string; track: TrackEditRow }) {
  const [name, setName] = useState(track.name);
  const [description, setDescription] = useState(track.description);
  const [sessionsTotal, setSessionsTotal] = useState(
    track.sessionsTotal == null ? "" : String(track.sessionsTotal),
  );
  const [price, setPrice] = useState(track.price == null ? "" : String(track.price));
  const [scheduleSummary, setScheduleSummary] = useState(track.scheduleSummary.join("\n"));
  const [recruitStatus, setRecruitStatus] = useState<TrackEditRow["recruitStatus"]>(
    track.recruitStatus,
  );
  const [year, setYear] = useState(String(track.year));
  const [exams, setExams] = useState<ExamDraft[]>(() => track.exams.map(toExamDraft));
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function patchExam(i: number, key: keyof ExamDraft, val: string) {
    setExams((prev) => prev.map((e, idx) => (idx === i ? { ...e, [key]: val } : e)));
    setMsg(null);
  }
  function addExam() {
    setExams((prev) => [
      ...prev,
      { round: "", applyStart: "", applyEnd: "", examStart: "", examEnd: "", result1: "", result2: "" },
    ]);
    setMsg(null);
  }
  function removeExam(i: number) {
    setExams((prev) => prev.filter((_, idx) => idx !== i));
    setMsg(null);
  }

  function save() {
    setMsg(null);
    start(async () => {
      const res = await updateTrack({
        courseId,
        trackId: track.id,
        name,
        description,
        sessionsTotal: sessionsTotal.trim() === "" ? null : Number(sessionsTotal),
        price: price.trim() === "" ? null : Number(price),
        scheduleSummary: parseLines(scheduleSummary),
        recruitStatus,
        year: Number(year) || 0,
        exams: exams.map((e) => ({
          round: e.round,
          applyStart: e.applyStart,
          applyEnd: e.applyEnd,
          examStart: e.examStart,
          examEnd: e.examEnd,
          resultDates: [e.result1, e.result2],
        })),
      });
      setMsg(res.ok ? { ok: true, text: "저장되었습니다." } : { ok: false, text: res.error });
    });
  }

  return (
    <div className="rounded-xl border border-hairline-strong p-4">
      {/* 트랙 헤더: 이름 + 모집상태 */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[14px] font-bold text-ink">{track.name}</span>
        <div className="flex items-center gap-2 text-[13px] text-muted">
          모집상태
          <div className="w-28">
            <Select
              value={recruitStatus}
              ariaLabel={`${track.name} 모집상태`}
              options={STATUSES.map((s) => ({ value: s, label: s }))}
              onChange={(v) => {
                setRecruitStatus(v as TrackEditRow["recruitStatus"]);
                setMsg(null);
              }}
            />
          </div>
        </div>
      </div>

      {/* 트랙 기본정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field
          label="트랙명"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setMsg(null);
          }}
        />
        <Field
          label="설명"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setMsg(null);
          }}
          placeholder="예: 건축목공기능사 속성 대비반"
        />
        <Field
          label="가격 (원)"
          type="number"
          value={price}
          onChange={(e) => {
            setPrice(e.target.value);
            setMsg(null);
          }}
          placeholder="예: 600000"
        />
        <Field
          label="회차 수"
          type="number"
          value={sessionsTotal}
          onChange={(e) => {
            setSessionsTotal(e.target.value);
            setMsg(null);
          }}
          placeholder="예: 5"
        />
        <div className="md:col-span-2">
          <Field
            label="시간 요약 (줄바꿈으로 구분)"
            as="textarea"
            rows={2}
            value={scheduleSummary}
            onChange={(e) => {
              setScheduleSummary(e.target.value);
              setMsg(null);
            }}
            placeholder={"예:\n4회 09:00~17:00 (1일 8시간)\n1회 09:00~14:00 (1일 5시간)"}
          />
        </div>
      </div>

      {/* 실기 시험일정 */}
      <div className="mt-4 flex items-center justify-between">
        <h4 className="text-[14px] font-bold text-ink">실기 시험일정</h4>
        <label className="flex items-center gap-2 text-[13px] text-muted">
          시험 연도
          <input
            className={`${inputCls} w-24`}
            type="number"
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              setMsg(null);
            }}
            placeholder="2026"
          />
        </label>
      </div>

      <div className="mt-2 flex flex-col gap-2">
        {exams.map((e, i) => (
          <div key={i} className="rounded-lg border border-hairline p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-[13px] text-muted">
                회차
                <input
                  className={`${inputCls} w-28`}
                  value={e.round}
                  onChange={(ev) => patchExam(i, "round", ev.target.value)}
                  placeholder="제1회"
                />
              </label>
              <button
                type="button"
                onClick={() => removeExam(i)}
                aria-label="회차 삭제"
                className="h-8 px-1 text-muted hover:text-error"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <DatePair
                label="실기 접수"
                sep="~"
                a={e.applyStart}
                b={e.applyEnd}
                onA={(v) => patchExam(i, "applyStart", v)}
                onB={(v) => patchExam(i, "applyEnd", v)}
              />
              <DatePair
                label="실기 시험"
                sep="~"
                a={e.examStart}
                b={e.examEnd}
                onA={(v) => patchExam(i, "examStart", v)}
                onB={(v) => patchExam(i, "examEnd", v)}
              />
              <DatePair
                label="합격 발표"
                sep=","
                a={e.result1}
                b={e.result2}
                onA={(v) => patchExam(i, "result1", v)}
                onB={(v) => patchExam(i, "result2", v)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={addExam}>
          + 회차 추가
        </Button>
        <div className="flex items-center gap-3">
          {msg && (
            <span className={`text-[13px] ${msg.ok ? "text-success" : "text-error"}`}>
              {msg.text}
            </span>
          )}
          <Button size="sm" onClick={save} disabled={pending}>
            {pending ? "저장 중…" : `${track.name} 저장`}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** 라벨 + 날짜 두 칸(접수/시험은 "~" 기간, 발표는 "," 복수일). */
function DatePair({
  label,
  sep,
  a,
  b,
  onA,
  onB,
}: {
  label: string;
  sep: string;
  a: string;
  b: string;
  onA: (v: string) => void;
  onB: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12px] font-semibold text-muted">{label}</span>
      <div className="flex items-center gap-1">
        <input className={inputCls} type="date" value={a} onChange={(e) => onA(e.target.value)} />
        <span className="text-muted text-[13px]">{sep}</span>
        <input className={inputCls} type="date" value={b} onChange={(e) => onB(e.target.value)} />
      </div>
    </div>
  );
}
