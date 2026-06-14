// 국비훈련생 등록 절차 4단계 — 훅 없는 프레젠테이션 컴포넌트.

import { SectionHeading } from "@/components/ui/SectionHeading";
import { Phone, Clipboard, Wallet, Award } from "@/components/icons";

export function EnrollSteps() {
  const steps = [
    { icon: <Phone size={24} />, t: "훈련기관 등록", d: "훈련기관에 전화로 등록 가능 여부 확인" },
    { icon: <Clipboard size={24} />, t: "고용24 수강신청", d: "고용24 홈페이지에서 훈련 수강 등록" },
    { icon: <Wallet size={24} />, t: "훈련기관 결제", d: "훈련기관 최종 등록 및 결제" },
    { icon: <Award size={24} />, t: "훈련생 최종선발", d: "훈련생 최종 선발 후 개강일 안내" },
  ];

  return (
    <section
      style={{
        background: "var(--color-canvas-soft)",
        borderTop: "1px solid var(--color-hairline)",
      }}
    >
      <div className="wrap band">
        <SectionHeading
          align="center"
          eyebrow="등록 절차"
          title="국비훈련생 등록 절차"
          sub="아래 4단계를 따라 등록해 주세요. 어려우면 전화 주시면 처음부터 끝까지 도와드립니다."
        />
        <div className="steps" style={{ marginTop: 40 }}>
          {steps.map((s, idx) => {
            const isLast = idx === steps.length - 1;
            return (
              <div key={idx} className="step">
                <div className="step-top">
                  <span
                    style={{
                      width: 46,
                      height: 46,
                      flex: "0 0 auto",
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 9999,
                      background: isLast ? "var(--color-primary)" : "var(--color-surface-card)",
                      border:
                        "1px solid " +
                        (isLast ? "var(--color-primary)" : "var(--color-hairline-strong)"),
                      color: isLast ? "#fff" : "var(--color-body-strong)",
                    }}
                  >
                    {s.icon}
                  </span>
                  {!isLast && <span className="step-line" />}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <span
                    style={{
                      fontSize: 16.5,
                      fontWeight: 700,
                      color: "var(--color-ink)",
                      letterSpacing: "-0.2px",
                    }}
                  >
                    {"0" + (idx + 1) + ". " + s.t}
                  </span>
                  <span
                    style={{
                      fontSize: 14.5,
                      color: "var(--color-muted)",
                      lineHeight: 1.55,
                      wordBreak: "keep-all",
                      paddingRight: 14,
                    }}
                  >
                    {s.d}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
