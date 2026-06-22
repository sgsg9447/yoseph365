"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import type { InquiryView } from "@/lib/queries/admin";
import {
  filterInquiries,
  countInquiriesByStatus,
  filterInquiriesByMonth,
  stepMonth,
  inquiryYearRange,
  searchInquiriesByName,
} from "@/lib/admin/inquiry";
import { paginate } from "@/lib/admin/enroll";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Phone, ChevronRight, Lock } from "@/components/icons";
import { EmptyState } from "@/components/admin/EmptyState";
import { RichEditor } from "@/components/admin/RichEditor";
import { isBlankHtml } from "@/lib/richtext/sanitize";
import {
  updateInquiryStatus,
  updateInquiryMemo,
  updateInquiryPublished,
  answerInquiry,
  getInquiryAnswer,
} from "./actions";

const PER_PAGE = 10;

function todayKst(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}.${get("month")}.${get("day")}`;
}

export function ConsultTable({ rows }: { rows: InquiryView[] }) {
  const [todayY, todayM] = todayKst().split(".");
  const nowYear = Number(todayY);
  const nowMonth = Number(todayM);

  const [status, setStatus] = useState("전체");
  const [year, setYear] = useState(nowYear);
  const [month, setMonth] = useState(nowMonth);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const trimmed = query.trim();
  const searching = trimmed !== "";
  // 검색 중이면 월 무시·전체 기간에서, 아니면 선택한 달에서.
  const base = searching
    ? searchInquiriesByName(rows, trimmed)
    : filterInquiriesByMonth(rows, year, month);
  const counts = countInquiriesByStatus(base);
  const filtered = filterInquiries(base, status);
  const { items, page: current, totalPages, total } = paginate(filtered, page, PER_PAGE);

  const baseYears = inquiryYearRange(rows, nowYear);
  const years = baseYears.includes(year) ? baseYears : [...baseYears, year].sort((a, b) => b - a);
  const disableNext = year > nowYear || (year === nowYear && month >= nowMonth);

  function changeStatus(v: string) {
    setStatus(v);
    setPage(1);
  }

  function changeMonth(y: number, m: number) {
    setYear(y);
    setMonth(m);
    setPage(1);
  }

  function changeQuery(v: string) {
    setQuery(v);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 검색 + 상태 필터 + 월 네비게이터 — 한 줄 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <input
          type="search"
          value={query}
          onChange={(e) => changeQuery(e.target.value)}
          placeholder="이름 검색"
          className="w-full sm:w-52 py-[11px] bg-surface-card text-ink text-[15px] rounded-[14px] border border-hairline-strong px-4 outline-none focus:border-2 focus:border-primary"
        />
        <div className="flex flex-wrap items-center gap-2">
          {(["전체", "신규", "완료"] as const).map((item) => {
            const isActive = item === status;
            return (
              <button
                key={item}
                type="button"
                aria-pressed={isActive}
                onClick={() => changeStatus(item)}
                className={[
                  "rounded-full px-4 h-9 text-[14px] font-semibold inline-flex items-center gap-1.5 transition",
                  isActive
                    ? "bg-primary text-white"
                    : "bg-transparent text-body border border-hairline-strong hover:bg-hairline-soft",
                ].join(" ")}
              >
                <span>{item}</span>
                <span className={isActive ? "text-white/85" : "text-muted"}>{counts[item]}</span>
              </button>
            );
          })}
        </div>
        <div className="ml-auto">
          {searching ? (
            <span className="text-[13px] text-muted">전체 기간에서 검색 중</span>
          ) : (
            <MonthNav
              year={year}
              month={month}
              years={years}
              disableNext={disableNext}
              onChange={changeMonth}
            />
          )}
        </div>
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

function MonthNav({
  year,
  month,
  years,
  disableNext,
  onChange,
}: {
  year: number;
  month: number;
  years: number[];
  disableNext: boolean;
  onChange: (year: number, month: number) => void;
}) {
  function step(delta: number) {
    const next = stepMonth(year, month, delta);
    onChange(next.year, next.month);
  }
  const arrow =
    "flex h-9 w-9 flex-none items-center justify-center rounded-full border border-hairline-strong text-body-strong hover:bg-hairline-soft disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="flex items-center gap-2">
      <button type="button" aria-label="이전 달" onClick={() => step(-1)} className={arrow}>
        <ChevronRight size={18} className="rotate-180" />
      </button>
      <div className="w-32">
        <Select
          value={String(year)}
          ariaLabel="년 선택"
          options={years.map((y) => ({ value: String(y), label: `${y}년` }))}
          onChange={(v) => onChange(Number(v), month)}
        />
      </div>
      <div className="w-24">
        <Select
          value={String(month)}
          ariaLabel="월 선택"
          options={Array.from({ length: 12 }, (_, i) => ({
            value: String(i + 1),
            label: `${i + 1}월`,
          }))}
          onChange={(v) => onChange(year, Number(v))}
        />
      </div>
      <button
        type="button"
        aria-label="다음 달"
        onClick={() => step(1)}
        disabled={disableNext}
        className={arrow}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

function ConsultCard({ q }: { q: InquiryView }) {
  const [done, setDone] = useState(q.status === "완료");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [memoOpen, setMemoOpen] = useState(false);
  const [memo, setMemo] = useState(q.memo);
  const [savedMemo, setSavedMemo] = useState(q.memo);
  const [memoPending, startMemo] = useTransition();
  const [memoError, setMemoError] = useState<string | null>(null);
  const [memoClamped, setMemoClamped] = useState(false);
  const memoRef = useRef<HTMLParagraphElement>(null);

  const [answerOpen, setAnswerOpen] = useState(false);
  const [answerHtml, setAnswerHtml] = useState("");
  const [answerLoading, setAnswerLoading] = useState(false);
  const [answerPending, startAnswer] = useTransition();
  const [answerError, setAnswerError] = useState<string | null>(null);

  useEffect(() => {
    const el = memoRef.current;
    setMemoClamped(el ? el.scrollHeight > el.clientHeight + 1 : false);
  }, [savedMemo]);

  function complete() {
    setError(null);
    start(async () => {
      const res = await updateInquiryStatus({ id: q.id, status: "답변완료" });
      if (res.ok) setDone(true);
      else setError(res.error);
    });
  }

  async function openAnswer() {
    setAnswerError(null);
    setAnswerHtml("");
    setAnswerOpen(true);
    setAnswerLoading(true);
    const res = await getInquiryAnswer(q.id);
    setAnswerLoading(false);
    if (res.ok) setAnswerHtml(res.answer);
    else setAnswerError(res.error);
  }

  function saveAnswer() {
    setAnswerError(null);
    startAnswer(async () => {
      const res = await answerInquiry({ id: q.id, answer: answerHtml });
      if (res.ok) {
        setDone(!isBlankHtml(answerHtml));
        setAnswerOpen(false);
      } else {
        setAnswerError(res.error);
      }
    });
  }

  function openMemo() {
    setMemo(savedMemo);
    setMemoError(null);
    setMemoOpen(true);
  }

  function saveMemo() {
    setMemoError(null);
    startMemo(async () => {
      const res = await updateInquiryMemo({ id: q.id, memo });
      if (res.ok) {
        setSavedMemo(memo);
        setMemoOpen(false);
      } else {
        setMemoError(res.error);
      }
    });
  }

  return (
    <>
      <Card padding={20}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[16px] font-bold text-ink">{q.name}</span>
          <span className="text-muted text-[14px]">{q.phone}</span>
          <span className="text-[12px] font-semibold text-primary bg-primary-soft rounded-full px-2.5 py-1">
            {q.interest}
          </span>
          {q.isPublicPost && (
            <span className="inline-flex items-center gap-1">
              {q.isSecret && <Lock size={13} strokeWidth={2.2} className="text-muted" aria-label="비밀글" />}
              <Badge tone="neutral">
                {q.isPublished ? "게시판" : "숨김"}
              </Badge>
            </span>
          )}
          <span className="ml-auto">
            <Badge tone={done ? "success" : "solid"}>{done ? "완료" : "신규"}</Badge>
          </span>
        </div>
        <p className="mt-3 text-body text-[15px] leading-[1.6] whitespace-pre-wrap">{q.message}</p>
        {savedMemo && (
          <div className="mt-2 bg-canvas-soft rounded-button px-3 py-2">
            <span className="block text-[12px] font-semibold text-body-strong mb-0.5">메모</span>
            <p
              ref={memoRef}
              className="text-[13px] text-muted leading-[1.6] whitespace-pre-wrap line-clamp-2"
            >
              {savedMemo}
            </p>
            {memoClamped && (
              <button
                type="button"
                onClick={openMemo}
                className="mt-1 text-[13px] font-semibold text-primary hover:underline"
              >
                더보기
              </button>
            )}
          </div>
        )}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-muted-soft text-[13px] mr-auto">{q.date}</span>
          {error && <span className="text-error text-[13px]">{error}</span>}
          <a href={`tel:${q.phone.replace(/[^0-9]/g, "")}`}>
            <Button size="sm" variant="outline" leftIcon={<Phone size={15} />}>
              전화 상담
            </Button>
          </a>
          <Button size="sm" onClick={openAnswer}>
            답변 작성
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={openMemo}
            leftIcon={
              savedMemo ? <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden /> : undefined
            }
          >
            메모
          </Button>
          {!done && (
            <Button size="sm" variant="outline" onClick={complete} disabled={pending}>
              {pending ? "처리 중…" : "완료 처리"}
            </Button>
          )}
          {q.isPublicPost && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                start(async () => {
                  await updateInquiryPublished(q.id, !q.isPublished);
                })
              }
            >
              {q.isPublished ? "게시판에서 숨기기" : "다시 공개"}
            </Button>
          )}
        </div>
      </Card>

      <Modal open={answerOpen} onClose={() => setAnswerOpen(false)} title={`${q.name} · 답변 작성`}>
        <div className="flex flex-col gap-3">
          <div>
            <span className="block text-[13px] font-semibold text-body-strong mb-1">문의 내용</span>
            <p className="text-[14px] text-body leading-[1.6] whitespace-pre-wrap">{q.message}</p>
          </div>
          {!q.isPublicPost && (
            <p className="text-[13px] text-muted bg-canvas-soft rounded-button px-3 py-2 leading-[1.6]">
              비공개 문의라 답변이 공개 페이지에 표시되지 않습니다. 기록·전화 안내용으로만 저장됩니다.
            </p>
          )}
          <div>
            <label className="block text-[13px] font-semibold text-body-strong mb-1">답변</label>
            {answerLoading ? (
              <p className="text-[14px] text-muted text-center py-8">불러오는 중…</p>
            ) : (
              <RichEditor value={answerHtml} onChange={setAnswerHtml} />
            )}
            {answerError && <p className="text-[13px] text-error mt-1">{answerError}</p>}
            <div className="flex justify-end gap-2 mt-3">
              <Button size="sm" variant="outline" onClick={() => setAnswerOpen(false)}>
                취소
              </Button>
              <Button size="sm" onClick={saveAnswer} disabled={answerPending || answerLoading}>
                {answerPending ? "저장 중…" : "답변 저장"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={memoOpen}
        onClose={() => {
          setMemo(savedMemo);
          setMemoError(null);
          setMemoOpen(false);
        }}
        title={`${q.name} · 상담 메모`}
      >
        <div className="flex flex-col gap-3">
          <div>
            <span className="block text-[13px] font-semibold text-body-strong mb-1">문의 내용</span>
            <p className="text-[14px] text-body leading-[1.6] whitespace-pre-wrap">{q.message}</p>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-body-strong mb-1">메모</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={5}
              placeholder="상담 내용·처리 메모를 입력하세요"
              className="w-full bg-surface-card text-ink text-[15px] rounded-button border border-hairline-strong px-3 py-2 outline-none focus:border-2 focus:border-primary resize-y"
            />
            {memoError && <p className="text-[13px] text-error mt-1">{memoError}</p>}
            <div className="flex justify-end gap-2 mt-3">
              <Button size="sm" variant="outline" onClick={() => setMemo(savedMemo)}>
                되돌리기
              </Button>
              <Button size="sm" onClick={saveMemo} disabled={memoPending}>
                {memoPending ? "저장 중…" : "메모 저장"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
