"use client";

// 참조: HANDOFF/ui_kits/website/funding.jsx 전체
// 탭 전환 로직이 필요하므로 'use client'.

import { useState, useEffect } from "react";
import { Phone } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useConsult } from "@/components/layout/SiteShell";

// ── 탭 메타 ──────────────────────────────────────────────────────────────────

const FUNDING_TABS = [
  { id: "nbcard", label: "국민내일배움카드 안내" },
  { id: "process", label: "훈련참여절차" },
  { id: "sanjae", label: "산재노동자 직업훈련" },
] as const;

type TabId = (typeof FUNDING_TABS)[number]["id"];

// ── 공용 빌딩블록 ─────────────────────────────────────────────────────────────

interface FundCardProps {
  title: string;
  children: React.ReactNode;
  foot?: React.ReactNode;
}

function NoteText({ text, mobileLines }: { text: string; mobileLines?: string[] }) {
  return (
    <span
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        columnGap: 4,
        alignItems: "start",
      }}
    >
      <span aria-hidden="true">※</span>
      <span>
        {mobileLines ? (
          <>
            <span className="hidden sm:inline">{text}</span>
            <span className="block sm:hidden">
              {mobileLines.map((line, i) => (
                <span key={i} style={{ display: "block" }}>
                  {line}
                </span>
              ))}
            </span>
          </>
        ) : (
          text
        )}
      </span>
    </span>
  );
}

function FundCard({ title, children, foot }: FundCardProps) {
  return (
    <Card padding={0} style={{ overflow: "hidden" }}>
      <div
        style={{
          padding: "14px 20px",
          background: "var(--color-canvas-soft)",
          borderBottom: "1px solid var(--color-hairline)",
          fontSize: 16,
          fontWeight: 700,
          color: "var(--color-ink)",
          letterSpacing: "-0.2px",
        }}
      >
        {title}
      </div>
      <div style={{ padding: "8px 20px" }}>{children}</div>
      {foot && (
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--color-hairline-soft)",
            background: "var(--color-canvas-soft)",
            fontSize: 13.5,
            color: "var(--color-muted)",
            lineHeight: 1.6,
            wordBreak: "keep-all",
          }}
        >
          {foot}
        </div>
      )}
    </Card>
  );
}

interface FundRowProps {
  label: React.ReactNode;
  value: string;
  last?: boolean;
}
function FundRow({ label, value, last }: FundRowProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 16,
        padding: "14px 0",
        borderBottom: last ? "none" : "1px solid var(--color-hairline)",
      }}
    >
      <span
        style={{
          fontSize: 15,
          color: "var(--color-body)",
          lineHeight: 1.55,
          wordBreak: "keep-all",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "var(--color-primary)",
          whiteSpace: "nowrap",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </div>
  );
}

interface NumRowProps {
  n: number;
  children: React.ReactNode;
  last?: boolean;
  tail?: string;
}
function NumRow({ n, children, last, tail }: NumRowProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "13px 0",
        borderBottom: last ? "none" : "1px solid var(--color-hairline)",
      }}
    >
      <span
        style={{
          width: 24,
          height: 24,
          flex: "0 0 auto",
          display: "grid",
          placeItems: "center",
          borderRadius: 9999,
          background: "var(--color-primary-softer)",
          color: "var(--color-primary)",
          fontSize: 12.5,
          fontWeight: 800,
          marginTop: 1,
        }}
      >
        {n}
      </span>
      <span
        style={{
          fontSize: 15,
          color: "var(--color-body)",
          lineHeight: 1.6,
          wordBreak: "keep-all",
        }}
      >
        {children}
        {tail && (
          <b style={{ color: "var(--color-ink)", whiteSpace: "nowrap" }}>
            {" "}
            {tail}
          </b>
        )}
      </span>
    </div>
  );
}

