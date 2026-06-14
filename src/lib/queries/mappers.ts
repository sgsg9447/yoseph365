import type {
  CourseDay,
  RecruitStatus,
  FundingType,
  TrackView,
  AboutHistoryView,
  ApplyInfoView,
} from "./types";

const FUNDING_LABELS: Record<FundingType, string> = {
  경기도무료: "경기도 전액지원",
  국비지원: "국비지원",
  자부담: "자부담",
};

export function fundingLabel(f: FundingType): string {
  return FUNDING_LABELS[f];
}

/** 카드/상세에 표시할 day 칩 목록. 자격증 과정은 단기 + 주말 둘 다 표시. */
export function courseDays(isCert: boolean, primaryDay: CourseDay): CourseDay[] {
  return isCert ? ["단기", "주말"] : [primaryDay];
}

export function patternToDay(p: string | null): CourseDay {
  if (p === "주말") return "주말";
  if (p === "단기") return "단기";
  return "평일";
}

export function patternToStartDate(p: string | null): string {
  if (p === "주말") return "주말반";
  if (p === "단기") return "단기";
  return "평일반";
}

interface CurriculumRow {
  round: number;
  unit: string | null;
  contents: string[];
  hours: number | null;
  place: string | null;
}

export function curriculumToTable(rows: CurriculumRow[]): string[][] {
  return [...rows]
    .sort((a, b) => a.round - b.round)
    .map((r) => [String(r.round), r.unit ?? "", r.contents.join("\n"), r.place ?? ""]);
}

function md(date: string | null): string {
  if (!date) return "";
  const [, m, d] = date.split("-");
  return `${m}.${d}`;
}

interface TrackRow {
  name: string;
  description: string | null;
  sessions_total: number | null;
  schedule_summary: string[];
  price: number | null;
  recruit_status: RecruitStatus;
}

interface ExamRow {
  round: string;
  apply_start: string | null;
  apply_end: string | null;
  exam_start: string | null;
  exam_end: string | null;
  result_dates: string[];
}

export function trackToView(track: TrackRow, exams: ExamRow[]): TrackView {
  return {
    name: track.name,
    description: track.description,
    sessionsText: track.sessions_total != null ? `${track.sessions_total}회` : "",
    priceText:
      track.price != null ? `${track.price.toLocaleString("ko-KR")}원` : "상담 안내",
    scheduleSummary: track.schedule_summary,
    recruitStatus: track.recruit_status,
    exams: exams.map((e) => ({
      round: e.round,
      applyPeriod: `${md(e.apply_start)} ~ ${md(e.apply_end)}`,
      examPeriod: `${md(e.exam_start)} ~ ${md(e.exam_end)}`,
      resultDates: e.result_dates.map(md).join(", "),
    })),
  };
}

interface HistoryRow {
  id: number;
  year: number;
  display_order: number;
}

interface HistoryItemRow {
  history_id: number;
  content: string;
  is_highlighted: boolean;
  display_order: number;
}

export function historyToView(
  histories: HistoryRow[],
  items: HistoryItemRow[],
): AboutHistoryView[] {
  return [...histories]
    .sort((a, b) => a.display_order - b.display_order)
    .map((h) => ({
      year: h.year,
      items: items
        .filter((it) => it.history_id === h.id)
        .sort((a, b) => a.display_order - b.display_order)
        .map((it) => ({ content: it.content, isHighlighted: it.is_highlighted })),
    }));
}

interface ApplyInfoRow {
  qualifications: string[];
  apply_method: string[];
  recruit_period: string | null;
  training_period: string | null;
  training_time: string[];
  capacity: string | null;
  cost: string | null;
  cost_notes: string[];
  steps: string[];
  exclusions: string[];
}

/**
 * 카탈로그 카드에 표시할 모집상태.
 * 자격증 과정(트랙 있음)은 트랙 중 하나라도 모집중이면 모집중, 아니면 마감.
 * 정규 과정은 코스 모집상태를 그대로 사용한다.
 */
export function courseRecruitStatus(
  courseStatus: RecruitStatus,
  tracks: { recruitStatus: RecruitStatus }[] | undefined,
): RecruitStatus {
  if (tracks && tracks.length > 0) {
    return tracks.some((t) => t.recruitStatus === "모집중") ? "모집중" : "마감";
  }
  return courseStatus;
}

export function applyInfoRowToView(row: ApplyInfoRow): ApplyInfoView {
  return {
    qualifications: row.qualifications,
    applyMethod: row.apply_method,
    recruitPeriod: row.recruit_period,
    trainingPeriod: row.training_period,
    trainingTime: row.training_time,
    capacity: row.capacity,
    cost: row.cost,
    costNotes: row.cost_notes,
    steps: row.steps,
    exclusions: row.exclusions,
  };
}
