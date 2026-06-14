"use client";

// 과정 상세 — /courses/[id] 라우트에서 렌더. 신청은 router로 /apply 이동.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import type { CatalogCourse, TrackView } from "@/lib/queries/types";
import { DayChip } from "./chips";

// ── ApplyCtaButton: 모집상태에 따라 활성/비활성 ──────────────────────
function ApplyCtaButton({
  open,
  onClick,
  label = "수강신청하기",
}: {
  open: boolean;
  onClick: () => void;
  label?: string;
}) {
  if (!open) {
    return (
      <button
        type="button"
        disabled
        aria-disabled
        className="inline-flex items-center justify-center gap-2 rounded-button font-semibold leading-none tracking-[-0.2px] whitespace-nowrap h-14 px-[26px] text-[18px]"
        style={{
          background: "var(--color-canvas-soft)",
          color: "var(--color-muted-soft)",
          border: "1px solid var(--color-hairline-strong)",
          cursor: "not-allowed",
        }}
      >
        모집마감
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-button font-semibold leading-none tracking-[-0.2px] whitespace-nowrap transition active:scale-[0.98] h-14 px-[26px] text-[18px] bg-primary text-white border border-primary hover:bg-primary-hover"
    >
      {label}
    </button>
  );
}

// ── CourseTracks: 자격증 트랙별 카드 + 실기 시험일정 + 트랙별 신청 ──
function CourseTracks({
  tracks,
  onApply,
}: {
  tracks: TrackView[];
  onApply: (name: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {tracks.map((t) => (
        <Card key={t.name} padding={0} style={{ overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              padding: "16px 18px",
              background: "var(--color-primary-soft)",
              borderBottom: "1px solid var(--color-hairline)",
            }}
          >
            <span style={{ fontSize: 17, fontWeight: 700, color: "var(--color-ink)" }}>
              {t.name}
            </span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--color-primary)" }}>
              {t.priceText}
              {t.sessionsText ? ` · ${t.sessionsText}` : ""}
            </span>
          </div>

          {t.scheduleSummary.length > 0 && (
            <div
              style={{
                padding: "12px 18px",
                fontSize: 14,
                color: "var(--color-muted)",
                lineHeight: 1.6,
                borderBottom: "1px solid var(--color-hairline)",
              }}
            >
              {t.scheduleSummary.map((s, i) => (
                <div key={i}>· {s}</div>
              ))}
            </div>
          )}

          {/* 실기 시험일정 — 모바일에서도 한 줄(exam-row) */}
          {t.exams.length > 0 && (
            <>
              <div className="exam-row exam-head">
                <span>회차</span>
                <span>실기 접수</span>
                <span>실기 시험</span>
                <span>합격 발표</span>
              </div>
              {t.exams.map((e, i) => (
                <div key={i} className="exam-row">
                  <span
                    style={{
                      fontWeight: 800,
                      color: "var(--color-ink)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {e.round}
                  </span>
                  <span style={{ color: "var(--color-body)" }}>{e.applyPeriod}</span>
                  <span style={{ color: "var(--color-body)" }}>{e.examPeriod}</span>
                  <span style={{ color: "var(--color-muted)" }}>{e.resultDates}</span>
                </div>
              ))}
            </>
          )}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: "16px 18px",
              borderTop: "1px solid var(--color-hairline)",
            }}
          >
            <ApplyCtaButton
              open={t.recruitStatus === "모집중"}
              onClick={() => onApply(t.name)}
              label={`${t.name} 신청`}
            />
            {t.recruitStatus !== "모집중" && (
              <span style={{ fontSize: 13.5, color: "var(--color-muted)" }}>
                현재 모집 중이 아닙니다
              </span>
            )}
          </div>
        </Card>
      ))}
      <p
        style={{
          fontSize: 13,
          color: "var(--color-muted-soft)",
          textAlign: "center",
          margin: 0,
        }}
      >
        시험일정은 큐넷(Q-net) 공고 기준이며 변동될 수 있습니다.
      </p>
    </div>
  );
}

// ── CourseDetailView: 상세 본문 ─────────────────────────────────────
export function CourseDetailView({ course }: { course: CatalogCourse }) {
  const router = useRouter();
  const applyName = course.name + (course.day === "주말" ? " (주말)" : "");
  const isOpen = course.recruitStatus === "모집중";

  const handleApply = (name: string) => {
    router.push(`/apply?course=${encodeURIComponent(name)}`);
  };

  return (
    <section className="wrap band" style={{ paddingBottom: 24 }}>
      {/* 뒤로가기 */}
      <Link
        href="/courses"
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
          textDecoration: "none",
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
      </Link>

      {/* 헤더 행 */}
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
            <span style={{ fontWeight: 600, fontSize: "0.62em", color: "var(--color-muted)" }}>
              {course.tracks ? "실기 시험일정" : "NCS 교육과정 일정표"}
            </span>
          </h2>
          <span style={{ fontSize: 14.5, color: "var(--color-muted)" }}>{course.meta}</span>
        </div>
        {!course.tracks && (
          <ApplyCtaButton open={isOpen} onClick={() => handleApply(applyName)} />
        )}
      </div>

      {/* 자격증: 트랙·시험일정 / 정규: NCS 회차표 */}
      {course.tracks ? (
        <CourseTracks tracks={course.tracks} onApply={handleApply} />
      ) : course.table.length > 0 ? (
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
              <span style={{ color: "var(--color-body)", whiteSpace: "pre-line" }}>{r[2]}</span>
              <span className="ncs-sub" style={{ fontVariantNumeric: "tabular-nums" }}>
                8H
              </span>
              <span className="ncs-sub">{r[3]}</span>
            </div>
          ))}
        </Card>
      ) : (
        <p
          style={{
            fontSize: 14.5,
            color: "var(--color-muted)",
            textAlign: "center",
            margin: "8px 0 0",
          }}
        >
          회차별 교육 내용은 상담 시 일정표로 안내드립니다.
        </p>
      )}

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

      {/* 하단 신청 버튼 (정규 과정만) */}
      {!course.tracks && (
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
          <ApplyCtaButton open={isOpen} onClick={() => handleApply(applyName)} />
          <span style={{ fontSize: 14, color: "var(--color-muted)" }}>
            {isOpen
              ? "개강일·잔여석은 신청 시 바로 안내드립니다"
              : "다음 모집 일정은 전화로 안내해 드립니다"}
          </span>
        </div>
      )}
    </section>
  );
}
