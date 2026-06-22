"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Lock } from "@/components/icons";
import { sanitizeRichHtml } from "@/lib/richtext/sanitize";
import { inquiryReplyState } from "@/lib/inquiry/reply-state";
import { verifyInquiryPassword, type PublicInquiryDetail } from "@/lib/actions/submit";

function Paragraphs({ text, color, size }: { text: string; color: string; size: number }) {
  return (
    <>
      {text.split("\n").map((ln, i) => (
        <p key={i} style={{ fontSize: size, color, lineHeight: 1.85, margin: i === 0 ? 0 : "14px 0 0", wordBreak: "keep-all" }}>
          {ln}
        </p>
      ))}
    </>
  );
}

export function SecretReveal({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<PublicInquiryDetail | null>(null);

  const submit = async () => {
    if (pending) return;
    setError(null);
    setPending(true);
    const res = await verifyInquiryPassword({ id, password: pin });
    setPending(false);
    if (res.ok) {
      setPost(res.post);
      setOpen(false);
    } else {
      setError(res.error);
    }
  };

  if (post) {
    const state = inquiryReplyState(post);
    return (
      <div style={{ padding: "32px 4px 36px", borderBottom: "1px solid var(--color-hairline)" }}>
        <Paragraphs text={post.content} color="var(--color-body)" size={17} />
        {state === "answered" ? (
          <div style={{ marginTop: 28, background: "var(--color-primary-soft)", border: "1px solid var(--color-primary-border)", borderRadius: 18, padding: 24 }}>
            <strong style={{ display: "block", marginBottom: 10, color: "var(--color-ink)" }}>성요셉목수학교 답변</strong>
            <div
              className="rich-content"
              style={{ fontSize: 16.5, color: "var(--color-body-strong)", lineHeight: 1.85 }}
              dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(post.answer!) }}
            />
          </div>
        ) : (
          <div style={{ marginTop: 24, background: "var(--color-surface-strong)", border: "1px solid var(--color-hairline)", borderRadius: 14, padding: 18, fontSize: 14.5, color: "var(--color-muted)", lineHeight: 1.6, wordBreak: "keep-all" }}>
            {state === "replied-directly"
              ? "남겨주신 문의는 전화 또는 방문 상담으로 직접 답변드렸습니다."
              : "답변을 준비하고 있습니다. 확인 후 전화 또는 게시판으로 답변드립니다."}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: "48px 4px", textAlign: "center" }}>
      <span style={{ display: "inline-grid", placeItems: "center", width: 56, height: 56, borderRadius: 16, background: "var(--color-surface-strong)", color: "var(--color-muted)", marginBottom: 16 }}>
        <Lock size={26} strokeWidth={2} />
      </span>
      <p style={{ fontSize: 16, color: "var(--color-body)", margin: "0 0 20px" }}>
        비밀글입니다. 작성 시 입력한 비밀번호를 입력해 주세요.
      </p>
      <Button variant="primary" size="md" onClick={() => setOpen(true)}>비밀번호 입력</Button>

      <Modal open={open} onClose={() => setOpen(false)} title="비밀글 확인">
        <div className="flex flex-col gap-[14px]">
          <Field label="비밀번호 (숫자 4자리)" type="password" inputMode="numeric" placeholder="••••"
            value={pin} maxLength={4} autoFocus
            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))} />
          {error && <p className="text-[13.5px] text-error m-0">{error}</p>}
          <Button variant="primary" size="lg" fullWidth onClick={submit} disabled={pending}>
            {pending ? "확인 중…" : "확인"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
