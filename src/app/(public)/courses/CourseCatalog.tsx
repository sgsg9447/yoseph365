"use client";

// CourseCatalog — 과정 안내 카탈로그 (클라이언트 컴포넌트: 선택 상태 + router)
// 참조: HANDOFF/ui_kits/website/courses.jsx (CourseCatalog2, CourseGrid, CourseDetail, EnrollSteps)

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Phone, Clipboard, Wallet, Award } from "@/components/icons";
import { CATALOG_COURSES, type CatalogCourse } from "@/lib/data/courses";

// ── DayChip: 평일(primary-soft) / 주말(mint) ──────────────────────
// handoff: --color-tint-mint 미정의 → arbitrary mint #e8f4ed / border #cfe5d8
function DayChip({ day }: { day: "평일" | "주말" }) {
  const isWeekend = day === "주말";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 26,
        padding: "0 11px",
        borderRadius: 9999,
        fontSize: 12.5,
        fontWeight: 700,
        letterSpacing: "0.2px",
        background: isWeekend ? "#e8f4ed" : "var(--color-primary-soft)",
        color: isWeekend ? "#3f7d5f" : "var(--color-primary)",
        border: "1px solid " + (isWeekend ? "#cfe5d8" : "var(--color-primary-border)"),
      }}
    >
      {day}
    </span>
  );
}

// ── CourseGrid: .g-2 카드 그리드 ─────────────────────────────────
function CourseGrid({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <section className="wrap band" style={{ paddingBottom: 24 }}>
      <SectionHeading
        align="center"
        eyebrow="2026년"
        title="운영중인 훈련과정"
        sub="현재 5개 과정을 운영하고 있습니다. 과정을 누르면 회차별 교육 내용을 볼 수 있습니다."
      />
      <div className="grid g-2" style={{ marginTop: 36 }}>
        {CATALOG_COURSES.map((c) => (
          <Card
            key={c.id}
            interactive
            padding={26}
            onClick={() => onSelect(c.id)}
            style={{ display: "flex", flexDirection: "column", gap: 12, cursor: "pointer" }}
          >
            {/* 뱃지 행 */}
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <span style={{ display: "flex", gap: 6 }}>
                <DayChip day={c.day} />
                <Badge tone="neutral">{c.badge}</Badge>
              </span>
              {/* 오른쪽 화살표 */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-muted-soft)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </span>

            {/* 과정명 */}
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "var(--color-ink)",
                letterSpacing: "-0.3px",
                lineHeight: 1.35,
                wordBreak: "keep-all",
              }}
            >
              {c.name}
            </span>

            {/* 태그 칩 */}
            <span style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {c.tags.map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: "var(--color-muted)",
                    background: "var(--color-canvas-soft)",
                    border: "1px solid var(--color-hairline)",
                    padding: "4px 10px",
                    borderRadius: 9999,
                  }}
                >
                  {t}
                </span>
              ))}
            </span>

            {/* 설명 */}
            <p
              style={{
                fontSize: 15,
                color: "var(--color-body)",
                lineHeight: 1.7,
                margin: 0,
                wordBreak: "keep-all",
                flex: 1,
              }}
            >
              {c.desc}
            </p>

            {/* 메타 */}
            <span
              style={{ fontSize: 13.5, fontWeight: 600, color: "var(--color-muted)" }}
            >
              {c.meta}
            </span>
          </Card>
        ))}
      </div>
    </section>
  );
}