interface DotListProps {
  items: React.ReactNode[];
}
function DotList({ items }: DotListProps) {
  return (
    <ul
      style={{
        margin: 0,
        padding: "6px 0 6px 2px",
        listStyle: "none",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {items.map((it, i) => (
        <li
          key={i}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "9px 0",
            borderBottom:
              i === items.length - 1
                ? "none"
                : "1px solid var(--color-hairline-soft)",
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              flex: "0 0 auto",
              borderRadius: 9999,
              background: "var(--color-primary)",
              marginTop: 9,
            }}
          />
          <span
            style={{
              fontSize: 15,
              color: "var(--color-body)",
              lineHeight: 1.65,
              wordBreak: "keep-all",
            }}
          >
            {it}
          </span>
        </li>
      ))}
    </ul>
  );
}

const ORG_TINTS: Record<string, { bg: string; fg: string }> = {
  고용센터: { bg: "#ebf2fa", fg: "#3a6294" },
  "HRD-Net": { bg: "#f2edf8", fg: "#6b5b8a" },
  훈련기관: { bg: "#edf6f0", fg: "#3f7d5f" },
  신청인: { bg: "#fbf0e8", fg: "#b06a44" },
  공단: { bg: "#f9eef1", fg: "#a3596e" },
};
function OrgChip({ name }: { name: string }) {
  const t = ORG_TINTS[name] ?? {
    bg: "var(--color-surface-strong)",
    fg: "var(--color-body-strong)",
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 11px",
        borderRadius: 9999,
        background: t.bg,
        color: t.fg,
        fontSize: 13,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {name}
    </span>
  );
}

// ── 탭 1 · 국민내일배움카드 안내 ─────────────────────────────────────────────

function NbCardTab({ onConsult }: { onConsult: () => void }) {
  const rates = [
    { label: "일반 참여자", value: "45~85%" },
    { label: "국민취업지원제도 Ⅰ유형 · Ⅱ유형(특정계층)", value: "80~100%" },
    { label: "국민취업지원제도 Ⅱ유형(청·중장년층)", value: "50~85%" },
    { label: "근로장려금(EITC) 수급자", value: "72.5~92.5%" },
  ];
  return (
    <div
      data-screen-label="국민내일배움카드 안내"
      style={{ display: "flex", flexDirection: "column", gap: 18 }}
    >
      <div
        className="panel"
        style={{
          background: "var(--color-primary-soft)",
          border: "1px solid var(--color-primary-border)",
          textAlign: "center",
        }}
      >
        <div
          className="orb"
          style={{
            width: 360,
            height: 360,
            top: -180,
            right: "-6%",
            background: "var(--color-gradient-mint)",
            opacity: 0.45,
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p
            style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.3px",
              color: "var(--color-primary)",
              margin: "0 0 12px",
            }}
          >
            국민내일배움카드
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(26px, 3.6vw, 36px)",
              fontWeight: 700,
              color: "var(--color-ink)",
              lineHeight: 1.3,
              letterSpacing: "-0.6px",
              margin: "0 0 14px",
              wordBreak: "keep-all",
            }}
          >
            300만원 기본 지원,
            <br />
            최대 500만원까지
          </h2>
          <p
            style={{
              fontSize: 16.5,
              color: "var(--color-body)",
              lineHeight: 1.7,
              margin: "0 auto",
              maxWidth: 520,
              wordBreak: "keep-all",
            }}
          >
            지원 범위 내에서 훈련비의 45~85%가 국비로 지원됩니다.
            <br />
            최소한의 자비부담으로 원하는 훈련에 참여해 보세요.
          </p>
        </div>
      </div>

      <div className="grid g-2" style={{ alignItems: "stretch", gap: 18 }}>
        <FundCard title="훈련비 지원율">
          {rates.map((r, i) => (
            <FundRow key={i} {...r} last={i === rates.length - 1} />
          ))}
        </FundCard>
        <FundCard
          title="추가 지원 대상"
          foot={
            <NoteText text="300만원 계좌를 모두 소진한 경우, 위 대상자에게 100~200만원의 금액을 추가 지원합니다." />
          }
        >
          <NumRow n={1}>
            기간제 · 파견 · 단시간 · 일용근로자로 재직 중인 피보험자
          </NumRow>
          <NumRow n={2}>고용위기지역 및 특별고용지원업종 종사자</NumRow>
          <NumRow n={3} tail="(200만원)">
            졸업예정자, 장애인, 자립준비청년, 한부모가족, 북한이탈주민
          </NumRow>
          <NumRow n={4} tail="(200만원)" last>
            기초생활수급자 및 차상위계층, 아프간 특별기여자
          </NumRow>
        </FundCard>
      </div>

      <Card
        padding={0}
        style={{
          padding: "22px clamp(20px, 3vw, 28px)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px 20px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            minWidth: 220,
            flex: 1,
          }}
        >
          <span
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "var(--color-ink)",
              letterSpacing: "-0.3px",
              wordBreak: "keep-all",
            }}
          >
            내일배움카드가 아직 없으신가요?
          </span>
          <span
            style={{
              fontSize: 14.5,
              color: "var(--color-muted)",
              lineHeight: 1.6,
              wordBreak: "keep-all",
            }}
          >
            자격 확인부터 카드 발급 방법까지 전화로 차근차근 도와드립니다.
          </span>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Phone size={18} strokeWidth={2.2} />}
          onClick={onConsult}
        >
          전화 상담
        </Button>
      </Card>
    </div>
  );
}

