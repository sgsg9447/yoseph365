// 과정 카드/상세 공용 칩 (DayChip · RecruitBadge) — 훅 없는 프레젠테이션 컴포넌트.
// 서버/클라이언트 컴포넌트 양쪽에서 사용 가능.

import type { CourseDay, RecruitStatus, FundingType } from "@/lib/queries/types";

// 평일(primary) / 주말(violet — 모집중 초록과 구분) / 단기(amber)
const DAY_CHIP_STYLES: Record<CourseDay, { bg: string; color: string; border: string }> = {
  평일: {
    bg: "var(--color-primary-soft)",
    color: "var(--color-primary)",
    border: "var(--color-primary-border)",
  },
  주말: { bg: "#f1ebfb", color: "#6d28d9", border: "#ddd0f5" },
  단기: { bg: "#fbeede", color: "#b06a13", border: "#f0d8b4" },
};

export function DayChip({ day }: { day: CourseDay }) {
  const s = DAY_CHIP_STYLES[day];
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
        background: s.bg,
        color: s.color,
        border: "1px solid " + s.border,
      }}
    >
      {day}
    </span>
  );
}

const RECRUIT_BADGE_STYLES: Record<
  RecruitStatus,
  { label: string; bg: string; color: string; border: string }
> = {
  모집중: { label: "모집중", bg: "#e6f4ea", color: "#1f7a43", border: "#bfe3cb" },
  마감: {
    label: "모집마감",
    bg: "var(--color-canvas-soft)",
    color: "var(--color-muted-soft)",
    border: "var(--color-hairline-strong)",
  },
  모집예정: { label: "모집예정", bg: "#fbeede", color: "#b06a13", border: "#f0d8b4" },
};

export function RecruitBadge({ status }: { status: RecruitStatus }) {
  const s = RECRUIT_BADGE_STYLES[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        height: 26,
        padding: "0 11px",
        borderRadius: 9999,
        fontSize: 12.5,
        fontWeight: 700,
        letterSpacing: "0.2px",
        background: s.bg,
        color: s.color,
        border: "1px solid " + s.border,
      }}
    >
      {status === "모집중" && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 9999,
            background: "currentColor",
            display: "inline-block",
          }}
        />
      )}
      {s.label}
    </span>
  );
}

// ── FundingBadge: 경기도 전액지원(teal) / 국비지원(rose) / 자부담(navy) ──
// 셋은 서로 다른 색이며, day·모집 칩과도 겹치지 않도록 선택.
const FUNDING_BADGE_STYLES: Record<
  FundingType,
  { bg: string; color: string; border: string }
> = {
  경기도무료: { bg: "#dff1f2", color: "#0d7682", border: "#bfe3e6" },
  국비지원: { bg: "#fdeaf0", color: "#c02a63", border: "#f5cbdc" },
  자부담: { bg: "#e9edf5", color: "#2f4a7c", border: "#cdd8ea" },
};

export function FundingBadge({ funding }: { funding: FundingType }) {
  const s = FUNDING_BADGE_STYLES[funding];
  const label = funding === "경기도무료" ? "경기도 전액지원" : funding;
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
        background: s.bg,
        color: s.color,
        border: "1px solid " + s.border,
      }}
    >
      {label}
    </span>
  );
}
