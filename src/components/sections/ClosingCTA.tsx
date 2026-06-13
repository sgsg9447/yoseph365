"use client";

import { Phone } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { useConsult } from "@/components/layout/SiteShell";

const PHONE = "031-123-4567";

export function ClosingCTA() {
  const { openConsult } = useConsult();

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "var(--color-primary-soft)",
        borderTop: "1px solid var(--color-primary-border)",
      }}
    >
      <div
        className="orb"
        style={{
          width: 480,
          height: 480,
          bottom: -240,
          left: "18%",
          background: "var(--color-gradient-sky)",
          opacity: 0.5,
        }}
      />
      <div
        className="orb"
        style={{
          width: 360,
          height: 360,
          top: -160,
          right: "8%",
          background: "var(--color-gradient-lavender)",
          opacity: 0.4,
        }}
      />
      <div className="wrap band-lg relative z-[1] text-center">
        <p className="text-[15px] font-bold text-primary tracking-[0.3px] mb-4">
          마지막으로
        </p>
        <h2
          className="font-display font-bold text-ink leading-[1.35] tracking-[-0.6px] mx-auto mb-4 break-keep max-w-[640px] text-[clamp(26px,3.6vw,38px)]"
        >
          내일배움카드가 있다면 수강료 0원
        </h2>
        <p className="text-[18px] text-body leading-[1.7] mx-auto mb-[30px] break-keep max-w-[520px]">
          자격 확인부터 과정 안내까지, 전화 한 통이면 됩니다.
        </p>
        <div className="flex justify-center mb-[18px]">
          <Button
            variant="primary"
            size="lg"
            leftIcon={<Phone size={20} strokeWidth={2.2} />}
            onClick={() => openConsult("consult")}
          >
            전화로 무료 상담
          </Button>
        </div>
        <a
          href={`tel:${PHONE}`}
          className="text-[24px] font-bold text-primary tracking-[-0.3px] no-underline"
        >
          {PHONE}
        </a>
        <p className="text-[13px] text-muted mt-2">
          평일 09:00 – 18:00 · 점심 12:00 – 13:00
        </p>
      </div>
    </section>
  );
}