// ── 탭 2 · 훈련참여절차 ───────────────────────────────────────────────────────

function ProcessTab() {
  const steps = [
    { t: "훈련 상담", org: "고용센터" },
    { t: "훈련계획서 등록", org: "고용센터" },
    { t: "온라인 수강신청", org: "HRD-Net" },
    { t: "수강신청 접수", org: "훈련기관" },
    { t: "신청내역 검토", org: "훈련기관" },
    { t: "훈련생 등록", org: "훈련기관" },
  ];
  const notes = [
    "140시간 이상 훈련과정은 고용센터를 통한 훈련상담 후 온라인 수강신청이 가능합니다.",
    "자비부담금이 있는 훈련과정은 반드시 훈련기관에 방문하여 자비부담금을 결제해야 최종적으로 훈련생 등록이 가능합니다.",
    "온라인 수강신청 이력은 HRD-Net 「My서비스 > 훈련관리 > 온라인수강신청이력」 메뉴에서 확인할 수 있습니다.",
    "선발된 이후 수강신청 취소는 훈련기관에 문의해 주세요.",
  ];
  const rels = [
    {
      a: "신청인",
      b: "고용센터",
      ab: "상담 및 신청",
      ba: "승인 및 훈련장려금 지급",
    },
    {
      a: "신청인",
      b: "훈련기관",
      ab: "수강신청 및 자부담 결제",
      ba: "훈련 제공",
    },
    { a: "훈련기관", b: "고용센터", ab: "훈련비용 신청", ba: "훈련비용 지원" },
  ];
  return (
    <div
      data-screen-label="훈련참여절차"
      style={{ display: "flex", flexDirection: "column", gap: 18 }}
    >
      <FundCard title="신청대상">
        <DotList
          items={[
            "국민내일배움카드, 실업자내일배움카드, 근로자내일배움카드 소지자",
          ]}
        />
      </FundCard>

      <Card padding={0} style={{ overflow: "hidden" }}>
        <div
          style={{
            padding: "14px 20px",
            background: "var(--color-canvas-soft)",
            borderBottom: "1px solid var(--color-hairline)",
            fontSize: 16,
            fontWeight: 700,
            color: "var(--color-ink)",
            letterSpacing: "-0.2px",
          }}
        >
          신청절차
        </div>
        <div
          className="grid g-3"
          style={{ padding: "18px 20px 20px", gap: 12 }}
        >
          {steps.map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 16px",
                background: "var(--color-canvas-soft)",
                border: "1px solid var(--color-hairline)",
                borderRadius: 12,
              }}
            >
              <span
                style={{
                  width: 30,
                  height: 30,
                  flex: "0 0 auto",
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 9999,
                  background: "var(--color-surface-card)",
                  color: "var(--color-primary)",
                  border: "1px solid var(--color-primary-border)",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                {i + 1}
              </span>
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--color-ink)",
                  letterSpacing: "-0.2px",
                  wordBreak: "keep-all",
                }}
              >
                {s.t}
              </span>
              <OrgChip name={s.org} />
            </div>
          ))}
        </div>
      </Card>

      <FundCard
        title="신청정보"
        foot={
          <NoteText text="학력정보는 통계 목적으로만 활용되며, 훈련기관을 포함한 외부에 제공되지 않습니다." />
        }
      >
        <DotList
          items={[
            <>
              <span className="hidden sm:inline">
                성명, 연락처, 이메일, 고용형태, 지원유형, 지원대상, 자격코드는
                훈련수강을 위한{" "}
                <b style={{ color: "var(--color-ink)" }}>필수 입력 정보</b>
                입니다.
              </span>
              <span className="block sm:hidden">
                <span style={{ display: "block" }}>성명, 연락처, 이메일, 고용형태, 지원유형,</span>
                <span style={{ display: "block" }}>지원대상, 자격코드는 훈련수강을 위한</span>
                <span style={{ display: "block" }}>
                  <b style={{ color: "var(--color-ink)" }}>필수 입력 정보</b>입니다.
                </span>
              </span>
            </>,
            <>
              온라인 수강신청 결과(선발 · 미선발)를 카카오톡 또는
              문자메시지로 받으려면 반드시{" "}
              <b style={{ color: "var(--color-ink)" }}>
                &ldquo;SNS 수신동의 여부&rdquo;를 &ldquo;예&rdquo;로 선택
              </b>
              해 주세요.
            </>,
          ]}
        />
      </FundCard>

      <FundCard title="꼭 확인하세요">
        <DotList items={notes} />
      </FundCard>

      <Card padding={0} style={{ overflow: "hidden" }}>
        <div
          style={{
            padding: "14px 20px",
            background: "var(--color-canvas-soft)",
            borderBottom: "1px solid var(--color-hairline)",
            fontSize: 16,
            fontWeight: 700,
            color: "var(--color-ink)",
            letterSpacing: "-0.2px",
          }}
        >
          지원 구조 한눈에 보기
        </div>
        <div
          className="grid g-3"
          style={{ padding: "18px 20px 8px", gap: 12 }}
        >
          {rels.map((r, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: 12,
                padding: "16px",
                border: "1px solid var(--color-hairline)",
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <OrgChip name={r.a} />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--color-muted-soft)",
                  }}
                >
                  ⇄
                </span>
                <OrgChip name={r.b} />
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 6 }}
              >
                <span
                  style={{
                    fontSize: 14,
                    color: "var(--color-body)",
                    lineHeight: 1.55,
                    wordBreak: "keep-all",
                  }}
                >
                  <b style={{ color: "var(--color-primary)" }}>→</b> {r.ab}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    color: "var(--color-body)",
                    lineHeight: 1.55,
                    wordBreak: "keep-all",
                  }}
                >
                  <b style={{ color: "var(--color-muted)" }}>←</b> {r.ba}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p
          style={{
            margin: 0,
            padding: "10px 20px 18px",
            fontSize: 13.5,
            color: "var(--color-muted)",
            lineHeight: 1.6,
            wordBreak: "keep-all",
          }}
        >
          <NoteText
            text="구체적인 지원절차는 각 지원사업 안내를 참조해 주시기 바랍니다."
            mobileLines={[
              "구체적인 지원절차는 각 지원사업 안내를",
              "참조해 주시기 바랍니다.",
            ]}
          />
        </p>
      </Card>
    </div>
  );
}