// ── CourseDetail: 과정 상세 + NCS 일정표 ─────────────────────────
function CourseDetail({
  course,
  onBack,
  onApply,
}: {
  course: CatalogCourse;
  onBack: () => void;
  onApply: (name: string) => void;
}) {
  const applyName = course.name + (course.day === "주말" ? " (주말)" : "");

  return (
    <section className="wrap band" style={{ paddingBottom: 24 }}>
      {/* 뒤로가기 버튼 */}
      <button
        type="button"
        onClick={onBack}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          height: 38,
          padding: "0 14px 0 10px",
          borderRadius: 9999,
          border: "1px solid var(--color-hairline-strong)",
          background: "var(--color-surface-card)",
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--color-body-strong)",
          cursor: "pointer",
          marginBottom: 26,
        }}
      >
        <svg
          width="16"
          height="16"
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
        과정 목록
      </button>

      {/* 헤더 행: 제목 + 상단 신청 버튼 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px 20px",
          marginBottom: 26,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ display: "flex", gap: 6 }}>
            <DayChip day={course.day} />
            <Badge tone="neutral">{course.badge}</Badge>
          </span>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(22px, 3vw, 30px)",
              fontWeight: 700,
              color: "var(--color-ink)",
              letterSpacing: "-0.5px",
              lineHeight: 1.3,
              margin: 0,
              wordBreak: "keep-all",
            }}
          >
            {course.name}{" "}
            <span
              style={{
                fontWeight: 600,
                fontSize: "0.62em",
                color: "var(--color-muted)",
              }}
            >
              NCS 교육과정 일정표
            </span>
          </h2>
          <span style={{ fontSize: 14.5, color: "var(--color-muted)" }}>{course.meta}</span>
        </div>
        <button
          type="button"
          onClick={() => onApply(applyName)}
          className="inline-flex items-center justify-center gap-2 rounded-button font-semibold leading-none tracking-[-0.2px] whitespace-nowrap transition active:scale-[0.98] h-14 px-[26px] text-[18px] bg-primary text-white border border-primary hover:bg-primary-hover"
        >
          수강신청하기
        </button>
      </div>

      {/* NCS 일정표 */}
      <Card padding={0} style={{ overflow: "hidden" }}>
        <div className="ncs-row ncs-head">
          <span>회차</span>
          <span>능력단위</span>
          <span>훈련내용</span>
          <span>시간</span>
          <span>교육장소</span>
        </div>
        {course.table.map((r, i) => (
          <div key={i} className="ncs-row">
            <span
              style={{
                fontWeight: 800,
                color: "var(--color-ink)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {r[0]}
            </span>
            <span style={{ fontWeight: 600, color: "var(--color-body-strong)" }}>{r[1]}</span>
            <span style={{ color: "var(--color-body)" }}>{r[2]}</span>
            <span className="ncs-sub" style={{ fontVariantNumeric: "tabular-nums" }}>
              8H
            </span>
            <span className="ncs-sub">{r[3]}</span>
          </div>
        ))}
      </Card>

      {/* 추가 안내 */}
      {course.moreNote && (
        <p
          style={{
            fontSize: 14,
            color: "var(--color-muted)",
            margin: "14px 0 0",
            textAlign: "center",
          }}
        >
          {course.moreNote}
        </p>
      )}

      {/* 하단 신청 버튼 + 개강일 안내 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px 16px",
          marginTop: 30,
        }}
      >
        <button
          type="button"
          onClick={() => onApply(applyName)}
          className="inline-flex items-center justify-center gap-2 rounded-button font-semibold leading-none tracking-[-0.2px] whitespace-nowrap transition active:scale-[0.98] h-14 px-[26px] text-[18px] bg-primary text-white border border-primary hover:bg-primary-hover"
        >
          수강신청하기
        </button>
        <span style={{ fontSize: 14, color: "var(--color-muted)" }}>
          개강일·잔여석은 신청 시 바로 안내드립니다
        </span>
      </div>
    </section>
  );
}

// ── EnrollSteps: 국비훈련생 등록 절차 4단계 ─────────────────────────
function EnrollSteps() {
  const steps = [
    {
      icon: <Phone size={24} />,
      t: "훈련기관 등록",
      d: "훈련기관에 전화로 등록 가능 여부 확인",
    },
    {
      icon: <Clipboard size={24} />,
      t: "고용24 수강신청",
      d: "고용24 홈페이지에서 훈련 수강 등록",
    },
    {
      icon: <Wallet size={24} />,
      t: "훈련기관 결제",
      d: "훈련기관 최종 등록 및 결제",
    },
    {
      icon: <Award size={24} />,
      t: "훈련생 최종선발",
      d: "훈련생 최종 선발 후 개강일 안내",
    },
  ];

  return (
    <section
      style={{
        background: "var(--color-canvas-soft)",
        borderTop: "1px solid var(--color-hairline)",
      }}
    >
      <div className="wrap band">
        <SectionHeading
          align="center"
          eyebrow="등록 절차"
          title="국비훈련생 등록 절차"
          sub="아래 4단계를 따라 등록해 주세요. 어려우면 전화 주시면 처음부터 끝까지 도와드립니다."
        />
        <div className="steps" style={{ marginTop: 40 }}>
          {steps.map((s, idx) => {
            const isLast = idx === steps.length - 1;
            return (
              <div key={idx} className="step">
                <div className="step-top">
                  <span
                    style={{
                      width: 46,
                      height: 46,
                      flex: "0 0 auto",
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 9999,
                      background: isLast
                        ? "var(--color-primary)"
                        : "var(--color-surface-card)",
                      border:
                        "1px solid " +
                        (isLast
                          ? "var(--color-primary)"
                          : "var(--color-hairline-strong)"),
                      color: isLast ? "#fff" : "var(--color-body-strong)",
                    }}
                  >
                    {s.icon}
                  </span>
                  {!isLast && <span className="step-line" />}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <span
                    style={{
                      fontSize: 16.5,
                      fontWeight: 700,
                      color: "var(--color-ink)",
                      letterSpacing: "-0.2px",
                    }}
                  >
                    {"0" + (idx + 1) + ". " + s.t}
                  </span>
                  <span
                    style={{
                      fontSize: 14.5,
                      color: "var(--color-muted)",
                      lineHeight: 1.55,
                      wordBreak: "keep-all",
                      paddingRight: 14,
                    }}
                  >
                    {s.d}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── CourseCatalog: 메인 클라이언트 컴포넌트 ─────────────────────────
export function CourseCatalog() {
  const [sel, setSel] = useState<string | null>(null);
  const router = useRouter();
  const course = CATALOG_COURSES.find((c) => c.id === sel) ?? null;

  const handleApply = (name: string) => {
    router.push(`/apply?course=${encodeURIComponent(name)}`);
  };

  const handleSelect = (id: string) => {
    setSel(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {course ? (
        <CourseDetail
          course={course}
          onBack={() => setSel(null)}
          onApply={handleApply}
        />
      ) : (
        <CourseGrid onSelect={handleSelect} />
      )}
      <EnrollSteps />
    </>
  );
}
