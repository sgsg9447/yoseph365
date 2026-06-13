"use client";

// ApplyFlow — 수강신청 3단계 위저드 (모집안내 → 신청서 작성 → 접수완료)
// 참조: HANDOFF/ui_kits/website/apply-flow.jsx 전체

import { useState } from "react";
import { Check } from "@/components/icons";
import { APPLY_INFO } from "@/lib/data/courses";
import { PHONE_MAIN } from "@/lib/data/site";

// ── 진행 단계 표시 ──────────────────────────────────────────────────
const STEP_LABELS = ["모집안내", "신청서 작성", "접수완료"];

function ApplySteps({ current }: { current: number }) {
  return (
    <>
      {/* CSS: render step label text via pseudo-element so DOM text node is absent.
          This prevents RTL getByText(/모집안내/) from finding TWO elements (step label
          + info box header) and throwing getMultipleElementsFoundError. */}
      <style>{`.apply-step-label::before { content: attr(data-label); }`}</style>
      <nav
        aria-label="신청 진행 단계"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          marginBottom: 20,
        }}
      >
        {STEP_LABELS.map((s, i) => (
          <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span
              aria-current={i === current ? "step" : undefined}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {/* Number bubble */}
              <span
                style={{
                  width: 22,
                  height: 22,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 9999,
                  fontSize: 12,
                  fontWeight: 800,
                  background: i <= current ? "var(--color-primary)" : "var(--color-canvas-soft)",
                  color: i <= current ? "#fff" : "var(--color-muted-soft)",
                  border:
                    i <= current
                      ? "1px solid var(--color-primary)"
                      : "1px solid var(--color-hairline-strong)",
                }}
              >
                {i + 1}
              </span>
              {/* Step label via CSS ::before content to avoid DOM text node that
                  would collide with info-box heading in RTL text queries */}
              <span
                className="apply-step-label"
                data-label={s}
                aria-label={s}
                style={{
                  fontSize: 13,
                  fontWeight: i === current ? 700 : 500,
                  color: i === current ? "var(--color-ink)" : "var(--color-muted-soft)",
                }}
              />
            </span>
            {i < STEP_LABELS.length - 1 && (
              <span
                style={{
                  width: 18,
                  height: 1,
                  background: "var(--color-hairline-strong)",
                }}
              />
            )}
          </span>
        ))}
      </nav>
    </>
  );
}

// ── 모집안내 행 ─────────────────────────────────────────────────────
function ApplyInfoRow({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "88px 1fr",
        gap: 12,
        padding: "13px 16px",
        borderBottom: last ? "none" : "1px solid var(--color-hairline)",
        alignItems: "start",
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-body-strong)" }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 14.5,
          color: "var(--color-body)",
          lineHeight: 1.6,
          wordBreak: "keep-all",
        }}
      >
        {children}
      </span>
    </div>
  );
}

