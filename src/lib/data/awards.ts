// lib/data/awards.ts — 우수훈련기관 수상 이력
// 백엔드 연결 지점: Supabase `history` 테이블 (type = 'award')

export interface Award {
  year: string;
  label: string;
}

// 공유 데이터: AwardsStrip + Footer 양쪽에서 import
export const AWARDS: Award[] = [
  { year: "2022", label: "고용노동부 우수훈련기관" },
  { year: "2023", label: "경기도일자리재단 우수훈련기관" },
  { year: "2023", label: "경기도지사표창 훈련기관" },
  { year: "2024", label: "이수자평가 A등급" },
  { year: "2025", label: "고용노동부 3년인증 · 이수자평가 A등급" },
];
