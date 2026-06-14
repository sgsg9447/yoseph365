// 공개 콘텐츠 읽기용 UI 뷰 타입.
// DB 행(snake_case)을 매핑 함수로 변환해 이 타입들로 노출한다.

export type CourseDay = "평일" | "주말" | "단기";

export type RecruitStatus = "모집예정" | "모집중" | "마감";

export type FundingType = "경기도무료" | "국비지원" | "자부담";

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
  recruitStatus: RecruitStatus;
  exams: TrackExamView[];
}

export interface CatalogCourse {
  id: string;
  day: CourseDay;
  /** 표시용 day 칩 목록(자격증은 단기+주말). day는 신청명 등 로직용. */
  days: CourseDay[];
  name: string;
  tags: string[];
  desc: string;
  meta: string;
  recruitStatus: RecruitStatus;
  funding: FundingType;
  /** 회차/능력단위/훈련내용/교육장소 — 정규 과정만 */
  table: string[][];
  /** 자격증 과정만 — 있으면 회차표 대신 트랙·시험일정 렌더 */
  tracks?: TrackView[];
  moreNote?: string;
}

export interface ApplyInfoView {
  qualifications: string[];
  recruitPeriod: string | null;
  trainingPeriod: string | null;
  trainingTime: string[];
  capacity: string | null;
  cost: string | null;
  costNotes: string[];
  steps: string[];
  exclusions: string[];
}

export interface ApplyCourse {
  name: string;
  recruitStatus: RecruitStatus;
  applyInfo: ApplyInfoView | null;
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
