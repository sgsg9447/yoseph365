"use client";

import { useState, useTransition } from "react";
import type { CourseEditView, CourseBundle } from "@/lib/queries/admin";
import { parseCsvList } from "@/lib/admin/parse";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { updateCourse } from "./actions";
import { CurriculumEditor } from "./CurriculumEditor";
import { ApplyInfoEditor } from "./ApplyInfoEditor";
import { TrackEditor } from "./TrackEditor";

const STATUSES = ["모집예정", "모집중", "마감"] as const;

interface Draft {
  name: string;
  summary: string;
  skills: string; // 쉼표 구분 입력
  tuition: string;
  selfPay: string;
  sessionsTotal: string;
  sessionHours: string;
  totalHours: string;
  recruitStatus: CourseEditView["recruitStatus"];
}

function toDraft(c: CourseEditView): Draft {
  return {
    name: c.name,
    summary: c.summary,
    skills: c.skills.join(", "),
    tuition: c.tuition,
    selfPay: c.selfPay,
    sessionsTotal: c.sessionsTotal == null ? "" : String(c.sessionsTotal),
    sessionHours: c.sessionHours,
    totalHours: c.totalHours == null ? "" : String(c.totalHours),
    recruitStatus: c.recruitStatus,
  };
}

export function CourseEditor({ bundles }: { bundles: CourseBundle[] }) {
  const [selectedId, setSelectedId] = useState(bundles[0]?.course.id ?? "");
  const selected = bundles.find((b) => b.course.id === selectedId) ?? bundles[0];
  if (!selected) return null;

  // 기능사 과정: 커리큘럼 대신 트랙·시험일정 편집(모집상태는 트랙별로만 제어)
  const isCert = selected.course.category === "기능사";

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* 좌: 과정 선택 */}
      <div className="lg:w-52 flex-shrink-0 flex lg:flex-col gap-1 overflow-x-auto">
        {bundles.map((b) => (
          <button
            key={b.course.id}
            type="button"
            onClick={() => setSelectedId(b.course.id)}
            className={[
              "text-left rounded-lg px-3 py-2 text-[14px] font-semibold whitespace-nowrap",
              b.course.id === selectedId
                ? "bg-primary-soft text-primary"
                : "text-body-strong hover:bg-hairline-soft",
            ].join(" ")}
          >
            {b.course.name}
          </button>
        ))}
      </div>

      {/* 우: 선택 과정 디테일 */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        <CourseCard key={`${selected.course.id}-fields`} course={selected.course} isCert={isCert} />
        {isCert ? (
          <Card padding={20}>
            <h3 className="text-[15px] font-bold text-ink mb-3">트랙 · 실기 시험일정</h3>
            <TrackEditor
              key={`${selected.course.id}-track`}
              courseId={selected.course.id}
              initial={selected.tracks}
            />
          </Card>
        ) : (
          <>
            <Card padding={20}>
              <h3 className="text-[15px] font-bold text-ink mb-3">커리큘럼 (회차표)</h3>
              <CurriculumEditor
                key={`${selected.course.id}-cur`}
                courseId={selected.course.id}
                initial={selected.curriculum}
              />
            </Card>
            <Card padding={20}>
              <h3 className="text-[15px] font-bold text-ink mb-3">신청안내 (수강신청 페이지)</h3>
              <ApplyInfoEditor
                key={`${selected.course.id}-info`}
                courseId={selected.course.id}
                initial={selected.applyInfo}
              />
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function CourseCard({ course, isCert }: { course: CourseEditView; isCert: boolean }) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(course));
  const [pending, startSave] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function set<K extends keyof Draft>(key: K, val: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: val }));
    setMsg(null);
  }

  function save() {
    setMsg(null);
    startSave(async () => {
      const res = await updateCourse({
        id: course.id,
        name: draft.name,
        summary: draft.summary,
        skills: parseCsvList(draft.skills),
        tuition: draft.tuition,
        selfPay: draft.selfPay,
        sessionsTotal: draft.sessionsTotal.trim() === "" ? null : Number(draft.sessionsTotal),
        sessionHours: draft.sessionHours,
        totalHours: draft.totalHours.trim() === "" ? null : Number(draft.totalHours),
        recruitStatus: draft.recruitStatus,
      });
      setMsg(res.ok ? { ok: true, text: "저장되었습니다." } : { ok: false, text: res.error });
    });
  }

  return (
    <Card padding={20}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[14px] text-muted font-semibold">{course.name}</span>
        {/* 기능사 과정은 모집상태를 트랙별로 제어하므로 과정 전체 드롭다운 숨김 */}
        {!isCert && (
          <div className="flex items-center gap-2 text-[13px] text-muted">
            모집상태
            <div className="w-32">
              <Select
                value={draft.recruitStatus}
                ariaLabel="모집상태"
                options={STATUSES.map((s) => ({ value: s, label: s }))}
                onChange={(v) => set("recruitStatus", v as Draft["recruitStatus"])}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="과정명" value={draft.name} onChange={(e) => set("name", e.target.value)} />
        <Field
          label="기술·태그 (쉼표로 구분)"
          value={draft.skills}
          onChange={(e) => set("skills", e.target.value)}
          placeholder="예: 벽설치, 천장설치, 타일"
        />
        <div className="md:col-span-2">
          <Field
            label="요약 설명"
            as="textarea"
            rows={2}
            value={draft.summary}
            onChange={(e) => set("summary", e.target.value)}
          />
        </div>
        <Field label="수강료" value={draft.tuition} onChange={(e) => set("tuition", e.target.value)} />
        <Field label="자부담" value={draft.selfPay} onChange={(e) => set("selfPay", e.target.value)} />
        <Field
          label="총 회차"
          type="number"
          value={draft.sessionsTotal}
          onChange={(e) => set("sessionsTotal", e.target.value)}
          placeholder="예: 31"
        />
        <Field
          label="회차당 시간"
          value={draft.sessionHours}
          onChange={(e) => set("sessionHours", e.target.value)}
          placeholder="예: 6H"
        />
        <Field
          label="총 훈련시간"
          type="number"
          value={draft.totalHours}
          onChange={(e) => set("totalHours", e.target.value)}
          placeholder="예: 186"
        />
      </div>

      <div className="mt-4 flex items-center justify-end gap-3">
        {msg && (
          <span className={`text-[13px] ${msg.ok ? "text-success" : "text-error"}`}>{msg.text}</span>
        )}
        <Button variant="primary" size="sm" onClick={save} disabled={pending}>
          {pending ? "저장 중…" : "저장"}
        </Button>
      </div>
    </Card>
  );
}
