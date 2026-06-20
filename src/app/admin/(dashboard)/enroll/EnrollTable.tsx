"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { EnrollmentView, EnrollStatus } from "@/lib/queries/admin";
import { filterEnrollments, paginate } from "@/lib/admin/enroll";
import { FilterPills } from "@/components/admin/FilterPills";
import { Select } from "@/components/ui/Select";
import { SectionCard } from "@/components/admin/SectionCard";
import { StatusChip } from "@/components/admin/StatusChip";
import { EmptyState } from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { updateApplicationMemo, updateApplicationStatus } from "./actions";

const STATUS_FILTERS = ["전체", "신규", "상담중", "등록확인", "보류"];
const STATUSES: EnrollStatus[] = ["신규", "상담중", "등록확인", "보류"];
// minmax(0,...)로 컬럼을 내용과 무관하게 비율 고정 → 헤더와 모든 행의 열이 정렬됨
// (각 셀에 min-w-0/truncate를 함께 줘야 내용이 트랙을 넘지 않아 정렬이 유지됨)
const GRID =
  "minmax(0,1fr) minmax(0,1.4fr) minmax(0,1.1fr) minmax(0,0.9fr) minmax(0,0.5fr) minmax(0,0.9fr) minmax(0,0.9fr) minmax(0,0.8fr)";
const PER_PAGE = 10;
const ROW_H = 44; // 한 행(컴팩트) 대략 높이 — 빈 행 채움·빈 상태 최소 높이 기준

interface EnrollTableProps {
  rows: EnrollmentView[];
  courseOptions: string[];
}

