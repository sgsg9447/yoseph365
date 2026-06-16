// Server component — training photos grid + award highlights ink panel.
// Note: handoff uses --color-gradient-amber (not in our tokens) → replaced with
// arbitrary value #e8956a (the handoff's gradient fallback / peach-amber).

import Link from "next/link";
import Image from "next/image";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PhotoSlot } from "@/components/ui/PhotoSlot";

interface AwardHighlightProps {
  lines: string[];
  sub: string;
  img: string;
}

function AwardHighlight({ lines, sub, img }: AwardHighlightProps) {
  return (
    <div
      className="relative flex flex-col items-center text-center gap-3 rounded-lg"
      style={{
        padding: "30px 22px 26px",
        background: "rgba(255,255,255,0.045)",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <span
        className="w-[60px] h-[60px] grid place-items-center rounded-full p-3 box-border"
        style={{
          background:
            "linear-gradient(150deg, #ffffff 0%, #f3f5f8 55%, #e3e8ef 100%)",
          boxShadow:
            "0 6px 18px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.9)",
        }}
      >
        <Image
          src={img}
          alt=""
          width={36}
          height={36}
          className="max-w-full max-h-full object-contain block"
        />
      </span>
      <span
        className="font-display text-[18.5px] font-bold leading-[1.4] tracking-[-0.3px] break-keep flex flex-col"
        style={{ color: "#fff" }}
      >
        {lines.map((ln, i) => (
          <span key={i}>{ln}</span>
        ))}
      </span>
      {/* --color-gradient-amber not in tokens → arbitrary gradient using handoff fallback values */}
      <span
        className="inline-flex items-center text-[13.5px] font-bold tabular-nums tracking-[0.2px] whitespace-nowrap"
        style={{
          background:
            "linear-gradient(90deg, #f0a875 0%, #e8956a 45%, #d97a47 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          color: "transparent",
        }}
      >
        {sub}
      </span>
    </div>
  );
}

const trust: AwardHighlightProps[] = [
  {
    lines: ["고용노동부", "우수훈련기관"],
    sub: "2022 선정 · 2025 3년인증",
    img: "/awards/award-molab.png",
  },
  {
    lines: ["이수자평가", "A등급"],
    sub: "2024 · 2025 연속",
    img: "/awards/award-molab.png",
  },
  {
    lines: ["경기도일자리재단 우수훈련기관", "· 경기도지사 표창"],
    sub: "2023",
    img: "/awards/award-gjf.png",
  },
];

const photos = [
  { src: "/photos/training/training-03.jpg", label: "가벽·아치 목공 실습" },
  { src: "/photos/training/training-09.jpg", label: "욕실 변기 설치 실습" },
  { src: "/photos/training/training-07.jpg", label: "벽타일 시공 실습" },
  { src: "/photos/training/training-08.jpg", label: "바닥재 시공 실습" },
  { src: "/photos/training/training-06.jpg", label: "집수리 설비 실습" },
  { src: "/photos/training/training-02.jpg", label: "무늬목 시공 실습" },
];

export function SocialProof() {
  return (
    <section className="wrap band">
      <SectionHeading
        align="center"
        eyebrow="훈련 현장"
        title={<>현장과 같은 실습 환경</>}
        sub={
          <span className="text-[16px] sm:text-[17px]">
            보여주기식 실습이 아닙니다.{" "}
            <br className="only-mobile" />
            실제와 같은 장비·공정으로,
            <br />
            수료 후 바로 현장에서 일할 수 있게 가르칩니다.
          </span>
        }
      />
      <div className="grid g-3" style={{ margin: "36px 0 12px" }}>
        {photos.map((p, i) => (
          <PhotoSlot key={i} ratio="4 / 3" src={p.src} label={p.label} />
        ))}
      </div>
      <div className="flex justify-center" style={{ margin: "4px 0 34px" }}>
        <Link
          href="/photos"
          className="inline-flex items-center justify-center gap-2 rounded-button font-semibold leading-none tracking-[-0.2px] whitespace-nowrap transition active:scale-[0.98] h-12 px-[22px] text-[17px] bg-transparent text-ink border border-hairline-strong"
        >
          훈련 사진 전체보기
        </Link>
      </div>

      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: 22,
          background: "var(--color-ink)",
          padding: "clamp(28px, 4.5vw, 48px) clamp(20px, 4vw, 48px)",
        }}
      >
        {/* orb: --color-gradient-amber not in tokens → #e8956a arbitrary */}
        <div
          className="orb"
          style={{
            width: 420,
            height: 420,
            top: -210,
            right: "-8%",
            background: "#e8956a",
            opacity: 0.16,
          }}
        />
        <div className="relative z-[1] flex flex-col gap-[26px]">
          <div className="text-center flex flex-col gap-2">
            <span
              className="text-[14px] font-bold tracking-[1.5px]"
              style={{ color: "#e8956a" }}
            >
              공식 인증
            </span>
            <span
              className="font-display font-bold leading-[1.35] tracking-[-0.5px] break-keep text-[clamp(22px,3vw,30px)]"
              style={{ color: "#fff" }}
            >
              4년 연속, 기관이 인정한 훈련기관입니다
            </span>
          </div>
          <div className="grid g-3" style={{ gap: 14 }}>
            {trust.map((t, i) => (
              <AwardHighlight key={i} {...t} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
