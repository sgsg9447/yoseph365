"use client";

// about.jsx 의 AboutTabs — 탭 전환 로직이 필요하므로 'use client'.
// 참조: HANDOFF/ui_kits/website/about.jsx

import { useState } from "react";
import { Award, CheckCircle, Hammer } from "@/components/icons";
import { PhotoCarousel, type CarouselSlide } from "@/components/ui/PhotoCarousel";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { LocationInfo } from "@/components/sections/LocationInfo";
import type { AboutHistoryView, SiteSectionView } from "@/lib/queries/types";

// ── 학원소개 ──────────────────────────────────────────────────────────────────

const INTRO_SLIDES: CarouselSlide[] = [
  { src: "/photos/introduction/classroom-1.jpg", label: "강의실" },
  { src: "/photos/introduction/classroom-2.jpg", label: "강의실" },
  { src: "/photos/introduction/woodwork-lab-1.jpg", label: "인테리어 목공 실습실" },
  { src: "/photos/introduction/woodwork-lab-2.jpg", label: "인테리어 목공 실습실" },
  { src: "/photos/introduction/woodwork-lab-3.jpg", label: "인테리어 목공 실습실" },
  { src: "/photos/introduction/woodwork-lab-4.jpg", label: "인테리어 목공 실습실" },
  { src: "/photos/introduction/woodwork-lab-5.jpg", label: "인테리어 목공 실습실" },
  { src: "/photos/introduction/film-lab-1.jpg", label: "인테리어 필름 실습실" },
  { src: "/photos/introduction/film-lab-2.jpg", label: "인테리어 필름 실습실" },
  { src: "/photos/introduction/film-lab-3.jpg", label: "인테리어 필름 실습실" },
  { src: "/photos/introduction/film-lab-4.jpg", label: "인테리어 필름 실습실" },
  { src: "/photos/introduction/film-lab-5.jpg", label: "인테리어 필름 실습실" },
];

const HISTORY_INTRO_MOBILE_LINES = [
  "다양한 공식인증을 받은 체계적인 교육기관에서",
  "전문적인 훈련을 통해 실무 역량을 키우고",
  "성공적인 미래를 준비하세요.",
  "변화하는 시대에 맞춘 최신 커리큘럼으로,",
  "자신만의 경쟁력을 높일 수 있습니다.",
];

