"use client";

// about.jsx 의 AboutTabs — 탭 전환 로직이 필요하므로 'use client'.
// 참조: HANDOFF/ui_kits/website/about.jsx

import { useState } from "react";
import { Users, Award, CheckCircle } from "@/components/icons";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { LocationInfo } from "@/components/sections/LocationInfo";

// ── 학원소개 ──────────────────────────────────────────────────────────────────

function AboutIntro() {
  const points = [
    {
      icon: <Users size={20} />,
      t: "소수 정원 실습",
      d: "과정당 12–16명, 1인 1작업대로 손에 익을 때까지",
    },
    {
      icon: <Award size={20} />,
      t: "현장 경력 강사진",
      d: "건축목공·가구제작 현장 경력 평균 18년",
    },
    {
      icon: <CheckCircle size={20} />,
      t: "수료 후 연계",
      d: "자격 취득·취업 알선·공방 창업까지 이어서 지원",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 64 }}>
      <div className="grid g-2" style={{ alignItems: "center", gap: 40 }}>
        <PhotoSlot ratio="4 / 3" label="학원 전경 · 실습장" radius={18} />
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(24px, 2.8vw, 32px)",
              fontWeight: 700,
              color: "var(--color-ink)",
              lineHeight: 1.35,
              letterSpacing: "-0.6px",
              margin: 0,
              wordBreak: "keep-all",
            }}
          >
            손으로 배우고,
            <br />
            기술로 다시 서는 곳
          </h2>
          <p
            style={{
              fontSize: 16.5,
              color: "var(--color-body)",
              lineHeight: 1.8,
              margin: 0,
              wordBreak: "keep-all",
            }}
          >
            성요셉목수학교는 고용노동부 지정 직업능력개발 훈련기관입니다.
            목공 기초부터 집수리·인테리어, 가구 제작, 자격 대비까지 —
            나이와 경력에 관계없이 누구나 기술 하나로 다시 시작할 수 있도록
            처음부터 끝까지 손에 익을 때까지 가르칩니다.
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
                  style={{ display: "flex", flexDirection: "column", gap: 2 }}
                >
                  <span
                    style={{
                      fontSize: 15.5,
                      fontWeight: 700,
                      color: "var(--color-ink)",
                    }}
                  >
                    {p.t}
                  </span>
                  <span
                    style={{
                      fontSize: 14.5,
                      color: "var(--color-muted)",
                      lineHeight: 1.6,
                      wordBreak: "keep-all",
                    }}
                  >
                    {p.d}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <SectionHeading align="center" title={<>학원 둘러보기</>} />
        <div className="grid g-3" style={{ marginTop: 28 }}>
          <PhotoSlot ratio="4 / 3" label="목공 실습장" />
          <PhotoSlot ratio="4 / 3" label="강의실" />
          <PhotoSlot ratio="4 / 3" label="수강생 작품" />
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

function AboutHistory() {
  const eras = [
    {
      era: "2024 — 현재",
      items: [
        { y: "2026", e: "집수리·인테리어반 신설, 연 5개 과정 운영" },
        { y: "2025", e: "누적 수료생 1,200명 달성" },
        { y: "2024", e: "고용노동부 우수훈련기관 지정" },
      ],
    },
    {
      era: "2020 — 2023",
      items: [
        { y: "2023", e: "경기도지사 표창 수상 · 이수자평가 A등급" },
        { y: "2022", e: "실습동 확장 이전 (1인 1작업대 체제)" },
        { y: "2020", e: "건축목공 자격대비반 개설" },
      ],
    },
    {
      era: "2015 — 2019",
      items: [
        { y: "2018", e: "국민내일배움카드 국비지원 과정 승인" },
        { y: "2015", e: "성요셉목수학교 설립 · 목공 기초반 첫 개강" },
      ],
    },
  ];

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 40,
      }}
    >
      {eras.map((g, gi) => (
        <div key={gi}>
          <span
            style={{
              display: "inline-block",
              fontSize: 13.5,
              fontWeight: 800,
              letterSpacing: "0.6px",
              color: "var(--color-primary)",
              background: "var(--color-primary-soft)",
              border: "1px solid var(--color-primary-border)",
              padding: "6px 14px",
              borderRadius: 9999,
              marginBottom: 18,
            }}
          >
            {g.era}
          </span>
          <div
            style={{
              borderLeft: "2px solid var(--color-hairline)",
              marginLeft: 9,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {g.items.map((it, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 18,
                  padding: "12px 0 12px 22px",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: -6,
                    top: 19,
                    width: 10,
                    height: 10,
                    borderRadius: 9999,
                    background: "var(--color-surface-card)",
                    border: "2px solid var(--color-primary)",
                  }}
                />
                <span
                  style={{
                    flex: "0 0 auto",
                    fontSize: 15,
                    fontWeight: 800,
                    color: "var(--color-ink)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {it.y}
                </span>
                <span
                  style={{
                    fontSize: 15.5,
                    color: "var(--color-body)",
                    lineHeight: 1.6,
                    wordBreak: "keep-all",
                  }}
                >
                  {it.e}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 탭 래퍼 ──────────────────────────────────────────────────────────────────

export function AboutClient() {
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
      {tab === 0 ? <AboutIntro /> : <AboutHistory />}
    </section>
  );
}
