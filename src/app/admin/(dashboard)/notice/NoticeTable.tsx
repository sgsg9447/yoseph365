"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { AdminNoticeView } from "@/lib/queries/admin";
import { paginate } from "@/lib/admin/enroll";
import { SectionCard } from "@/components/admin/SectionCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { deleteNotice } from "./actions";

const GRID = "minmax(0,1fr) auto auto";
const PER_PAGE = 10;
const ROW_H = 44; // 한 행 대략 높이 — 빈 행 채움·빈 상태 최소 높이 기준(수강신청과 동일)

export function NoticeTable({ initial }: { initial: AdminNoticeView[] }) {
  const router = useRouter();
  const [target, setTarget] = useState<AdminNoticeView | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { items, page: current, totalPages, total } = paginate(initial, page, PER_PAGE);

  function confirmDelete() {
    if (!target) return;
    setError(null);
    start(async () => {
      const res = await deleteNotice(target.id);
      if (res.ok) {
        setTarget(null);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Link href="/admin/notice/new">
          <Button size="sm" type="button">
            글쓰기
          </Button>
        </Link>
      </div>

      <SectionCard padding={0}>
        <div
          className="hidden md:grid items-center px-5 py-2.5 bg-canvas-soft text-[12px] font-semibold text-muted"
          style={{ gridTemplateColumns: GRID, columnGap: 16 }}
        >
          <span className="min-w-0 truncate">제목</span>
          <span className="min-w-0 truncate">날짜</span>
          <span className="min-w-0 truncate text-right">관리</span>
        </div>

        {total === 0 ? (
          <div
            className="flex items-center justify-center"
            style={{ minHeight: PER_PAGE * ROW_H }}
          >
            <EmptyState message="등록된 공지가 없습니다." />
          </div>
        ) : (
          <div>
            {items.map((n) => (
              <div
                key={n.id}
                className="grid items-center px-5 py-3 border-t border-hairline text-[14px]"
                style={{ gridTemplateColumns: GRID, columnGap: 16 }}
              >
                <span className="min-w-0 flex items-center gap-2">
                  {n.pinned && (
                    <span className="flex-shrink-0 text-[11px] font-semibold text-primary bg-primary-soft rounded-full px-2 py-0.5">
                      고정
                    </span>
                  )}
                  <span className="truncate font-semibold text-ink">{n.title}</span>
                </span>
                <span className="text-muted tabular-nums whitespace-nowrap">{n.date}</span>
                <span className="flex items-center justify-end gap-3 whitespace-nowrap">
                  <Link
                    href={`/admin/notice/${n.id}/edit`}
                    className="text-[13px] font-semibold text-primary hover:underline"
                  >
                    수정
                  </Link>
                  <button
                    type="button"
                    onClick={() => setTarget(n)}
                    className="text-[13px] font-semibold text-muted hover:text-error"
                  >
                    삭제
                  </button>
                </span>
              </div>
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

      <Modal open={target !== null} onClose={() => setTarget(null)} title="공지 삭제">
        <div className="flex flex-col gap-4">
          <p className="text-[15px] text-body-strong leading-[1.6]">
            <span className="font-bold">{target?.title}</span> 공지를 삭제할까요?
            <br />
            삭제하면 되돌릴 수 없습니다.
          </p>
          {error && <p className="text-[13px] text-error">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setTarget(null)}>
              취소
            </Button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={pending}
              className="inline-flex items-center justify-center rounded-button font-semibold leading-none tracking-[-0.2px] whitespace-nowrap transition active:scale-[0.98] h-10 px-4 text-[15px] bg-error text-white border border-error hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "삭제 중…" : "삭제"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
