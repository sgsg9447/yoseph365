import type { CourseDay, TrackView, AboutHistoryView } from "./types";

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