function AboutIntro() {
  const points = [
    {
      icon: <CheckCircle size={20} />,
      text: "국가직무 능력교육 NCS기반의 훈련과정",
    },
    {
      icon: <Hammer size={20} />,
      text: "현장실습 위주 훈련진행",
    },
    {
      icon: <Award size={20} />,
      text: "40년 경력의 원장 직강 및 다수의 현장전문가 강사진 확보.",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 64 }}>
      <div className="grid g-2" style={{ alignItems: "center", gap: 40, minWidth: 0 }}>
        <PhotoCarousel slides={INTRO_SLIDES} ratio="4 / 3" radius={18} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            minWidth: 0,
            maxWidth: "100%",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(18px, 5.1vw, 32px)",
              fontWeight: 700,
              color: "var(--color-ink)",
              lineHeight: 1.35,
              letterSpacing: "-0.6px",
              margin: 0,
              wordBreak: "normal",
              overflowWrap: "anywhere",
            }}
          >
            손으로 배우고, 기술로 다시 서는 곳
          </h2>
          <p
            style={{
              fontSize: 16.5,
              color: "var(--color-body)",
              lineHeight: 1.8,
              margin: 0,
              wordBreak: "normal",
              overflowWrap: "anywhere",
            }}
          >
            <span style={{ display: "block", wordBreak: "break-all", overflowWrap: "anywhere" }}>
              NCS교육방식을 도입함으로써,
            </span>
            <span style={{ display: "block", wordBreak: "break-all", overflowWrap: "anywhere" }}>
              체계적인 교육과 더불어 현장전문가의 심도 깊은 직업훈련교육으로
            </span>
            <span style={{ display: "block", wordBreak: "break-all", overflowWrap: "anywhere" }}>
              현장과의 격차를 줄여, 현장투입이 가능한 목공기능, 필름기능인 양성을
              목표로 합니다.
            </span>
          </p>
          <div
            style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 6 }}
          >
            {points.map((p, i) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
              >
                <span
                  style={{
                    flex: "0 0 auto",
                    width: 38,
                    height: 38,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 9999,
                    background: "var(--color-primary-soft)",
                    color: "var(--color-primary)",
                  }}
                >
                  {p.icon}
                </span>
                <span
                  style={{
                    fontSize: 15.5,
                    color: "var(--color-body-strong)",
                    lineHeight: 1.6,
                    wordBreak: "keep-all",
                    alignSelf: "center",
                  }}
                >
                  {p.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <SectionHeading
          align="center"
          title={<>오시는 길</>}
          sub="방문 상담은 전화 예약 후 와주시면 기다림 없이 안내받으실 수 있습니다."
        />
        <div style={{ marginTop: 28 }}>
          <LocationInfo />
        </div>
      </div>
    </div>
  );
}

// ── 훈련기관 연혁 ─────────────────────────────────────────────────────────────

function AboutHistory({
  intro,
  histories,
}: {
  intro: SiteSectionView | null;
  histories: AboutHistoryView[];
}) {
  if (histories.length === 0) {
    return (
      <p
        style={{
          textAlign: "center",
          fontSize: 15.5,
          color: "var(--color-muted)",
          lineHeight: 1.7,
        }}
      >
        연혁 정보를 준비 중입니다.
      </p>
    );
  }

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 36,
      }}
    >
      {intro && (
        <div
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {intro.title && (
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(22px, 2.6vw, 28px)",
                fontWeight: 700,
                color: "var(--color-ink)",
                letterSpacing: "-0.5px",
                margin: 0,
              }}
            >
              {intro.title}
            </h2>
          )}
          {intro.body.length > 0 && (
            <p
              style={{
                fontSize: 15.5,
                color: "var(--color-body)",
                lineHeight: 1.8,
                margin: 0,
                wordBreak: "keep-all",
              }}
            >
              <span className="hidden sm:block">
                {intro.body.map((line, i) => (
                  <span key={i} style={{ display: "block" }}>
                    {line}
                  </span>
                ))}
              </span>
              <span className="block sm:hidden">
                {HISTORY_INTRO_MOBILE_LINES.map((line, i) => (
                  <span key={i} style={{ display: "block" }}>
                    {line}
                  </span>
                ))}
              </span>
            </p>
          )}
        </div>
      )}

      <div
        style={{
          borderLeft: "2px solid var(--color-hairline)",
          marginLeft: 9,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {histories.map((h) => (
          <div
            key={h.year}
            style={{
              padding: "14px 0 14px 24px",
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: -6,
                top: 20,
                width: 10,
                height: 10,
                borderRadius: 9999,
                background: "var(--color-surface-card)",
                border: "2px solid var(--color-primary)",
              }}
            />
            <span
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "var(--color-ink)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {h.year}
            </span>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 5,
                marginTop: 7,
              }}
            >
              {h.items.map((it, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 15,
                    lineHeight: 1.6,
                    wordBreak: "keep-all",
                    color: it.isHighlighted ? "var(--color-primary)" : "var(--color-body)",
                    fontWeight: it.isHighlighted ? 700 : 500,
                  }}
                >
                  {it.content}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 탭 래퍼 ──────────────────────────────────────────────────────────────────

export function AboutClient({
  intro,
  histories,
}: {
  intro: SiteSectionView | null;
  histories: AboutHistoryView[];
}) {
  const tabs = ["학원소개", "훈련기관 연혁"];
  const [tab, setTab] = useState(0);

  return (
    <section className="wrap band" style={{ paddingTop: 36 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          marginBottom: 44,
        }}
      >
        {tabs.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            style={{
              height: 44,
              padding: "0 24px",
              borderRadius: 9999,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              fontSize: 15.5,
              fontWeight: 600,
              transition: "all .15s",
              background:
                i === tab ? "var(--color-ink)" : "var(--color-surface-card)",
              color: i === tab ? "#fff" : "var(--color-body-strong)",
              border:
                "1px solid " +
                (i === tab
                  ? "var(--color-ink)"
                  : "var(--color-hairline-strong)"),
            }}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 0 ? <AboutIntro /> : <AboutHistory intro={intro} histories={histories} />}
    </section>
  );
}