// ── 탭 3 · 산재노동자 직업훈련 ────────────────────────────────────────────────

function SanjaeTab({ onConsult }: { onConsult: () => void }) {
  const procSteps = [
    {
      t: "직업훈련 신청",
      who: "산재근로자",
      d: "지사 방문 또는 토탈서비스 이용",
    },
    {
      t: "직업훈련 및 구직계획 상담",
      who: "산재근로자 · 공단",
      d: "지사 방문",
    },
    {
      t: "직업평가 실시",
      who: "산재근로자 · 공단",
      d: "지사 방문 또는 토탈서비스 이용",
    },
    {
      t: "직업훈련기관 결정",
      who: "산재근로자 · 공단",
      d: "해당 훈련기관을 방문하여 상담 실시",
    },
    { t: "직업훈련 승인", who: "공단", d: "승인 후 훈련 수강" },
  ];
  const pay = [
    {
      amount: "최저임금 × 훈련기간 일수",
      cond: "1일 4시간 · 1주 20시간 이상 · 1개월 80시간 이상 이수",
    },
    {
      amount: "최저임금의 50% × 훈련받은 일수",
      cond: "1일 2시간 이상 4시간 미만",
    },
    { amount: "부지급", cond: "1일 2시간 미만" },
  ];

  return (
    <div
      data-screen-label="산재노동자 직업훈련"
      style={{ display: "flex", flexDirection: "column", gap: 18 }}
    >
      <div
        className="panel"
        style={{
          background: "#ebf2fa",
          border: "1px solid var(--color-hairline)",
          textAlign: "center",
        }}
      >
        <div
          className="orb"
          style={{
            width: 320,
            height: 320,
            top: -160,
            left: "-4%",
            background: "var(--color-gradient-sky)",
            opacity: 0.5,
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p
            style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.3px",
              color: "#3a6294",
              margin: "0 0 12px",
            }}
          >
            산재노동자 직업훈련
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(24px, 3.2vw, 32px)",
              fontWeight: 700,
              color: "var(--color-ink)",
              lineHeight: 1.35,
              letterSpacing: "-0.5px",
              margin: "0 0 12px",
              wordBreak: "keep-all",
            }}
          >
            훈련비용과 훈련수당을
            <br />
            함께 지원합니다
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "var(--color-body)",
              lineHeight: 1.7,
              margin: "0 auto",
              maxWidth: 540,
              wordBreak: "keep-all",
            }}
          >
            실업 중인 산재노동자의 재취업을 돕기 위해 훈련비용과 훈련수당을
            지원하는 근로복지공단 사업입니다.
          </p>
        </div>
      </div>

      <div className="grid g-2" style={{ alignItems: "stretch", gap: 18 }}>
        <FundCard
          title="지원대상"
          foot={
            <NoteText text="통원환자의 경우 제1급~제12급에 해당할 것이라는 의학적 소견이 있는 자를 포함합니다." />
          }
        >
          <DotList
            items={[
              <>
                <span style={{ display: "block" }}>
                  장해판정일로부터{" "}
                  <b style={{ color: "var(--color-ink)" }}>1년 이내</b>의 실업 중인,
                </span>
                <span style={{ display: "block" }}>
                  산재{" "}
                  <b style={{ color: "var(--color-ink)" }}>
                    제1급~제12급 장해급여자
                  </b>
                </span>
              </>,
            ]}
          />
        </FundCard>
        <FundCard title="지원횟수">
          <DotList
            items={[
              <>
                총{" "}
                <b style={{ color: "var(--color-ink)" }}>12개월 이내</b>,{" "}
                <b style={{ color: "var(--color-ink)" }}>2회</b> 훈련 지원
              </>,
            ]}
          />
        </FundCard>
      </div>

      <FundCard title="1인당 지원금액">
        <FundRow
          label={<>훈련비 — HRD 승인 훈련과정(구직자 과정)</>}
          value="전액 지원"
        />
        <FundRow
          label={<>훈련수당 — 1일당 최저임금 (30일 기준)</>}
          value="최대 200만원"
          last
        />
      </FundCard>

      <Card padding={0} style={{ overflow: "hidden" }}>
        <div
          style={{
            padding: "14px 20px",
            background: "var(--color-canvas-soft)",
            borderBottom: "1px solid var(--color-hairline)",
            fontSize: 16,
            fontWeight: 700,
            color: "var(--color-ink)",
            letterSpacing: "-0.2px",
          }}
        >
          훈련수당 지급 기준
        </div>
        <div style={{ padding: "8px 20px" }}>
          {pay.map((p, i) => (
            <div
              key={i}
              className="pay-row"
              style={{
                padding: "14px 0",
                borderBottom:
                  i === pay.length - 1
                    ? "none"
                    : "1px solid var(--color-hairline)",
              }}
            >
              <span
                style={{
                  fontSize: 15.5,
                  fontWeight: 700,
                  color: "var(--color-ink)",
                  lineHeight: 1.5,
                  wordBreak: "keep-all",
                }}
              >
                {p.amount}
              </span>
              <span
                style={{
                  fontSize: 14.5,
                  color: "var(--color-muted)",
                  lineHeight: 1.6,
                  wordBreak: "keep-all",
                }}
              >
                {p.cond}
              </span>
            </div>
          ))}
        </div>
        <p
          style={{
            margin: 0,
            padding: "12px 20px 16px",
            borderTop: "1px solid var(--color-hairline-soft)",
            background: "var(--color-canvas-soft)",
            fontSize: 13.5,
            color: "var(--color-muted)",
            lineHeight: 1.6,
            wordBreak: "keep-all",
          }}
        >
          <NoteText text="훈련수당은 일 80% 이상 출석한 경우, 산재노동자에게 지급됩니다." />
        </p>
      </Card>

      <FundCard title="훈련기관 및 훈련직종">
        <DotList
          items={[
            "직업능력개발법에 따른 1년 이상 인증 훈련기관의 승인된 구직자 과정 (원격훈련 포함)",
            "한국폴리텍대학 및 한국장애인고용공단 교육과정",
            "대형 · 특수면허 등 학원 과정",
          ]}
        />
      </FundCard>

      <FundCard title="HRD 전산망 통합 및 내일배움카드 발급">
        <DotList
          items={[
            "산재노동자 직업훈련은 HRD-Net 통합으로 HRD 전산망에서 위탁 훈련생 확인이 가능합니다.",
            "출결 확인을 위해 내일배움카드가 발급됩니다.",
          ]}
        />
      </FundCard>

      <Card padding={0} style={{ overflow: "hidden" }}>
        <div
          style={{
            padding: "14px 20px",
            background: "var(--color-canvas-soft)",
            borderBottom: "1px solid var(--color-hairline)",
            fontSize: 16,
            fontWeight: 700,
            color: "var(--color-ink)",
            letterSpacing: "-0.2px",
          }}
        >
          훈련 절차
        </div>
        <div
          style={{
            padding: "20px 20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {procSteps.map((s, i) => {
            // Parse org chips from "산재근로자 · 공단" style
            const orgs = s.who.split(" · ");
            return (
              <div
                key={i}
                style={{ display: "flex", alignItems: "flex-start", gap: 14 }}
              >
                <span
                  style={{
                    flex: "0 0 auto",
                    width: 32,
                    height: 32,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 9999,
                    background:
                      i === procSteps.length - 1
                        ? "var(--color-primary)"
                        : "var(--color-primary-softer)",
                    color:
                      i === procSteps.length - 1
                        ? "#fff"
                        : "var(--color-primary)",
                    fontSize: 14,
                    fontWeight: 800,
                  }}
                >
                  {i + 1}
                </span>
                <span
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                    paddingTop: 3,
                    minWidth: 0,
                  }}
                >
                  <span className="proc-head">
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "var(--color-ink)",
                        letterSpacing: "-0.2px",
                        wordBreak: "keep-all",
                      }}
                    >
                      {s.t}
                    </span>
                    <span className="proc-head-orgs">
                      {orgs.map((org) => {
                        // Map "산재근로자" → 신청인 chip (closest match in ORG_TINTS)
                        const chipName = org.includes("산재")
                          ? "신청인"
                          : org.trim();
                        return <OrgChip key={org} name={chipName} />;
                      })}
                    </span>
                  </span>
                  <span
                    style={{
                      fontSize: 14.5,
                      color: "var(--color-muted)",
                      lineHeight: 1.55,
                      wordBreak: "keep-all",
                    }}
                  >
                    {s.d}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card
        padding={0}
        style={{
          padding: "22px clamp(20px, 3vw, 28px)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px 20px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            minWidth: 220,
            flex: 1,
          }}
        >
          <span
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "var(--color-ink)",
              letterSpacing: "-0.3px",
              wordBreak: "keep-all",
            }}
          >
            내 상황에 해당하는지 궁금하신가요?
          </span>
          <span
            style={{
              fontSize: "clamp(12px, 3.35vw, 14.5px)",
              color: "var(--color-muted)",
              lineHeight: 1.6,
              whiteSpace: "nowrap",
            }}
          >
            신청 가능 여부와 절차를 전화로 확인해 드립니다.
          </span>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Phone size={18} strokeWidth={2.2} />}
          onClick={onConsult}
        >
          전화 상담
        </Button>
      </Card>
    </div>
  );
}