export function EnrollTable({ rows, courseOptions }: EnrollTableProps) {
  const [status, setStatus] = useState("전체");
  const [course, setCourse] = useState("전체");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // 필터·검색이 바뀌면 1페이지로
  function changeStatus(v: string) {
    setStatus(v);
    setPage(1);
  }
  function changeCourse(v: string) {
    setCourse(v);
    setPage(1);
  }
  function changeQuery(v: string) {
    setQuery(v);
    setPage(1);
  }

  const filtered = filterEnrollments(rows, { status, course, query });
  const { items, page: current, totalPages, total } = paginate(filtered, page, PER_PAGE);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <FilterPills items={STATUS_FILTERS} active="전체" onChange={changeStatus} />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="w-44">
            <Select
              value={course}
              onChange={changeCourse}
              ariaLabel="과정 필터"
              options={[
                { value: "전체", label: "전체 과정" },
                ...courseOptions.map((c) => ({ value: c, label: c })),
              ]}
            />
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => changeQuery(e.target.value)}
            placeholder="신청자 이름 검색"
            className="w-44 sm:w-52 py-[11px] bg-surface-card text-ink text-[15px] rounded-[14px] border border-hairline-strong px-4 outline-none focus:border-2 focus:border-primary"
          />
        </div>
      </div>

      <SectionCard padding={0}>
        <div
          className="hidden md:grid items-center px-5 py-2.5 bg-canvas-soft text-[12px] font-semibold text-muted"
          style={{ gridTemplateColumns: GRID }}
        >
          <span className="min-w-0 truncate">신청자</span>
          <span className="min-w-0 truncate">과정</span>
          <span className="min-w-0 truncate">연락처</span>
          <span className="min-w-0 truncate">생년월일</span>
          <span className="min-w-0 truncate">성별</span>
          <span className="min-w-0 truncate">신청일</span>
          <span className="min-w-0 truncate">상태</span>
          <span className="min-w-0 truncate text-right">관리</span>
        </div>
        {total === 0 ? (
          <div className="flex items-center justify-center" style={{ minHeight: PER_PAGE * ROW_H }}>
            <EmptyState message="조건에 맞는 수강신청 내역이 없습니다." />
          </div>
        ) : (
          <div>
            {items.map((r) => (
              <EnrollRow key={r.id} row={r} />
            ))}
            {/* 데이터가 10개 미만이어도 표 높이를 10행으로 유지(레이아웃 흔들림 방지) */}
            {Array.from({ length: Math.max(0, PER_PAGE - items.length) }).map((_, i) => (
              <div
                key={`filler-${i}`}
                className="border-t border-hairline-soft"
                style={{ height: ROW_H }}
                aria-hidden
              />
            ))}
          </div>
        )}
      </SectionCard>

      {total > 0 && (
        <div className="flex items-center justify-between text-[14px]">
          <span className="text-muted">총 {total}건</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPage(current - 1)}
              disabled={current <= 1}
              className="font-semibold text-body-strong disabled:text-muted-soft disabled:cursor-not-allowed"
            >
              이전
            </button>
            <span className="text-muted">
              {current} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(current + 1)}
              disabled={current >= totalPages}
              className="font-semibold text-body-strong disabled:text-muted-soft disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EnrollRow({ row }: { row: EnrollmentView }) {
  const [open, setOpen] = useState(false);
  const [memo, setMemo] = useState(row.memo);
  const [saved, setSaved] = useState(row.memo);
  const [pending, startTransition] = useTransition();
  const [changing, startChange] = useTransition();
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

  function changeStatus(next: EnrollStatus) {
    startChange(async () => {
      await updateApplicationStatus({ id: row.id, status: next });
    });
  }

  const hasMemo = saved.trim().length > 0;

  return (
    <div className="border-t border-hairline-soft">
      <div className="grid items-center px-5 py-2.5 text-[14px]" style={{ gridTemplateColumns: GRID }}>
        <span className="min-w-0 font-semibold text-ink inline-flex items-center gap-1.5">
          {row.status === "신규" && (
            <span
              role="img"
              aria-label="확인 전 새 신청"
              title="확인 전 새 신청"
              className="w-2 h-2 rounded-full bg-primary flex-shrink-0"
            />
          )}
          <span className="truncate">{row.name}</span>
        </span>
        <span className="min-w-0 truncate text-body" title={row.courses.join(", ")}>
          {row.courses.join(", ")}
        </span>
        <span className="min-w-0 truncate text-body">{row.phone}</span>
        <span className="min-w-0 truncate text-body">{row.birth || <span className="text-muted-soft">-</span>}</span>
        <span className="min-w-0 truncate text-body">{row.gender || <span className="text-muted-soft">-</span>}</span>
        <span className="min-w-0 truncate text-muted">{row.date}</span>
        <span className="min-w-0">
          <StatusMenu value={row.status} onChange={changeStatus} pending={changing} />
        </span>
        <span className="flex min-w-0 justify-end">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold rounded-full px-3 py-1 border border-hairline-strong text-body-strong bg-transparent hover:bg-hairline-soft"
          >
            {hasMemo && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" aria-hidden />}
            {hasMemo ? "메모 있음" : "관리"}
          </button>
        </span>
      </div>

      <Modal
        open={open}
        onClose={() => {
          setMemo(saved);
          setError(null);
          setOpen(false);
        }}
        title={`${row.name} · 신청 상세`}
      >
        <div className="flex flex-col gap-4">
          <div>
            <span className="block text-[13px] font-semibold text-body-strong mb-1">추가 정보</span>
            {row.address || row.career || row.motivation ? (
              <dl className="flex flex-col gap-1 text-[14px] leading-[1.6]">
                {row.address && (
                  <div>
                    <dt className="inline text-muted">주소: </dt>
                    <dd className="inline text-body">{row.address}</dd>
                  </div>
                )}
                {row.career && (
                  <div>
                    <dt className="inline text-muted">관련 경력: </dt>
                    <dd className="inline text-body">{row.career}</dd>
                  </div>
                )}
                {row.motivation && (
                  <div>
                    <dt className="inline text-muted">지원동기: </dt>
                    <dd className="inline text-body whitespace-pre-wrap">{row.motivation}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-[14px] text-muted-soft">추가로 입력한 정보가 없습니다.</p>
            )}
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-body-strong mb-1">메모</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={4}
              placeholder="상담 내용·처리 메모를 입력하세요"
              className="w-full bg-surface-card text-ink text-[15px] rounded-button border border-hairline-strong px-3 py-2 outline-none focus:border-2 focus:border-primary resize-y"
            />
            {error && <p className="text-[13px] text-error mt-1">{error}</p>}
            <div className="flex justify-end gap-2 mt-3">
              <Button size="sm" variant="outline" onClick={() => setMemo(saved)}>
                되돌리기
              </Button>
              <Button size="sm" onClick={save} disabled={pending}>
                {pending ? "저장 중…" : "메모 저장"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function StatusMenu({
  value,
  onChange,
  pending,
}: {
  value: EnrollStatus;
  onChange: (s: EnrollStatus) => void;
  pending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="상태 변경"
        className="inline-flex items-center disabled:opacity-60 cursor-pointer"
      >
        <StatusChip status={value} />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-[calc(100%+4px)] z-30 min-w-[128px] overflow-hidden rounded-xl border border-hairline bg-surface-card shadow-pop"
        >
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              role="option"
              aria-selected={s === value}
              onClick={() => {
                setOpen(false);
                if (s !== value) onChange(s);
              }}
              className={[
                "flex w-full items-center px-3 py-2 text-left",
                s === value ? "bg-primary-soft" : "hover:bg-hairline-soft",
              ].join(" ")}
            >
              <StatusChip status={s} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
