"use client";

// 게시판 목록 — 카테고리·검색 필터 + 문의 남기기 CTA
// 참조: HANDOFF/ui_kits/website/inquiry.jsx (InquiryBoard)

import { useState } from "react";
import Link from "next/link";
import { Phone, Lock } from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useConsult } from "@/components/layout/SiteShell";
import type { PublicInquiryListItem } from "@/lib/queries/inquiry";
import { PHONE_MAIN } from "@/lib/data/site";

const CATS = ["전체", "국비지원", "과정 문의", "기타"] as const;

const CAT_MAP: Record<string, string> = { 국비지원: "국비지원", 과정문의: "과정 문의", 기타: "기타" };

export function InquiryBoard({
  posts,
  loadError,
}: {
  posts: PublicInquiryListItem[];
  loadError: boolean;
}) {
  const [cat, setCat] = useState<string>("전체");
  const [q, setQ] = useState("");
  const { openConsult } = useConsult();

  const list = posts.filter(
    (p) =>
      (cat === "전체" || CAT_MAP[p.category] === cat) &&
      (!q || p.title.includes(q)),
  );

  return (
    <section className="wrap band" style={{ paddingTop: 40 }}>
      {/* 전화 스트립 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px 14px",
          padding: "16px 20px",
          background: "var(--color-primary-soft)",
          border: "1px solid var(--color-primary-border)",
          borderRadius: 14,
          marginBottom: 36,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 15,
            fontWeight: 600,
            color: "var(--color-body-strong)",
          }}
        >
          <Phone size={17} strokeWidth={2.2} />
          급하신가요? 전화가 가장 빠릅니다
        </span>
        <a
          href={"tel:" + PHONE_MAIN}
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "var(--color-primary)",
            textDecoration: "none",
            letterSpacing: "-0.2px",
          }}
        >
          {PHONE_MAIN}
        </a>
        <span style={{ fontSize: 13, color: "var(--color-muted)" }}>
          평일 09:00–18:00 · 점심 12:00–13:00
        </span>
      </div>

      {/* 필터 바 */}
      <div className="board-bar">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              style={{
                height: 38,
                padding: "0 16px",
                borderRadius: 9999,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                fontWeight: 600,
                transition: "all .15s",
                background:
                  c === cat
                    ? "var(--color-primary)"
                    : "var(--color-surface-card)",
                color: c === cat ? "#fff" : "var(--color-body-strong)",
                border:
                  "1px solid " +
                  (c === cat
                    ? "var(--color-primary)"
                    : "var(--color-hairline-strong)"),
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <div
          className="board-search"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            height: 46,
            padding: "0 16px",
            border: "1px solid var(--color-hairline-strong)",
            borderRadius: 12,
            background: "var(--color-surface-card)",
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="검색어를 입력하세요"
            style={{
              border: "none",
              outline: "none",
              flex: 1,
              minWidth: 0,
              fontSize: 15,
              fontFamily: "var(--font-sans)",
              color: "var(--color-ink)",
              background: "transparent",
            }}
          />
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-muted)"
            strokeWidth="2.1"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
      </div>

      {/* 게시판 */}
      <div style={{ borderTop: "2px solid var(--color-ink)" }}>
        <div className="board-row board-head">
          <span
            style={{ fontSize: 14, fontWeight: 700, color: "var(--color-body-strong)" }}
          >
            제목
          </span>
          <span
            style={{ fontSize: 14, fontWeight: 700, color: "var(--color-body-strong)" }}
          >
            구분
          </span>
          <span
            style={{ fontSize: 14, fontWeight: 700, color: "var(--color-body-strong)" }}
          >
            작성일
          </span>
        </div>

        {loadError ? (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <p style={{ fontSize: 15, color: "var(--color-muted)", margin: "0 0 12px" }}>
              목록을 불러오지 못했습니다.
            </p>
            <a href={"tel:" + PHONE_MAIN} style={{ color: "var(--color-primary)", fontWeight: 700 }}>
              전화 문의 {PHONE_MAIN}
            </a>
          </div>
        ) : list.length === 0 ? (
          <p style={{ padding: "40px 0", textAlign: "center", fontSize: 15, color: "var(--color-muted)", margin: 0 }}>
            {posts.length === 0 ? "아직 등록된 문의가 없습니다. 첫 문의를 남겨보세요." : "검색 결과가 없습니다."}
          </p>
        ) : null}

        {!loadError && list.map((p) => (
          <Link
            key={p.id}
            href={`/inquiry/${p.id}`}
            className="board-row board-link"
            style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                minWidth: 0,
              }}
            >
              <Badge
                tone={p.status === "답변완료" ? "success" : "neutral"}
                className="flex-shrink-0"
              >
                {p.status}
              </Badge>
              {p.isSecret && (
                <Lock size={14} strokeWidth={2.2} className="flex-shrink-0 text-muted" aria-label="비밀글" />
              )}
              <span
                className="board-title"
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--color-ink)",
                  lineHeight: 1.45,
                  wordBreak: "keep-all",
                }}
              >
                {p.title}
              </span>
            </span>
            <span
              className="board-cat"
              style={{ fontSize: 14, color: "var(--color-muted)" }}
            >
              {CAT_MAP[p.category] ?? p.category}
            </span>
            <span
              style={{
                fontSize: 14,
                color: "var(--color-muted)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {p.createdAt.slice(0, 10)}
            </span>
          </Link>
        ))}
      </div>

      {/* 문의 남기기 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px 16px",
          marginTop: 32,
        }}
      >
        <Button variant="primary" size="lg" onClick={() => openConsult("inquiry")}>
          문의 남기기
        </Button>
      </div>
    </section>
  );
}
