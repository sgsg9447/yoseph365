// lib/data/site.ts — 사이트 공통 상수
// 백엔드 연결 지점: 운영자 설정 테이블 또는 환경변수로 이전 가능

// ── 연락처 ────────────────────────────────────────────────────────────
export const PHONE_MAIN = "032-678-3650"; // 대표전화(실번호)
export const PHONE_FOOTER = "032-678-3650"; // Footer 표기용(동일)

// ── 상담 시간 ─────────────────────────────────────────────────────────
export const CONSULT_HOURS = "평일 9:30~18:00, 점심시간 12:00~13:00";

// ── 수강신청 — 경기도 전액지원 과정 등록신청서(정적 PDF) ──────────────────
// public/forms/에 정적 파일로 두고 그대로 서빙. download 속성으로 한글 파일명 저장.
export const APPLY_FORM_URL = "/forms/yoseph-registration-form.pdf";
export const APPLY_FORM_FILENAME = "성요셉목수학교_등록신청서.pdf";

// ── 주소 ──────────────────────────────────────────────────────────────
export const ADDRESS = "경기도 부천시 성곡로 69, 2층~4층";
export const ADDRESS_DETAIL = "경기도 부천시 성곡로 69, 2층~4층";

// ── 사업자 정보 ───────────────────────────────────────────────────────
// Footer rows: [label, value][][]
export const BUSINESS_INFO_ROWS: [string, string][][] = [
  [["회사명", "주식회사 성요셉목수학교"], ["대표이사", "박경수"], ["개인정보책임자", "김빛나리"]],
  [["소재지", ADDRESS]],
  [["사업자등록번호", "679-88-00935"], ["평생직업교육원 등록번호", "제 6223호"]],
  [["전화", PHONE_FOOTER]],
];

// ── 국비지원 하위 메뉴 ────────────────────────────────────────────────
export const NAV_FUNDING = [
  { label: "국민내일배움카드 안내", href: "/funding#nbcard" },
  { label: "훈련참여절차", href: "/funding#process" },
  { label: "산재노동자 직업훈련", href: "/funding#sanjae" },
];
