// Server component — footer with business info and awards.

import { Logo } from "./Logo";
import { AWARDS } from "@/lib/data/awards";
import { BUSINESS_INFO_ROWS, CONSULT_HOURS } from "@/lib/data/site";

const rows = BUSINESS_INFO_ROWS;

export function Footer() {
  return (
    <footer
      className="bg-canvas text-muted border-t border-hairline"
      style={{ paddingBottom: 90 }}
    >
      {/* Business info grid */}
      <div className="wrap band footer-grid" style={{ paddingBottom: 26 }}>
        <Logo className="footer-logo w-auto" />
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
            상담시간 — {CONSULT_HOURS}
          </span>
        </div>
      </div>

      {/* Awards + copyright */}
      <div
        className="wrap flex flex-col gap-[14px] pt-[22px] border-t border-hairline"
      >
        <div className="awards-list">
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
