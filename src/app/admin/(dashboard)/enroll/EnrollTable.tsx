"use client";

import { useState, useTransition } from "react";
import type { EnrollmentView } from "@/lib/queries/admin";
import { filterEnrollments } from "@/lib/admin/enroll";
import { FilterPills } from "@/components/admin/FilterPills";
import { SectionCard } from "@/components/admin/SectionCard";
import { StatusChip } from "@/components/admin/StatusChip";
import { EmptyState } from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/Button";
import { updateApplicationMemo } from "./actions";

const STATUS_FILTERS = ["전체", "신규", "상담중", "등록확인", "보류"];
const GRID = "1.3fr 1.7fr 1.3fr 0.8fr 0.8fr 0.6fr";

interface EnrollTableProps {
  rows: EnrollmentView[];
  courseOptions: string[];
}

export function EnrollTable({ rows, courseOptions }: EnrollTableProps) {
  const [status, setStatus] = useState("전체");
  const [course, setCourse] = useState("전체");

  const filtered = filterEnrollments(rows, { status, course });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <FilterPills items={STATUS_FILTERS} active="전체" onChange={setStatus} />
        <FilterPills items={["전체", ...courseOptions]} active="전체" onChange={setCourse} />
      </div>

      <SectionCard padding={0}>
        {filtered.length === 0 ? (
          <EmptyState message="조건에 맞는 수강신청 내역이 없습니다." />
        ) : (
          <div>
            <div
              className="hidden md:grid px-5 py-3 bg-canvas-soft text-[13px] font-semibold text-muted"
              style={{ gridTemplateColumns: GRID }}
            >
              <span>신청자</span>
              <span>과정</span>
              <span>연락처</span>
              <span>신청일</span>
              <span>상태</span>
              <span className="text-right">메모</span>
            </div>
            {filtered.map((r) => (
              <EnrollRow key={r.id} row={r} />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function EnrollRow({ row }: { row: EnrollmentView }) {
  const [open, setOpen] = useState(false);
  const [memo, setMemo] = useState(row.memo);
  const [saved, setSaved] = useState<string>(row.memo);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updateApplicationMemo({ id: row.id, memo });
      if (res.ok) {
        setSaved(memo);
        setOpen(false);
      } else {
        setError(res.error);
      }
    });
  }

  const hasMemo = saved.trim().length > 0;

  return (
    <div className="border-t border-hairline-soft">
      <div
        className="grid items-center px-5 py-4 text-[15px] gap-y-1"
        style={{ gridTemplateColumns: GRID }}
      >
        <span className="font-semibold text-ink">{row.name}</span>
        <span className="text-body">{row.courses.join(", ")}</span>
        <span className="text-body">
          <a href={`tel:${row.phone.replace(/[^0-9]/g, "")}`} className="text-primary">
            {row.phone}
          </a>
        </span>
        <span className="text-muted">{row.date}</span>
        <span>
          <StatusChip status={row.status} />
        </span>
        <span className="md:text-right">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={[
              "text-[13px] font-semibold rounded-full px-3 py-1",
              hasMemo ? "bg-primary-soft text-primary" : "text-muted bg-surface-strong",
            ].join(" ")}
          >
            {hasMemo ? "메모 보기" : "메모"}
          </button>
        </span>
      </div>

      {open && (
        <div className="px-5 pb-4 -mt-1">
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={3}
            placeholder="상담 내용·처리 메모를 입력하세요"
            className="w-full bg-surface-card text-ink text-[15px] rounded-button border border-hairline-strong px-3 py-2 outline-none focus:border-2 focus:border-primary resize-y"
          />
          {error && <p className="text-[13px] text-error mt-1">{error}</p>}
          <div className="flex justify-end gap-2 mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setMemo(saved);
                setOpen(false);
                setError(null);
              }}
            >
              취소
            </Button>
            <Button size="sm" onClick={save} disabled={pending}>
              {pending ? "저장 중…" : "저장"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
