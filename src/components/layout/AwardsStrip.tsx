// Server component — SNS social links + awards horizontal strip.

import { Award } from "@/components/icons";

const SNS_LINKS = [
  {
    name: "유튜브",
    href: "https://www.youtube.com",
    bg: "#FF0000",
    node: (
      <span
        style={{
          width: 0,
          height: 0,
          marginLeft: 2,
          borderTop: "5.5px solid transparent",
          borderBottom: "5.5px solid transparent",
          borderLeft: "9px solid #fff",
        }}
      />
    ),
  },
  {
    name: "네이버 블로그",
    href: "https://blog.naver.com",
    bg: "#03C75A",
    node: (
      <span
        style={{
          color: "#fff",
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "-0.3px",
          fontFamily: "var(--font-sans)",
        }}
      >
        blog
      </span>
    ),
  },
  {
    name: "인스타그램",
    href: "https://www.instagram.com",
    bg: "radial-gradient(circle at 30% 110%, #fdf497 0%, #fd5949 45%, #d6249f 60%, #285AEB 90%)",
    node: (
      <svg
        viewBox="0 0 24 24"
        width="17"
        height="17"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.3" cy="6.7" r="1.1" fill="#fff" stroke="none" />
      </svg>
    ),
  },
];

const AWARDS = [
  { year: "2022", label: "고용노동부 우수훈련기관" },
  { year: "2023", label: "경기도일자리재단 우수훈련기관" },
  { year: "2023", label: "경기도지사표창 훈련기관" },
  { year: "2024", label: "이수자평가 A등급" },
  { year: "2025", label: "고용노동부 3년인증 · 이수자평가 A등급" },
];

function SocialLinks({ size = 38 }: { size?: number }) {
  return (
    <div className="flex items-center gap-[10px]">
      {SNS_LINKS.map((s) => (
        <a
          key={s.name}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.name}
          title={s.name}
          className="grid place-items-center rounded-[10px] no-underline"
          style={{
            width: size,
            height: size,
            background: s.bg,
            boxShadow: "0 2px 6px rgba(26,26,24,0.12)",
          }}
        >
          {s.node}
        </a>
      ))}
    </div>
  );
}

export function AwardsStrip() {
  return (
    <section
      data-screen-label="수상 이력 스트립"
      className="bg-surface-card border-b border-hairline"
    >
      <div className="wrap awards-strip">
        {/* SNS + divider */}
        <div className="flex items-center gap-3 flex-[0_0_auto]">
          <SocialLinks size={36} />
          <span className="awards-divider" />
        </div>

        {/* Awards list */}
        <div className="awards-list">
          {AWARDS.map((a, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-[7px] whitespace-nowrap"
            >
              <span className="inline-flex items-center text-primary">
                <Award size={16} strokeWidth={2.2} />
              </span>
              <span className="text-[14px] font-extrabold text-ink tabular-nums">
                {a.year}
              </span>
              <span className="text-[14px] font-semibold text-body">{a.label}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