// ── 탭 바 ─────────────────────────────────────────────────────────────────────

function FundTabs({
  tab,
  onTab,
}: {
  tab: TabId;
  onTab: (id: TabId) => void;
}) {
  return (
    <div className="fund-tabs" role="tablist" aria-label="국비지원 하위 메뉴">
      {FUNDING_TABS.map((t) => {
        const on = t.id === tab;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={on}
            onClick={() => onTab(t.id)}
            style={{
              height: 46,
              padding: "0 20px",
              borderRadius: 9999,
              whiteSpace: "nowrap",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              fontSize: 15,
              fontWeight: on ? 700 : 600,
              flex: "0 0 auto",
              background: on
                ? "var(--color-primary)"
                : "var(--color-surface-card)",
              color: on ? "#fff" : "var(--color-body-strong)",
              border: on
                ? "1px solid var(--color-primary)"
                : "1px solid var(--color-hairline-strong)",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ── 메인 클라이언트 컴포넌트 ─────────────────────────────────────────────────

export function FundingClient({ initialTab }: { initialTab: TabId }) {
  const [tab, setTab] = useState<TabId>(initialTab);
  const { openConsult } = useConsult();

  // Header 드롭다운(/funding#process, #sanjae)으로 진입 시 해당 탭 활성화 + 해시 변경 추적
  useEffect(() => {
    const fromHash = () => {
      const h = (window.location.hash || "").replace("#", "");
      if (FUNDING_TABS.some((t) => t.id === h)) setTab(h as TabId);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);

    // Next.js App Router는 같은 페이지 해시 <Link> 이동을 history.pushState로 처리하는데,
    // pushState는 브라우저 사양상 hashchange를 발생시키지 않는다. 그래서 이미 /funding에 있는
    // 상태에서 헤더 드롭다운으로 /funding#sanjae를 눌러도 탭이 바뀌지 않는다.
    // pushState/replaceState를 감싸 hashchange를 직접 발생시켜 위 리스너가 동작하도록 한다.
    const origPush = window.history.pushState;
    const origReplace = window.history.replaceState;
    const patch =
      (orig: History["pushState"]) =>
      function (this: History, ...args: Parameters<History["pushState"]>) {
        orig.apply(this, args);
        // React 커밋/insertion 단계 안에서 동기적으로 setState가 예약되지 않도록 마이크로태스크로 미룬다.
        queueMicrotask(() => window.dispatchEvent(new Event("hashchange")));
      };
    window.history.pushState = patch(origPush);
    window.history.replaceState = patch(origReplace);

    return () => {
      window.removeEventListener("hashchange", fromHash);
      window.history.pushState = origPush;
      window.history.replaceState = origReplace;
    };
  }, []);

  const onTab = (id: TabId) => {
    setTab(id);
    if (typeof window !== "undefined") {
      history.replaceState(null, "", "#" + id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <section className="wrap" style={{ paddingTop: 26, paddingBottom: 80 }}>
      <FundTabs tab={tab} onTab={onTab} />
      <div style={{ maxWidth: 880, margin: "28px auto 0" }}>
        {tab === "nbcard" && (
          <NbCardTab onConsult={() => openConsult("consult")} />
        )}
        {tab === "process" && <ProcessTab />}
        {tab === "sanjae" && (
          <SanjaeTab onConsult={() => openConsult("consult")} />
        )}
      </div>
    </section>
  );
}
