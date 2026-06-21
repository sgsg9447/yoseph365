"use client";

import { useState, useEffect } from "react";
import { BottomSheet } from "./BottomSheet";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { ReqLabel } from "@/components/ui/Field";
import { Phone, Check } from "@/components/icons";
import { PHONE_MAIN } from "@/lib/data/site";
import { createClient } from "@/lib/supabase/client";
import { submitConsult } from "@/lib/actions/submit";
import { InquiryPostForm } from "./InquiryPostForm";
import { formatPhoneInput } from "@/lib/formatters/input";

const PHONE = PHONE_MAIN;

function InterestCoursePicker({
  courses,
  courseId,
  onChange,
}: {
  courses: { id: string; name: string }[];
  courseId: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = courses.find((c) => c.id === courseId);
  const options = [{ id: "", name: "선택 안 함" }, ...courses];

  return (
    <div
      style={{
        border: "1px solid var(--color-hairline-strong)",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          padding: "13px 16px",
          border: "none",
          background: "var(--color-surface-card)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          fontFamily: "var(--font-sans)",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            minWidth: 0,
            fontSize: 16,
            fontWeight: 700,
            color: "var(--color-ink)",
            lineHeight: 1.45,
            wordBreak: "keep-all",
          }}
        >
          {selected?.name ?? "선택 안 함"}
        </span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          style={{
            flex: "0 0 auto",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform .15s ease",
          }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            borderTop: "1px solid var(--color-hairline)",
            background: "var(--color-surface-card)",
          }}
        >
          {options.map((c, i) => {
            const active = c.id === courseId;
            return (
              <button
                key={c.id || "none"}
                type="button"
                onClick={() => {
                  onChange(c.id);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "none",
                  borderBottom:
                    i === options.length - 1 ? "none" : "1px solid var(--color-hairline-soft)",
                  background: active ? "var(--color-primary-soft)" : "transparent",
                  color: active ? "var(--color-primary)" : "var(--color-body-strong)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 15,
                  fontWeight: active ? 700 : 600,
                  lineHeight: 1.45,
                  textAlign: "left",
                  wordBreak: "keep-all",
                  cursor: "pointer",
                }}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── ConsultForm (상담신청) ────────────────────────────────────────────────────

function ConsultForm({
  onDone,
  submitLabel,
}: {
  onDone: () => void;
  submitLabel: string;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [courseId, setCourseId] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 관심 과정: 전체 과정(모집중 아니어도)
  useEffect(() => {
    const sb = createClient();
    sb.from("course")
      .select("id, name")
      .eq("is_deleted", false)
      .order("sort_order")
      .then(({ data }) => setCourses(data ?? []));
  }, []);

  const handleSubmit = async () => {
    if (pending) return;
    setError(null);
    setPending(true);
    const res = await submitConsult({ name, phone, courseId, email, message });
    setPending(false);
    if (res.ok) onDone();
    else setError(res.error);
  };

  return (
    <div className="flex flex-col gap-[14px]">
      {/* Phone info block */}
      <div className="flex items-center gap-3 px-4 py-[14px] bg-surface-strong border border-hairline rounded-button">
        <span className="text-ink"><Phone size={20} strokeWidth={2.2} /></span>
        <div className="flex-1">
          <div className="text-[15px] text-muted">바로 통화를 원하시면</div>
          <a href={`tel:${PHONE}`} className="text-[19px] font-bold text-ink no-underline">
            {PHONE}
          </a>
        </div>
      </div>

      <Field label="이름" placeholder="홍길동" required value={name} onChange={(e) => setName(e.target.value)} />
      <Field
        label="연락처"
        type="tel"
        inputMode="numeric"
        placeholder="010-0000-0000"
        required
        value={phone}
        maxLength={13}
        onChange={(e) =>
          setPhone(formatPhoneInput(e.target.value, (e.nativeEvent as InputEvent).inputType))
        }
      />
      <Field
        label="이메일"
        type="email"
        inputMode="email"
        placeholder="선택 입력"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <div className="flex flex-col gap-[7px]">
        <ReqLabel optional>관심 과정</ReqLabel>
        <InterestCoursePicker courses={courses} courseId={courseId} onChange={setCourseId} />
      </div>

      <Field
        label="추가문의사항"
        as="textarea"
        placeholder="궁금하신 점을 자유롭게 남겨주세요"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      {error && <p className="text-[13.5px] text-error leading-[1.5] m-0">{error}</p>}

      <Button
        variant="primary"
        size="lg"
        fullWidth
        leftIcon={<Phone size={19} strokeWidth={2.2} />}
        onClick={handleSubmit}
        disabled={pending}
      >
        {pending ? "접수 중…" : submitLabel}
      </Button>
      <p className="text-[13px] text-muted-soft text-center m-0 leading-[1.5]">
        입력하신 정보는 상담 목적으로만 사용됩니다.
      </p>
    </div>
  );
}

// ── ConsultSheet ──────────────────────────────────────────────────────────────

interface ConsultSheetProps {
  open: boolean;
  onClose: () => void;
  mode: "consult" | "inquiry";
}

export function ConsultSheet({ open, onClose, mode }: ConsultSheetProps) {
  const [done, setDone] = useState(false);

  const isInquiry = mode === "inquiry";
  const submitLabel = isInquiry ? "문의 남기기" : "상담 신청하기";

  // Reset done state when sheet closes
  const handleClose = () => {
    setDone(false);
    onClose();
  };

  const title = done
    ? isInquiry
      ? "문의 완료"
      : "상담 신청 완료"
    : isInquiry
    ? "문의 남기기"
    : "무료 상담 신청";

  return (
    <BottomSheet open={open} onClose={handleClose} title={title}>
      {done ? (
        /* Completion screen */
        <div className="text-center py-[8px]">
          <span className="w-14 h-14 grid place-items-center mx-auto mb-4 rounded-full bg-success-soft text-success">
            <Check size={28} strokeWidth={2.6} />
          </span>
          <p className="text-[17px] text-body leading-[1.7] mb-[22px] break-keep">
            {isInquiry
              ? "문의가 등록되었어요. 작성하신 내용은 게시판에서 확인하실 수 있고, 관리자가 1영업일 안에 답변드립니다."
              : "상담이 접수되었어요. 담당 선생님이 1영업일 안에 전화드려 국비지원 자격과 과정을 안내해 드립니다."}
          </p>
          <Button variant="primary" size="lg" fullWidth onClick={handleClose}>확인</Button>
        </div>
      ) : isInquiry ? (
        <InquiryPostForm onDone={() => setDone(true)} />
      ) : (
        <ConsultForm onDone={() => setDone(true)} submitLabel={submitLabel} />
      )}
    </BottomSheet>
  );
}
