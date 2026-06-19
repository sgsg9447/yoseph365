"use client";

import { useState, useTransition } from "react";
import type { InquiryView } from "@/lib/queries/admin";
import { filterInquiries } from "@/lib/admin/inquiry";
import { paginate } from "@/lib/admin/enroll";
import { FilterPills } from "@/components/admin/FilterPills";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Phone } from "@/components/icons";
import { EmptyState } from "@/components/admin/EmptyState";
import { ConsultCalendar } from "./ConsultCalendar";
import { updateInquiryStatus } from "./actions";

const PER_PAGE = 10;

export function ConsultTable({ rows }: { rows: InquiryView[] }) {
  const [status, setStatus] = useState("전체");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const byStatus = filterInquiries(rows, status);
  const filtered = selectedDate ? byStatus.filter((r) => r.date === selectedDate) : byStatus;
  const { items, page: current, totalPages, total } = paginate(filtered, page, PER_PAGE);

  function changeStatus(v: string) {
    setStatus(v);
    setPage(1);
  }
  function selectDate(d: string | null) {
    setSelectedDate(d);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-4">
      <ConsultCalendar rows={rows} selected={selectedDate} onSelect={selectDate} />

      <div className="flex flex-wrap items-center gap-2">
        <FilterPills items={["전체", "신규", "완료"]} active="전체" onChange={changeStatus} />
        {selectedDate && (
          <button
            type="button"
            onClick={() => selectDate(null)}
            className="ml-auto text-[13px] font-semibold text-primary"
          >
            {selectedDate} 선택됨 · 전체 보기 ✕
          </button>
        )}
      </div>

      {total === 0 ? (
        <EmptyState message="조건에 맞는 상담 문의가 없습니다." />
      ) : (
        <div className="flex flex-col gap-[14px]">
          {items.map((q) => (
            <ConsultCard key={q.id} q={q} />
          ))}
        </div>
      )}

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

function ConsultCard({ q }: { q: InquiryView }) {
  const [done, setDone] = useState(q.status === "완료");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function complete() {
    setError(null);
    start(async () => {
      const res = await updateInquiryStatus({ id: q.id, status: "답변완료" });
      if (res.ok) setDone(true);
      else setError(res.error);
    });
  }

  return (
    <Card padding={20}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[16px] font-bold text-ink">{q.name}</span>
        <span className="text-muted text-[14px]">{q.phone}</span>
        <span className="text-[12px] font-semibold text-primary bg-primary-soft rounded-full px-2.5 py-1">
          {q.interest}
        </span>
        <span className="ml-auto">
          <Badge tone={done ? "success" : "solid"}>{done ? "완료" : "신규"}</Badge>
        </span>
      </div>
      <p className="mt-3 text-body text-[15px] leading-[1.6] whitespace-pre-wrap">{q.message}</p>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-muted-soft text-[13px] mr-auto">{q.date}</span>
        {error && <span className="text-error text-[13px]">{error}</span>}
        <a href={`tel:${q.phone.replace(/[^0-9]/g, "")}`}>
          <Button size="sm" leftIcon={<Phone size={15} />}>
            전화 상담
          </Button>
        </a>
        {!done && (
          <Button size="sm" variant="outline" onClick={complete} disabled={pending}>
            {pending ? "처리 중…" : "완료 처리"}
          </Button>
        )}
      </div>
    </Card>
  );
}
