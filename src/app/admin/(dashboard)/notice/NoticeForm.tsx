"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/admin/SectionCard";
import { RichEditor } from "@/components/admin/RichEditor";
import { createNotice, updateNotice } from "./actions";

export interface NoticeFormInitial {
  id: number;
  title: string;
  body: string;
  pinned: boolean;
}

/** 공지 글쓰기/수정 공유 폼. mode에 따라 createNotice/updateNotice 호출. */
export function NoticeForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: NoticeFormInitial;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [pinned, setPinned] = useState(initial?.pinned ?? false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    start(async () => {
      const res =
        mode === "edit" && initial
          ? await updateNotice({ id: initial.id, title, body, pinned })
          : await createNotice({ title, body, pinned });
      if (res.ok) {
        router.push("/admin/notice");
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <SectionCard>
      <div className="flex flex-col gap-3">
        <Field label="제목" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div>
          <span className="block text-[15px] font-semibold text-body-strong mb-[7px]">내용</span>
          <RichEditor value={body} onChange={setBody} />
        </div>
        <label className="flex items-center gap-2 text-[14px] text-body-strong">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
          상단 고정
        </label>
        {error && <p className="text-[13px] text-error">{error}</p>}
        <div className="flex justify-end gap-2">
          <Link href="/admin/notice">
            <Button variant="outline" size="sm" type="button">
              취소
            </Button>
          </Link>
          <Button size="sm" type="button" onClick={submit} disabled={pending}>
            {pending ? "저장 중…" : mode === "edit" ? "수정 저장" : "공지 등록"}
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}
