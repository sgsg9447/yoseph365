// lib/data/courses.ts — 과정 표시 데이터 (정적 하드코딩)
// 백엔드 연결 지점: Supabase `course` 테이블로 교체 예정.
// export 함수 시그니처를 유지하면서 fetch → return 형태로 전환할 것.

export interface ScheduleCourse {
  name: string;
  /** "평일반" | "주말반" — 개강일 표시 금지 (도메인 규칙) */
  startDate: string;
  meta: string;
  open: boolean;
}

export interface CatalogCourse {
  name: string;
  meta: string;
  desc: string;
}

export interface ApplyInfo {
  qual: string[];
  recruit: string;
  schedule: string;
  time: string;
  order: string[];
  exclude: string[];
}

// ── 홈 Schedule 섹션용 과정 목록 ──────────────────────────────────────
// 백엔드 연결 지점: GET /api/courses?status=open (Supabase course 테이블)
export const SCHEDULE_COURSES: ScheduleCourse[] = [
  { name: "친환경 집수리 과정", startDate: "평일반", meta: "목공·전기·타일·설비·단열·욕실", open: true },
  { name: "건축목공(인테리어목수) 입문과정", startDate: "평일반", meta: "입문 · 주간", open: true },
  { name: "건축목공(인테리어목수) 입문과정", startDate: "주말반", meta: "입문 · 주말", open: true },
  { name: "인테리어필름 입문과정", startDate: "주말반", meta: "입문 · 주말", open: true },
  { name: "국가기능사 자격 과정", startDate: "평일반", meta: "자격 대비 · 주간", open: true },
];

// ── 과정 안내 페이지용 카탈로그 ────────────────────────────────────────
// 백엔드 연결 지점: Supabase course 테이블 (description, meta 필드)
export const CATALOG_COURSES: CatalogCourse[] = [
  {
    name: "목공 기초반",
    meta: "3개월 · 주간 · 정원 16명",
    desc: "톱·끌·대패 등 기본 공구 사용법부터 작은 가구 제작까지. 처음 배우는 분께 맞춘 입문 과정입니다.",
  },
  {
    name: "집수리·인테리어반",
    meta: "4개월 · 주간 · 정원 16명",
    desc: "문·창호 보수, 벽체·바닥 시공, 타일·도배 기초까지. 우리 집 수리와 현장 취업에 바로 쓰는 기술.",
  },
  {
    name: "가구 제작 심화반",
    meta: "3개월 · 주간 · 정원 12명",
    desc: "수납장·테이블·의자 등 실사용 가구를 직접 설계·제작. 기초반 수료 또는 경험자 대상 과정.",
  },
  {
    name: "주말 목공 취미반",
    meta: "2개월 · 주말 · 정원 12명",
    desc: "주중에 시간 내기 어려운 분을 위한 주말 과정. 도마·트레이 등 생활 소품 위주로 즐겁게.",
  },
  {
    name: "건축목공 자격대비반",
    meta: "4개월 · 주간 · 정원 16명",
    desc: "건축목공기능사 실기·필기를 함께 준비하는 자격 대비 과정. 취업·창업 준비생에게 추천.",
  },
];

// ── 수강신청 과정 선택지 ───────────────────────────────────────────────
// 백엔드 연결 지점: Supabase course 테이블 (recruit_status = '모집중')
export const APPLY_COURSES: string[] = [
  "친환경 집수리 과정",
  "건축목공(인테리어목수) 입문과정 (평일반)",
  "건축목공(인테리어목수) 입문과정 (주말반)",
  "인테리어필름 입문과정",
  "국가기능사 자격 과정",
];

// ── 수강신청 모집안내 정보 ─────────────────────────────────────────────
// 백엔드 연결 지점: Supabase course/schedule 테이블 (모집기간, 교육일정 등)
// 도메인 메모: 백엔드 연결 시 "신청 시 안내" 규칙에 따라 날짜 노출 여부 재검토
export const APPLY_INFO: ApplyInfo = {
  qual: ["만 19세 이상 경기도민이며 구직자", "면접 시 등본 또는 초본을 확인합니다"],
  recruit: "26.05.26 (화) ~ 26.06.30 (화)",
  schedule: "26.07.06 (월) ~ 26.08.19 (수)",
  time: "08:30 ~ 15:10 (1일 6시간)",
  order: ["신청서 접수", "면접 진행", "선발자 발표", "훈련 참여"],
  exclude: [
    "현재 상용직으로 취업상태인 자",
    "실업자훈련 등 다른 훈련과정을 수강중인 자",
    "부정수급 등으로 수강제한 처분 중인 자",
    "사업자등록증 보유자 (단, 최근년도 매출 1억 5천만원 이하인 경우 참여가능)",
    "6개월 이내 즉시 취업이 어려운 자",
    "전년도 동일한 직종을 수강한 자",
    "당해연도에 숙련건설기능인력 양성사업 교육에 기 참여한 자",
  ],
};
