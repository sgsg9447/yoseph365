"use client";

import { useState, useTransition } from "react";
import type { ApplyInfoView } from "@/lib/queries/types";
import { parseLines } from "@/lib/admin/banner";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { updateApplyInfo } from "./actions";

interface Draft {
  qualifications: string;
  applyMethod: string;
  recruitPeriod: string;
  trainingPeriod: string;
  trainingTime: string;
  capacity: string;
  cost: string;
  costNotes: string;
  steps: string;
  exclusions: string;
}

function toDraft(v: ApplyInfoView | null): Draft {
  return {
    qualifications: (v?.qualifications ?? []).join("\n"),
    applyMethod: (v?.applyMethod ?? []).join("\n"),
    recruitPeriod: v?.recruitPeriod ?? "",
    trainingPeriod: v?.trainingPeriod ?? "",
    trainingTime: (v?.trainingTime ?? []).join("\n"),
    capacity: v?.capacity ?? "",
    cost: v?.cost ?? "",
    costNotes: (v?.costNotes ?? []).join("\n"),
    steps: (v?.steps ?? []).join("\n"),
    exclusions: (v?.exclusions ?? []).join("\n"),
  };
}

export function ApplyInfoEditor({
  courseId,
  initial,
}: {
  courseId: string;
  initial: ApplyInfoView | null;
}) {
  const [d, setD] = useState<Draft>(() => toDraft(initial));
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function set<K extends keyof Draft>(key: K, val: string) {
    setD((p) => ({ ...p, [key]: val }));
    setMsg(null);
  }

  function save() {
    setMsg(null);
    start(async () => {
      const res = await updateApplyInfo({
        courseId,
        qualifications: parseLines(d.qualifications),
        applyMethod: parseLines(d.applyMethod),
        recruitPeriod: d.recruitPeriod,
        trainingPeriod: d.trainingPeriod,
        trainingTime: parseLines(d.trainingTime),
        capacity: d.capacity,
        cost: d.cost,
        costNotes: parseLines(d.costNotes),
        steps: parseLines(d.steps),
        exclusions: parseLines(d.exclusions),
      });
      setMsg(res.ok ? { ok: true, text: "저장되었습니다." } : { ok: false, text: res.error });
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] text-muted">여러 줄 항목은 한 줄에 하나씩 입력하세요.</p>
      <Field as="textarea" rows={3} label="신청자격" value={d.qualifications} onChange={(e) => set("qualifications", e.target.value)} />
      <Field as="textarea" rows={2} label="지원방법" value={d.applyMethod} onChange={(e) => set("applyMethod", e.target.value)} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="모집기간" value={d.recruitPeriod} onChange={(e) => set("recruitPeriod", e.target.value)} />
        <Field label="훈련기간" value={d.trainingPeriod} onChange={(e) => set("trainingPeriod", e.target.value)} />
        <Field label="모집인원" value={d.capacity} onChange={(e) => set("capacity", e.target.value)} />
        <Field label="훈련비용" value={d.cost} onChange={(e) => set("cost", e.target.value)} />
      </div>
      <Field as="textarea" rows={3} label="훈련시간" value={d.trainingTime} onChange={(e) => set("trainingTime", e.target.value)} />
      <Field as="textarea" rows={2} label="비용 비고(자비부담 등)" value={d.costNotes} onChange={(e) => set("costNotes", e.target.value)} />
      <Field as="textarea" rows={3} label="진행순서" value={d.steps} onChange={(e) => set("steps", e.target.value)} />
      <Field as="textarea" rows={3} label="신청제외대상" value={d.exclusions} onChange={(e) => set("exclusions", e.target.value)} />

      <div className="flex items-center justify-end gap-3">
        {msg && <span className={`text-[13px] ${msg.ok ? "text-success" : "text-error"}`}>{msg.text}</span>}
        <Button size="sm" onClick={save} disabled={pending}>
          {pending ? "저장 중…" : "신청안내 저장"}
        </Button>
      </div>
    </div>
  );
}
