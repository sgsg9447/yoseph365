// lib/data/site.ts — 사이트 공통 상수
// 백엔드 연결 지점: 운영자 설정 테이블 또는 환경변수로 이전 가능

// ── 연락처 ────────────────────────────────────────────────────────────
export const PHONE_MAIN = "032-678-3650"; // 대표전화(실번호)
export const PHONE_FOOTER = "032-678-3650"; // Footer 표기용(동일)

// ── 상담 시간 ─────────────────────────────────────────────────────────
export const CONSULT_HOURS = "평일 9:30~18:00, 점심시간 12:00~13:00";

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

// ── SNS 링크 (플레이스홀더 — 실제 주소로 교체 필요) ───────────────────
export interface SnsLink {
  name: string;
  href: string;
  bg: string;
}

export const SNS_LINKS: SnsLink[] = [
  { name: "유튜브", href: "https://www.youtube.com", bg: "#FF0000" },
  { name: "네이버 블로그", href: "https://blog.naver.com", bg: "#03C75A" },
  {
    name: "인스타그램",
    href: "https://www.instagram.com",
    bg: "radial-gradient(circle at 30% 110%, #fdf497 0%, #fd5949 45%, #d6249f 60%, #285AEB 90%)",
  },
];
