"use client";

// ApplyFlow — 수강신청 3단계 위저드 (모집안내 → 신청서 작성 → 접수완료)
// 참조: HANDOFF/ui_kits/website/apply-flow.jsx 전체

import { useState } from "react";
import { Check } from "@/components/icons";
import type { ApplyInfoView, RecruitStatus } from "@/lib/queries/types";
import { PHONE_MAIN } from "@/lib/data/site";

// ── 진행 단계 표시 ──────────────────────────────────────────────────
const STEP_LABELS = ["모집안내", "신청서 작성", "접수완료"];

function ApplySteps({ current }: { current: number }) {
  return (
    <nav
      aria-label="신청 진행 단계"
      className="flex items-center justify-center gap-[6px] mb-5"
    >
      {STEP_LABELS.map((s, i) => (
        <span key={s} className="inline-flex items-center gap-[6px]">
          <span
            aria-current={i === current ? "step" : undefined}
            className="inline-flex items-center gap-[6px]"
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
                background:
                  i <= current ? "var(--color-primary)" : "var(--color-canvas-soft)",
                color: i <= current ? "#fff" : "var(--color-muted-soft)",
                border:
                  i <= current
                    ? "1px solid var(--color-primary)"
                    : "1px solid var(--color-hairline-strong)",
              }}
            >
              {i + 1}
            </span>
            {/* Step label — real text node for accessibility */}
            <span
              style={{
                fontSize: 13,
                fontWeight: i === current ? 700 : 500,
                color:
                  i === current ? "var(--color-ink)" : "var(--color-muted-soft)",
              }}
            >
              {s}
            </span>
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

// ── 1단계: 모집안내 (DB course_apply_info) ──────────────────────────
function ApplyInfoStep({
  course,
  applyInfo,
  recruitStatus,
  onNext,
}: {
  course: string;
  applyInfo: ApplyInfoView | null;
  recruitStatus: RecruitStatus;
  onNext: () => void;
}) {
  const isOpen = recruitStatus === "모집중";

  // 모집안내 데이터가 없으면 상담 안내로 대체
  if (!applyInfo) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "center" }}>
        <p
          style={{
            fontSize: 15.5,
            color: "var(--color-body)",
            lineHeight: 1.7,
            margin: 0,
            wordBreak: "keep-all",
          }}
        >
          <b style={{ color: "var(--color-ink)" }}>{course || "훈련과정"}</b>의 모집안내는
          준비 중입니다.
          <br />
          전화({PHONE_MAIN})로 문의해 주시면 자세히 안내해 드립니다.
        </p>
        <a
          href={`tel:${PHONE_MAIN}`}
          className="inline-flex items-center justify-center gap-2 rounded-button font-semibold leading-none tracking-[-0.2px] whitespace-nowrap transition active:scale-[0.98] w-full h-14 px-[26px] text-[18px] bg-primary text-white border border-primary hover:bg-primary-hover"
        >
          전화 문의 {PHONE_MAIN}
        </a>
      </div>
    );
  }

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
        {applyInfo.qualifications.length > 0 && (
          <ApplyInfoRow label="신청자격">
            {applyInfo.qualifications.map((q, i) => (
              <span key={i} style={{ display: "block" }}>
                · {q}
              </span>
            ))}
          </ApplyInfoRow>
        )}
        {applyInfo.applyMethod.length > 0 && (
          <ApplyInfoRow label="지원방법">
            {applyInfo.applyMethod.map((m, i) => (
              <span key={i} style={{ display: "block" }}>
                · {m}
              </span>
            ))}
          </ApplyInfoRow>
        )}
        <ApplyInfoRow label="모집기간">
          {applyInfo.recruitPeriod || "신청 시 안내"}
        </ApplyInfoRow>
        {applyInfo.trainingPeriod && (
          <ApplyInfoRow label="훈련기간">{applyInfo.trainingPeriod}</ApplyInfoRow>
        )}
        {applyInfo.trainingTime.length > 0 && (
          <ApplyInfoRow label="훈련시간">
            {applyInfo.trainingTime.map((t, i) => (
              <span key={i} style={{ display: "block" }}>
                {t}
              </span>
            ))}
          </ApplyInfoRow>
        )}
        {applyInfo.capacity && (
          <ApplyInfoRow label="모집인원">{applyInfo.capacity}</ApplyInfoRow>
        )}
        {applyInfo.cost && (
          <ApplyInfoRow label="훈련비용">
            <span style={{ display: "block", fontWeight: 700, color: "var(--color-ink)" }}>
              {applyInfo.cost}
            </span>
            {applyInfo.costNotes.map((n, i) => (
              <span
                key={i}
                style={{ display: "block", fontSize: 13, color: "var(--color-muted)" }}
              >
                * {n}
              </span>
            ))}
          </ApplyInfoRow>
        )}
        {applyInfo.steps.length > 0 && (
          <ApplyInfoRow label="진행순서" last>
            {applyInfo.steps.map((o, i) => (
              <span key={i} style={{ display: "block" }}>
                {i + 1}. {o}
              </span>
            ))}
          </ApplyInfoRow>
        )}
      </div>

      {applyInfo.exclusions.length > 0 && (
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
            {applyInfo.exclusions.map((x, i) => (
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
      )}

      {isOpen ? (
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center justify-center gap-2 rounded-button font-semibold leading-none tracking-[-0.2px] whitespace-nowrap transition active:scale-[0.98] w-full h-14 px-[26px] text-[18px] bg-primary text-white border border-primary hover:bg-primary-hover"
        >
          확인했어요, 신청서 작성하기
        </button>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "16px",
            borderRadius: 14,
            background: "var(--color-canvas-soft)",
            border: "1px solid var(--color-hairline)",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: 15.5, fontWeight: 700, color: "var(--color-ink)" }}>
            현재 모집 중이 아닙니다
          </span>
          <span style={{ fontSize: 14, color: "var(--color-muted)", lineHeight: 1.6 }}>
            다음 모집 일정은 전화({PHONE_MAIN})로 안내해 드립니다.
          </span>
        </div>
      )}

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
  onBack,
}: {
  course: string;
  onSubmit: () => void;
  onBack: () => void;
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

      {/* 모집안내 다시 보기 (handoff apply.jsx lines 57-61) */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center justify-center gap-[6px] text-[14px] font-semibold text-muted bg-transparent border-none cursor-pointer p-0 mx-auto"
        style={{ color: "var(--color-muted)" }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        모집안내 다시 보기
      </button>
    </div>
  );
}

// ── 3단계: 접수완료 ─────────────────────────────────────────────────
function ApplyDone({ steps, onClose }: { steps: string[]; onClose: () => void }) {
  const order = steps.length > 0 ? steps : ["신청서 접수", "다음 단계 안내"];
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
        담당자가 확인 후 다음 단계를 개별 안내드립니다.
        <br />
        궁금한 점은 전화({PHONE_MAIN})로 문의해 주세요.
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
  applyInfo: ApplyInfoView | null;
  recruitStatus: RecruitStatus;
  onSubmitted?: () => void;
}

export function ApplyFlow({ course, applyInfo, recruitStatus, onSubmitted }: ApplyFlowProps) {
  const [step, setStep] = useState(0);

  return (
    <div>
      <ApplySteps current={step} />
      {step === 0 && (
        <ApplyInfoStep
          course={course}
          applyInfo={applyInfo}
          recruitStatus={recruitStatus}
          onNext={() => setStep(1)}
        />
      )}
      {step === 1 && (
        <ApplyFormStep
          course={course}
          onSubmit={() => {
            setStep(2);
            onSubmitted?.();
          }}
          onBack={() => setStep(0)}
        />
      )}
      {step === 2 && (
        <ApplyDone steps={applyInfo?.steps ?? []} onClose={() => setStep(0)} />
      )}
    </div>
  );
}