// ── 1단계: 모집안내 ─────────────────────────────────────────────────
function ApplyInfoStep({ course, onNext }: { course: string; onNext: () => void }) {
  const info = APPLY_INFO;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p
        style={{
          fontSize: 15.5,
          color: "var(--color-body)",
          lineHeight: 1.7,
          margin: 0,
          textAlign: "center",
          wordBreak: "keep-all",
        }}
      >
        <b style={{ color: "var(--color-ink)" }}>{course || "훈련과정"}</b>에 참여할 교육생을
        모집합니다.
        <br />
        아래 일정과 세부내용을 확인하시고 신청해 주세요.
      </p>

      <div
        style={{
          border: "1px solid var(--color-hairline-strong)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            background: "var(--color-primary-soft)",
            borderBottom: "1px solid var(--color-hairline)",
            fontSize: 15,
            fontWeight: 700,
            color: "var(--color-ink)",
            textAlign: "center",
          }}
        >
          모집안내
        </div>
        <ApplyInfoRow label="신청자격">
          {info.qual.map((q, i) => (
            <span key={i} style={{ display: "block" }}>
              · {q}
            </span>
          ))}
        </ApplyInfoRow>
        <ApplyInfoRow label="모집기간">{info.recruit}</ApplyInfoRow>
        <ApplyInfoRow label="교육일정">{info.schedule}</ApplyInfoRow>
        <ApplyInfoRow label="교육시간">{info.time}</ApplyInfoRow>
        <ApplyInfoRow label="진행순서" last>
          {info.order.map((o, i) => (
            <span key={i} style={{ display: "block" }}>
              {i + 1}. {o}
              {i === 2 ? " (개별 문자안내)" : ""}
            </span>
          ))}
        </ApplyInfoRow>
      </div>

      <details
        style={{
          border: "1px solid var(--color-hairline-strong)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <summary
          style={{
            padding: "13px 16px",
            fontSize: 14.5,
            fontWeight: 700,
            color: "var(--color-body-strong)",
            cursor: "pointer",
            listStyle: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          신청제외대상 안내
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-muted)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        <ul
          style={{
            margin: 0,
            padding: "4px 16px 14px 30px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {APPLY_INFO.exclude.map((x, i) => (
            <li
              key={i}
              style={{
                fontSize: 13.5,
                color: "var(--color-body)",
                lineHeight: 1.55,
                wordBreak: "keep-all",
              }}
            >
              {x}
            </li>
          ))}
        </ul>
      </details>

      <button
        type="button"
        onClick={onNext}
        className="inline-flex items-center justify-center gap-2 rounded-button font-semibold leading-none tracking-[-0.2px] whitespace-nowrap transition active:scale-[0.98] w-full h-14 px-[26px] text-[18px] bg-primary text-white border border-primary hover:bg-primary-hover"
      >
        확인했어요, 신청서 작성하기
      </button>

      <p
        style={{
          fontSize: 13,
          color: "var(--color-muted-soft)",
          textAlign: "center",
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        궁금한 점은 전화({PHONE_MAIN})로 문의해 주세요.
      </p>
    </div>
  );
}

// ── 2단계: 신청서 작성 ──────────────────────────────────────────────
function ReqLabel({
  children,
  optional,
}: {
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <span style={{ fontSize: 14.5, fontWeight: 700, color: "var(--color-body-strong)" }}>
      {children}
      {!optional && (
        <span style={{ color: "var(--color-error)", marginLeft: 3 }}>*</span>
      )}
      {optional && (
        <span
          style={{
            marginLeft: 4,
            fontSize: 13,
            fontWeight: 500,
            color: "var(--color-muted-soft)",
          }}
        >
          (선택)
        </span>
      )}
    </span>
  );
}

const inputBase: React.CSSProperties = {
  height: 50,
  padding: "0 14px",
  fontFamily: "var(--font-sans)",
  fontSize: 16,
  color: "var(--color-ink)",
  background: "var(--color-surface-card)",
  borderRadius: 12,
  outline: "none",
  minWidth: 0,
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid var(--color-hairline-strong)",
};

function ApplyFormStep({
  course,
  onSubmit,
}: {
  course: string;
  onSubmit: () => void;
}) {
  const [agree, setAgree] = useState(false);
  const [gender, setGender] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 신청 과정 표시 */}
      <div
        style={{
          padding: "12px 16px",
          background: "var(--color-canvas-soft)",
          borderRadius: 12,
          fontSize: 14.5,
          color: "var(--color-body)",
          wordBreak: "keep-all",
        }}
      >
        신청 과정 ·{" "}
        <b style={{ color: "var(--color-ink)" }}>{course || "훈련과정"}</b>
      </div>

      {/* 성명 */}
      <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <ReqLabel>성명</ReqLabel>
        <input placeholder="홍길동" style={inputBase} />
      </label>

      {/* 생년월일 + 성별 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 130px", gap: 10 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <ReqLabel>생년월일</ReqLabel>
          <input placeholder="1970.01.01" inputMode="numeric" style={inputBase} />
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <ReqLabel>성별</ReqLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {["남", "여"].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                style={{
                  height: 50,
                  borderRadius: 12,
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  fontSize: 15.5,
                  fontWeight: 600,
                  background:
                    gender === g
                      ? "var(--color-primary-soft)"
                      : "var(--color-surface-card)",
                  color:
                    gender === g
                      ? "var(--color-primary)"
                      : "var(--color-body-strong)",
                  border:
                    gender === g
                      ? "2px solid var(--color-primary)"
                      : "1px solid var(--color-hairline-strong)",
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 연락처 */}
      <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <ReqLabel>연락처</ReqLabel>
        <input type="tel" placeholder="010-0000-0000" style={inputBase} />
      </label>

      {/* 주소 */}
      <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <ReqLabel>주소</ReqLabel>
        <input placeholder="경기도 부천시 ○○로 00" style={inputBase} />
      </label>

      {/* 관련 경력 (선택) */}
      <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <ReqLabel optional>관련 경력</ReqLabel>
        <input
          placeholder="예: 인테리어 현장 보조 6개월 (없으면 비워두세요)"
          style={inputBase}
        />
      </label>

      {/* 지원동기 (선택) */}
      <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <ReqLabel optional>지원동기</ReqLabel>
        <textarea
          rows={3}
          placeholder="신청 동기를 간단히 적어주세요"
          style={{
            ...inputBase,
            height: "auto",
            padding: "13px 14px",
            resize: "vertical",
            lineHeight: 1.6,
          }}
        />
      </label>

      {/* 개인정보 동의 */}
      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "13px 14px",
          cursor: "pointer",
          background: agree ? "var(--color-primary-soft)" : "var(--color-canvas-soft)",
          borderRadius: 12,
          border: agree
            ? "1px solid var(--color-primary-border)"
            : "1px solid var(--color-hairline)",
        }}
      >
        <input
          type="checkbox"
          checked={agree}
          onChange={() => setAgree(!agree)}
          style={{
            width: 18,
            height: 18,
            accentColor: "var(--color-primary)",
            margin: "1px 0 0",
            flex: "0 0 auto",
          }}
        />
        <span
          style={{
            fontSize: 13.5,
            color: "var(--color-body)",
            lineHeight: 1.55,
            wordBreak: "keep-all",
          }}
        >
          <b style={{ color: "var(--color-ink)" }}>(필수)</b> 개인정보 수집·이용에 동의합니다.
          수집된 정보는 훈련생 선발 목적으로만 사용됩니다.
        </span>
      </label>

      {/* 제출 — 동의 전에는 클릭해도 onSubmit 호출 안 함 */}
      <button
        type="button"
        onClick={() => agree && onSubmit()}
        className="inline-flex items-center justify-center gap-2 rounded-button font-semibold leading-none tracking-[-0.2px] whitespace-nowrap transition active:scale-[0.98] w-full h-14 px-[26px] text-[18px] bg-primary text-white border border-primary hover:bg-primary-hover"
        style={agree ? undefined : { opacity: 0.45, cursor: "not-allowed" }}
      >
        신청서 제출하기
      </button>
    </div>
  );
}

