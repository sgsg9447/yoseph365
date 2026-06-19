"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import type { AdminNoticeView } from "@/lib/queries/admin";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/admin/EmptyState";
import { X } from "@/components/icons";
import { NoticeEditor } from "./NoticeEditor";
import { createNotice, deleteNotice } from "./actions";

export function NoticeBoard({ initial }: { initial: AdminNoticeView[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function closeModal() {
    setOpen(false);
    setTitle("");
    setBody("");
    setPinned(false);
    setError(null);
  }

  function submit() {
    setError(null);
    start(async () => {
      const res = await createNotice({ title, body, pinned });
      if (res.ok) {
        closeModal();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  function remove(id: number) {
    start(async () => {
      const res = await deleteNotice(id);
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>글쓰기</Button>
      </div>

      {initial.length === 0 ? (
        <EmptyState message="등록된 공지가 없습니다." />
      ) : (
        <div className="flex flex-col gap-[14px]">
          {initial.map((n) => (
            <Card key={n.id} padding={20}>
              <div className="flex items-center gap-2">
                {n.pinned && (
                  <span className="text-[12px] font-semibold text-primary bg-primary-soft rounded-full px-2.5 py-1">
                    고정
                  </span>
                )}
                <span className="text-[16px] font-bold text-ink">{n.title}</span>
                <button
                  type="button"
                  onClick={() => remove(n.id)}
                  disabled={pending}
                  aria-label="삭제"
                  className="ml-auto text-muted hover:text-error"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="mt-1 text-[13px] text-muted-soft">{n.date}</p>
              <div
                className="rich-content mt-2"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(n.body) }}
              />
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={closeModal} title="새 공지 작성">
        <div className="flex flex-col gap-3">
          <Field label="제목" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div>
            <span className="block text-[15px] font-semibold text-body-strong mb-[7px]">내용</span>
            <NoticeEditor value={body} onChange={setBody} />
          </div>
          <label className="flex items-center gap-2 text-[14px] text-body-strong">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
            상단 고정
          </label>
          {error && <p className="text-[13px] text-error">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={closeModal}>
              취소
            </Button>
            <Button size="sm" onClick={submit} disabled={pending}>
              {pending ? "등록 중…" : "공지 등록"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
