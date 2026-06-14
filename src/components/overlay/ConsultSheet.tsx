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

const PHONE = PHONE_MAIN;

const INQUIRY_COURSES = [
  "[평일] 집수리과정",
  "[주말] 건축목공(인테리어목수)입문과정",
  "[주말] 인테리어필름과정",
  "건축목공기능사과정",
  "건축도장기능사과정",
];

// ── InquiryForm ───────────────────────────────────────────────────────────────

function InquiryForm({ onSubmit }: { onSubmit: () => void }) {
  const [checked, setChecked] = useState<string[]>([]);
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
          <select className={inputCls + " px-[10px] cursor-pointer"}>
            {["010", "011", "016", "017", "019"].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
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
      <p className="text-[13px] text-muted-soft text-center m-0 leading-[1.5]">
        남겨주시면 1영업일 안에 전화로 답변드립니다.
      </p>
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
      <Field label="연락처" type="tel" placeholder="010-0000-0000" required value={phone} onChange={(e) => setPhone(e.target.value)} />

      <label className="flex flex-col gap-[7px]">
        <ReqLabel optional>관심 과정</ReqLabel>
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="h-[52px] w-full bg-surface-card text-ink text-[17px] font-[inherit] rounded-button outline-none border border-hairline-strong px-4 cursor-pointer"
        >
          <option value="">선택 안 함</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>

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
