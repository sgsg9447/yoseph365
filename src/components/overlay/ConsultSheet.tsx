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
import { formatPhoneInput } from "@/lib/formatters/input";

const PHONE = PHONE_MAIN;

const INQUIRY_COURSES = [
  "[평일] 집수리과정",
  "[주말] 건축목공(인테리어목수)입문과정",
  "[주말] 인테리어필름과정",
  "건축목공기능사과정",
  "건축도장기능사과정",
];
const PHONE_PREFIXES = ["010", "011", "016", "017", "019"];

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

function PhonePrefixPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        border: "1px solid var(--color-hairline-strong)",
        borderRadius: 12,
        overflow: "hidden",
        background: "var(--color-surface-card)",
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          minHeight: 52,
          padding: "0 12px 0 14px",
          border: "none",
          background: "var(--color-surface-card)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          fontFamily: "var(--font-sans)",
          fontSize: 16,
          fontWeight: 600,
          color: "var(--color-ink)",
          cursor: "pointer",
        }}
      >
        {value}
        <svg
          width="16"
          height="16"
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
          {PHONE_PREFIXES.map((prefix, i) => {
            const active = prefix === value;
            return (
              <button
                key={prefix}
                type="button"
                onClick={() => {
                  onChange(prefix);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "none",
                  borderBottom:
                    i === PHONE_PREFIXES.length - 1 ? "none" : "1px solid var(--color-hairline-soft)",
                  background: active ? "var(--color-primary-soft)" : "transparent",
                  color: active ? "var(--color-primary)" : "var(--color-body-strong)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 15,
                  fontWeight: active ? 700 : 600,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                {prefix}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── InquiryForm ───────────────────────────────────────────────────────────────

function InquiryForm({ onSubmit }: { onSubmit: () => void }) {
  const [checked, setChecked] = useState<string[]>([]);
  const [phonePrefix, setPhonePrefix] = useState(PHONE_PREFIXES[0]);
  const toggle = (c: string) =>
    setChecked((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

  const inputCls =
    "h-[52px] px-[14px] font-[inherit] text-[16px] text-ink bg-surface-card rounded-button outline-none border border-hairline-strong min-w-0";

  return (
    <div className="flex flex-col gap-[18px]">
      {/* 이름 */}
      <label className="flex flex-col gap-[7px]">
        <span className="text-[15px] font-semibold text-body-strong">
          이름 <span aria-hidden="true" className="text-error ml-1">*</span>
        </span>
        <input placeholder="홍길동" className={inputCls} />
      </label>

      {/* 연락처 3-split */}
      <div className="flex flex-col gap-[7px]">
        <span className="text-[15px] font-semibold text-body-strong">
          연락처 <span aria-hidden="true" className="text-error ml-1">*</span>
        </span>
        <div className="grid gap-2" style={{ gridTemplateColumns: "96px 1fr 1fr" }}>
          <PhonePrefixPicker value={phonePrefix} onChange={setPhonePrefix} />
          <input
            type="tel"
            inputMode="numeric"
            maxLength={4}
            aria-label="연락처 가운데 자리"
            className={inputCls + " text-center"}
          />
          <input
            type="tel"
            inputMode="numeric"
            maxLength={4}
            aria-label="연락처 마지막 자리"
            className={inputCls + " text-center"}
          />
        </div>
      </div>

      {/* 강좌 체크리스트*/}
      <div className="flex flex-col gap-[9px]">
        <span className="text-[15px] font-semibold text-body-strong">
          수강신청 강좌 <span aria-hidden="true" className="text-error ml-1">*</span>
        </span>
        <div className="flex flex-col border border-hairline-strong rounded-button overflow-hidden">
          {INQUIRY_COURSES.map((c, i) => {
            const on = checked.includes(c);
            return (
              <label
                key={c}
                className={[
                  "flex items-center gap-[11px] px-[14px] py-[13px] cursor-pointer",
                  on ? "bg-primary-soft" : "bg-surface-card",
                  i !== 0 ? "border-t border-hairline" : "",
                ].join(" ")}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(c)}
                  className="w-[18px] h-[18px] flex-[0_0_auto] m-0 accent-primary"
                />
                <span
                  className={[
                    "text-[15px] text-ink break-keep",
                    on ? "font-semibold" : "font-medium",
                  ].join(" ")}
                >
                  {c}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 추가문의사항 */}
      <label className="flex flex-col gap-[7px]">
        <span className="text-[15px] font-semibold text-body-strong">추가문의사항</span>
        <textarea
          rows={4}
          placeholder="궁금하신 점을 자유롭게 남겨주세요"
          className="px-[14px] py-[13px] font-[inherit] text-[16px] text-ink bg-surface-card rounded-button outline-none border border-hairline-strong resize-y leading-[1.6] min-w-0 w-full"
        />
      </label>

      <Button variant="primary" size="lg" fullWidth onClick={onSubmit}>제출하기</Button>
    </div>
  );
}

// ── ConsultForm (상담신청) ────────────────────────────────────────────────────

function ConsultForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [courseId, setCourseId] = useState("");
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
    const res = await submitConsult({ name, phone, courseId });
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

      <div className="flex flex-col gap-[7px]">
        <ReqLabel optional>관심 과정</ReqLabel>
        <InterestCoursePicker courses={courses} courseId={courseId} onChange={setCourseId} />
      </div>

      {error && <p className="text-[13.5px] text-error leading-[1.5] m-0">{error}</p>}

      <Button
        variant="primary"
        size="lg"
        fullWidth
        leftIcon={<Phone size={19} strokeWidth={2.2} />}
        onClick={handleSubmit}
        disabled={pending}
      >
        {pending ? "접수 중…" : "상담 신청하기"}
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
            상담이 접수되었어요. 담당 선생님이 1영업일 안에 전화드려
            국비지원 자격과 과정을 안내해 드립니다.
          </p>
          <Button variant="primary" size="lg" fullWidth onClick={handleClose}>확인</Button>
        </div>
      ) : isInquiry ? (
        <InquiryForm onSubmit={() => setDone(true)} />
      ) : (
        <ConsultForm onDone={() => setDone(true)} />
      )}
    </BottomSheet>
  );
}
