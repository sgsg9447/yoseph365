// Server component — footer with business info and awards.

import Image from "next/image";

const AWARDS = [
  { year: "2022", label: "고용노동부 우수훈련기관" },
  { year: "2023", label: "경기도일자리재단 우수훈련기관" },
  { year: "2023", label: "경기도지사표창 훈련기관" },
  { year: "2024", label: "이수자평가 A등급" },
  { year: "2025", label: "고용노동부 3년인증 · 이수자평가 A등급" },
];

const rows: [string, string][][] = [
  [["회사명", "주식회사 성요셉목수학교"], ["대표이사", "박경수"], ["개인정보책임자", "김버나"]],
  [["소재지", "경기도 부천시 성고로 69, 2층 · 4층"]],
  [["사업자등록번호", "679-88-00935"], ["평생직업교육원 등록번호", "제 6223호"]],
  [["전화", "032-678-3650"]],
];

export function Footer() {
  return (
    <footer
      className="bg-canvas text-muted border-t border-hairline"
      style={{ paddingBottom: 90 }}
    >
      {/* Business info grid */}
      <div className="wrap band footer-grid" style={{ paddingBottom: 26 }}>
        <Image
          src="/logo/logo-primary.png"
          alt="성요셉목수학교"
          width={180}
          height={96}
          className="footer-logo"
          style={{ height: 72, width: "auto" }}
        />
        <div className="flex flex-col gap-[9px]">
          {rows.map((row, ri) => (
            <div key={ri} className="flex flex-wrap gap-x-[22px] gap-y-1">
              {row.map(([k, v], ki) => (
                <span
                  key={ki}
                  className="inline-flex items-baseline gap-2 text-[14.5px] leading-[1.7]"
                >
                  <span className="text-muted-soft font-semibold whitespace-nowrap">{k}</span>
                  <span className="text-body-strong font-semibold">{v}</span>
                </span>
              ))}
            </div>
          ))}
          <span className="text-[13.5px] text-muted mt-[2px]">
            상담시간 — 평일 9:30~18:00, 점심시간 12:00~13:00
          </span>
        </div>
      </div>

      {/* Awards + copyright */}
      <div
        className="wrap flex flex-col gap-[14px] pt-[22px] border-t border-hairline"
      >
        <div className="awards-list justify-center">
          {AWARDS.map((a, i) => (
            <span
              key={i}
              className="inline-flex items-baseline gap-2 text-[14px] whitespace-nowrap"
            >
              <b className="text-body-strong tabular-nums">{a.year}</b>
              <span className="text-body">{a.label}</span>
            </span>
          ))}
        </div>
        <span className="text-[13px] text-muted-soft leading-[1.7] text-center break-keep">
          © 2026 주식회사 성요셉목수학교. 내일배움카드(국민내일배움카드) 국비지원 과정 운영.
        </span>
      </div>
    </footer>
  );
}
