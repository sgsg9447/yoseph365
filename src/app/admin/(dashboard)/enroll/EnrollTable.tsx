"use client";

import { useState, useTransition } from "react";
import type { EnrollmentView } from "@/lib/queries/admin";
import { filterEnrollments, paginate } from "@/lib/admin/enroll";
import { FilterPills } from "@/components/admin/FilterPills";
import { Select } from "@/components/ui/Select";
import { SectionCard } from "@/components/admin/SectionCard";
import { StatusChip } from "@/components/admin/StatusChip";
import { EmptyState } from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/Button";
import { updateApplicationMemo, confirmApplication } from "./actions";

const STATUS_FILTERS = ["전체", "신규", "상담중", "등록확인", "보류"];
const GRID = "1fr 1.3fr 1.1fr 0.9fr 0.5fr 0.7fr 0.8fr 0.8fr";
const PER_PAGE = 10;

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
      <div className="flex flex-col gap-3">
        <FilterPills items={STATUS_FILTERS} active="전체" onChange={changeStatus} />
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-full sm:w-56">
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
            className="flex-1 min-w-[180px] sm:max-w-xs h-[46px] bg-surface-card text-ink text-[15px] rounded-[14px] border border-hairline-strong px-4 outline-none focus:border-2 focus:border-primary"
          />
        </div>
      </div>

      <SectionCard padding={0}>
        {total === 0 ? (
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
              <span>생년월일</span>
              <span>성별</span>
              <span>신청일</span>
              <span>상태</span>
              <span className="text-right">관리</span>
            </div>
            {items.map((r) => (
              <EnrollRow key={r.id} row={r} />
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
  const [confirming, startConfirm] = useTransition();
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

  function confirm() {
    setError(null);
    startConfirm(async () => {
      const res = await confirmApplication(row.id);
      if (!res.ok) setError(res.error);
    });
  }

  const hasMemo = saved.trim().length > 0;

  return (
    <div className="border-t border-hairline-soft">
      <div className="grid items-center px-5 py-4 text-[15px] gap-y-1" style={{ gridTemplateColumns: GRID }}>
        <span className="font-semibold text-ink">{row.name}</span>
        <span className="text-body">{row.courses.join(", ")}</span>
        <span className="text-body">
          <a href={`tel:${row.phone.replace(/[^0-9]/g, "")}`} className="text-primary">
            {row.phone}
          </a>
        </span>
        <span className="text-body">{row.birth || <span className="text-muted-soft">-</span>}</span>
        <span className="text-body">{row.gender || <span className="text-muted-soft">-</span>}</span>
        <span className="text-muted">{row.date}</span>
        <span>
          <StatusChip status={row.status} />
        </span>
        <span className="flex justify-end">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className={[
              "inline-flex items-center gap-1 text-[13px] font-semibold rounded-full px-3 py-1",
              hasMemo ? "bg-primary-soft text-primary" : "text-body-strong bg-surface-strong",
            ].join(" ")}
          >
            {hasMemo ? "메모 있음" : "관리"}
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden className="transition-transform"
              style={{ transform: open ? "rotate(180deg)" : "none" }}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </span>
      </div>

      {open && (
        <div className="px-5 pb-4 flex flex-col gap-3 bg-canvas-soft">
          <div className="pt-3">
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
          {row.status === "신규" && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[14px] text-muted">아직 확인하지 않은 새 신청입니다.</span>
              <Button size="sm" onClick={confirm} disabled={confirming}>
                {confirming ? "처리 중…" : "확인 처리"}
              </Button>
            </div>
          )}
          <div>
            <label className="block text-[13px] font-semibold text-body-strong mb-1">메모</label>
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
                  setError(null);
                }}
              >
                되돌리기
              </Button>
              <Button size="sm" onClick={save} disabled={pending}>
                {pending ? "저장 중…" : "메모 저장"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
