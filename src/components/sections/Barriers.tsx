"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Wallet, Clipboard, Phone } from "@/components/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useConsult } from "@/components/layout/SiteShell";

const benefits = [
  {
    icon: <CheckCircle size={22} />,
    title: "국비지원 자격 확인",
    desc: "내일배움카드 대상인지 전화로 바로 확인해 드립니다.",
  },
  {
    icon: <Wallet size={22} />,
    title: "국비지원 수강료",
    desc: "내일배움카드로 수강료를 국비 지원받고, 자비부담금만 납부합니다.",
  },
  {
    icon: <Clipboard size={22} />,
    title: "신청 절차 4단계",
    desc: "복잡한 서류 없이 4단계로 간단하게 신청합니다.",
  },
  {
    icon: <Phone size={22} />,
    title: "전화로 1:1 무료 상담",
    desc: "궁금한 점은 전화 한 통으로 바로 해결합니다.",
  },
];

const steps = [
  { n: 1, t: "자격 확인", d: "국비지원 대상 여부를 전화로 확인" },
  { n: 2, t: "과정 선택", d: "목적에 맞는 과정과 개강일 결정" },
  { n: 3, t: "수강 신청", d: "내일배움카드로 수강 등록" },
  { n: 4, t: "교육 시작", d: "개강일에 맞춰 수업 시작" },
];

export function Barriers() {
  const { openConsult } = useConsult();
  // 신청 절차: 시간에 따라 활성 단계가 이동(다른 단계는 옅게)
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive((p) => (p + 1) % steps.length), 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      style={{
        background: "linear-gradient(180deg, var(--color-canvas-soft) 0%, var(--color-primary-soft) 100%)",
        borderTop: "1px solid var(--color-hairline)",
        borderBottom: "1px solid var(--color-hairline)",
      }}
    >
      <div className="wrap band">
        <SectionHeading
          align="center"
          eyebrow="시작은 쉽게"
          title={<>시작은 쉽게, 부담은 가볍게</>}
          sub="내일배움카드로 수강료를 국비 지원받습니다. 복잡한 절차 없이 전화 한 통이면 됩니다."
        />
        <div className="grid g-4" style={{ margin: "48px 0 56px", rowGap: 32 }}>
          {benefits.map((b, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center gap-3 px-[10px]"
            >
              <span
                className="w-[54px] h-[54px] grid place-items-center rounded-full text-body-strong"
                style={{
                  background: "var(--color-surface-card)",
                  border: "1px solid var(--color-hairline)",
                  boxShadow: "0 2px 8px rgba(26,26,24,0.05)",
                }}
              >
                {b.icon}
              </span>
              <span className="text-[17px] font-bold text-ink tracking-[-0.3px] leading-[1.3] break-keep">
                {b.title}
              </span>
              <span
                className="text-[14.5px] text-muted leading-[1.6] break-keep max-w-[220px]"
                style={{ textWrap: "balance" } as React.CSSProperties}
              >
                {b.desc}
              </span>
            </div>
          ))}
        </div>

        <Card padding={0} style={{ overflow: "hidden" }}>
          <div
            className="flex flex-col gap-6"
            style={{
              padding: "clamp(28px, 4vw, 40px) clamp(20px, 3.5vw, 40px) 0",
            }}
          >
            <span className="text-[20px] font-bold text-ink text-center tracking-[-0.3px]">
              신청 절차 4단계
            </span>
            <div className="steps">
              {steps.map((s, idx) => {
                const on = idx === active;
                return (
                  <div
                    key={s.n}
                    className="step"
                    style={{
                      opacity: on ? 1 : 0.42,
                      transition: "opacity .45s ease",
                    }}
                  >
                    <div className="step-top">
                      <span
                        className="w-[34px] h-[34px] flex-[0_0_auto] grid place-items-center rounded-full text-[15px] font-[800] leading-none relative z-[1]"
                        style={{
                          background: on
                            ? "linear-gradient(135deg, var(--color-primary), #1b46c2)"
                            : "var(--color-primary-softer)",
                          color: on ? "#fff" : "var(--color-primary)",
                          boxShadow: on ? "0 6px 16px rgba(37,99,235,0.35)" : "none",
                          transform: on ? "scale(1.12)" : "scale(1)",
                          transition: "transform .45s ease, box-shadow .45s ease, background .45s ease",
                        }}
                      >
                        {s.n}
                      </span>
                    </div>
                    <div className="step-text">
                      <span className="text-[17px] font-bold text-ink tracking-[-0.2px] whitespace-nowrap">
                        {s.t}
                      </span>
                      <span className="text-[14.5px] text-muted leading-[1.55] break-keep">
                        {s.d}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div
            className="mt-7 flex justify-center"
            style={{
              padding: "24px clamp(20px, 3.5vw, 40px)",
              borderTop: "1px solid var(--color-hairline-soft)",
              background: "var(--color-canvas-soft)",
            }}
          >
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Phone size={19} strokeWidth={2.2} />}
              onClick={() => openConsult("consult")}
            >
              지금 자격 확인하기
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