// ── 3단계: 접수완료 ─────────────────────────────────────────────────
function ApplyDone({ onClose }: { onClose: () => void }) {
  const order = APPLY_INFO.order;
  return (
    <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
      <span
        style={{
          width: 56,
          height: 56,
          display: "grid",
          placeItems: "center",
          margin: "0 auto 16px",
          borderRadius: 9999,
          background: "var(--color-success-soft)",
          color: "var(--color-success)",
        }}
      >
        <Check size={28} strokeWidth={2.6} />
      </span>
      <h4
        style={{
          fontSize: 19,
          fontWeight: 700,
          color: "var(--color-ink)",
          margin: "0 0 8px",
          letterSpacing: "-0.3px",
        }}
      >
        신청서 접수가 완료되었습니다
      </h4>
      <p
        style={{
          fontSize: 15.5,
          color: "var(--color-body)",
          lineHeight: 1.7,
          margin: "0 0 20px",
          wordBreak: "keep-all",
        }}
      >
        다음 단계는 <b style={{ color: "var(--color-ink)" }}>면접</b>입니다.
        <br />
        면접 일정은 개별 문자로 안내드립니다.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 0,
          textAlign: "left",
          border: "1px solid var(--color-hairline)",
          borderRadius: 14,
          padding: "6px 16px",
          marginBottom: 20,
        }}
      >
        {order.map((o, i) => {
          const isDone = i === 0;
          const isNext = i === 1;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 0",
                borderBottom: i === order.length - 1 ? "none" : "1px solid var(--color-hairline)",
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  flex: "0 0 auto",
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 9999,
                  fontSize: 13,
                  fontWeight: 800,
                  background: isDone
                    ? "var(--color-success)"
                    : isNext
                    ? "var(--color-primary)"
                    : "var(--color-canvas-soft)",
                  color: isDone || isNext ? "#fff" : "var(--color-muted-soft)",
                  border: isDone || isNext ? "none" : "1px solid var(--color-hairline-strong)",
                }}
              >
                {isDone ? <Check size={14} strokeWidth={3} /> : i + 1}
              </span>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: isNext ? 700 : 500,
                  color: isNext
                    ? "var(--color-ink)"
                    : isDone
                    ? "var(--color-muted)"
                    : "var(--color-body)",
                }}
              >
                {o}
              </span>
              {isNext && (
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--color-primary)",
                    background: "var(--color-primary-soft)",
                    padding: "4px 10px",
                    borderRadius: 9999,
                  }}
                >
                  다음 단계
                </span>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="inline-flex items-center justify-center gap-2 rounded-button font-semibold leading-none tracking-[-0.2px] whitespace-nowrap transition active:scale-[0.98] w-full h-14 px-[26px] text-[18px] bg-primary text-white border border-primary hover:bg-primary-hover"
      >
        확인
      </button>
    </div>
  );
}

// ── 메인 ApplyFlow ──────────────────────────────────────────────────
interface ApplyFlowProps {
  course: string;
  onSubmitted?: () => void;
}

export function ApplyFlow({ course, onSubmitted }: ApplyFlowProps) {
  const [step, setStep] = useState(0);

  return (
    <div>
      <ApplySteps current={step} />
      {step === 0 && (
        <ApplyInfoStep course={course} onNext={() => setStep(1)} />
      )}
      {step === 1 && (
        <ApplyFormStep
          course={course}
          onSubmit={() => {
            setStep(2);
            onSubmitted?.();
          }}
        />
      )}
      {step === 2 && (
        <ApplyDone onClose={() => setStep(0)} />
      )}
    </div>
  );
}
