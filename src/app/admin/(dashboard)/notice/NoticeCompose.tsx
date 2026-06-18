"use client";

import { useState } from "react";
import type { AdminNoticeView } from "@/lib/queries/admin";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/admin/EmptyState";
import { X } from "@/components/icons";

interface Props {
  initial: AdminNoticeView[];
}

export function NoticeCompose({ initial }: Props) {
  const [notices, setNotices] = useState<AdminNoticeView[]>(initial);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  function addNotice() {
    if (!title.trim()) return;
    const d = new Date();
    const date = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
    setNotices([
      { id: Date.now(), title: title.trim(), body, date, pinned: false },
      ...notices,
    ]);
    setTitle("");
    setBody("");
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-6 items-start">
      {/* Compose form */}
      <div className="order-1 lg:order-2 lg:sticky lg:top-[88px]">
        <Card padding={20}>
          <h2 className="text-[18px] font-bold text-ink mb-4">새 공지 작성</h2>
          <Field
            label="제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="mt-4">
            <Field
              as="textarea"
              label="내용"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
            />
          </div>
          <div className="mt-4">
            <Button variant="primary" fullWidth onClick={addNotice}>
              공지 등록
            </Button>
          </div>
        </Card>
      </div>

      {/* Notice list */}
      <div className="order-2 lg:order-1">
        {notices.length === 0 ? (
          <EmptyState message="등록된 공지가 없습니다." />
        ) : (
          <div className="flex flex-col gap-[14px]">
            {notices.map((notice) => (
              <Card key={notice.id} padding={20}>
                <div className="flex items-center gap-2">
                  {notice.pinned && (
                    <span className="bg-primary-soft text-primary text-[12px] font-semibold rounded-full px-2.5 py-1">
                      고정
                    </span>
                  )}
                  <span className="text-[16px] font-bold text-ink">{notice.title}</span>
                  <button
                    className="ml-auto text-muted hover:text-error"
                    onClick={() =>
                      setNotices((prev) => prev.filter((n) => n.id !== notice.id))
                    }
                    aria-label="삭제"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="mt-2 text-body text-[15px] leading-[1.6] whitespace-pre-wrap">
                  {notice.body}
                </p>
                <p className="mt-2 text-muted-soft text-[13px]">{notice.date}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
