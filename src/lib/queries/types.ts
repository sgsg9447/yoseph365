// 공개 콘텐츠 읽기용 UI 뷰 타입.
// DB 행(snake_case)을 매핑 함수로 변환해 이 타입들로 노출한다.

export type CourseDay = "평일" | "주말" | "단기";

export interface TrackExamView {
  round: string;
  applyPeriod: string; // "02.02 ~ 02.05"
  examPeriod: string; // "03.14 ~ 04.01"
  resultDates: string; // "04.10, 04.17"
}

export interface TrackView {
  name: string;
  description: string | null;
  sessionsText: string; // "5회"
  priceText: string; // "600,000원"
  scheduleSummary: string[];
  exams: TrackExamView[];
}

export interface CatalogCourse {
  id: string;
  day: CourseDay;
  name: string;
  tags: string[];
  desc: string;
  meta: string;
  /** 회차/능력단위/훈련내용/교육장소 — 정규 과정만 */
  table: string[][];
  /** 자격증 과정만 — 있으면 회차표 대신 트랙·시험일정 렌더 */
  tracks?: TrackView[];
  moreNote?: string;
}

export interface ScheduleCourse {
  name: string;
  /** "평일반" | "주말반" | "단기" */
  startDate: string;
  meta: string;
  open: boolean;
}

export interface AboutHistoryView {
  year: number;
  items: { content: string; isHighlighted: boolean }[];
}

export interface SiteSectionView {
  title: string | null;
  body: string[];
}
