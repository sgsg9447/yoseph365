// T31 — 상담문의 상세 페이지
// 참조: HANDOFF/ui_kits/website/inquiry-detail.html

import type { Metadata } from "next";
import Link from "next/link";
import { fetchPublicInquiry } from "@/lib/queries/inquiry";
import { SecretReveal } from "./SecretReveal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Message, ChevronRight, Clock } from "@/components/icons";
import { PHONE_MAIN } from "@/lib/data/site";
import { InquiryWriteButton } from "./InquiryWriteButton";

export const dynamic = "force-dynamic";

// Next 16: params is a Promise
interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await fetchPublicInquiry(Number(id)).catch(() => null);
  return {
    title: post
      ? `${post.title} — 상담문의 — 성요셉목수학교`
      : "상담문의 — 성요셉목수학교",
  };
}

const CAT_MAP: Record<string, string> = { 국비지원: "국비지원", 과정문의: "과정 문의", 기타: "기타" };

// ── 본문 단락 분리 ────────────────────────────────────────────────────────────

function Paragraphs({
  text,
  color,
  size,
}: {
  text: string;
  color: string;
  size: number;
}) {
  return (
    <>
      {text.split("\n").map((ln, i) => (
        <p
          key={i}
          style={{
            fontSize: size,
            color,
            lineHeight: 1.85,
            margin: i === 0 ? 0 : "14px 0 0",
            wordBreak: "keep-all",
          }}
        >
          {ln}
        </p>
      ))}
    </>
  );
}

// ── 메타 아이템 ───────────────────────────────────────────────────────────────

function MetaItem({ label, value }: { label: string; value: string | number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 7 }}>
      <span
        style={{
          fontSize: 13.5,
          fontWeight: 600,
          color: "var(--color-muted-soft)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--color-body-strong)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </span>
  );
}

// ── 페이지 ────────────────────────────────────────────────────────────────────

export default async function InquiryDetailPage({ params }: Props) {
  const { id } = await params;
  const post = await fetchPublicInquiry(Number(id)).catch(() => null);

  if (!post) {
    return (
      <section className="wrap band" style={{ paddingTop: 40 }}>
        <p style={{ fontSize: 17, color: "var(--color-muted)", textAlign: "center" }}>
          찾을 수 없습니다.
        </p>
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Link
            href="/inquiry"
            style={{ fontSize: 15, color: "var(--color-primary)" }}
          >
            목록으로 돌아가기
          </Link>
        </div>
      </section>
    );
  }

  const answered = !!post.answer;

  return (
    <section className="wrap band" style={{ paddingTop: 40 }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        {/* 게시판 라벨 + 목록 링크 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 14,
              fontWeight: 700,
              color: "var(--color-primary)",
              letterSpacing: "0.2px",
            }}
          >
            <Message size={16} strokeWidth={2.2} />
            상담문의 게시판
          </span>
          <Link
            href="/inquiry"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 14,
              fontWeight: 600,
              color: "var(--color-muted)",
              textDecoration: "none",
            }}
          >
            <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}>
              <ChevronRight size={15} />
            </span>
            목록
          </Link>
        </div>

        {/* 제목 블록 */}
        <div
          style={{
            borderTop: "2px solid var(--color-ink)",
            borderBottom: "1px solid var(--color-hairline-strong)",
            padding: "26px 4px 22px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
            }}
          >
            <Badge tone={post.status === "답변완료" ? "success" : "neutral"}>{post.status}</Badge>
            <Badge tone="neutral">{CAT_MAP[post.category] ?? post.category}</Badge>
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(22px, 3vw, 28px)",
              fontWeight: 700,
              color: "var(--color-ink)",
              lineHeight: 1.4,
              letterSpacing: "-0.5px",
              margin: "0 0 16px",
              wordBreak: "keep-all",
            }}
          >
            {post.title}
          </h1>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "6px 20px",
            }}
          >
            <MetaItem label="작성자" value={post.authorMasked} />
            <MetaItem label="작성일" value={post.createdAt.slice(0, 10)} />
          </div>
        </div>

        {/* 본문 / 비밀글 */}
        {post.isSecret ? (
          <SecretReveal id={post.id} />
        ) : (
          <>
            {/* 문의 본문 */}
            <div
              style={{
                padding: "32px 4px 36px",
                borderBottom: "1px solid var(--color-hairline)",
              }}
            >
              <Paragraphs text={post.content ?? ""} color="var(--color-body)" size={17} />
            </div>

            {/* 답변 */}
            {answered ? (
              <div
                style={{
                  marginTop: 28,
                  background: "var(--color-primary-soft)",
                  border: "1px solid var(--color-primary-border)",
                  borderRadius: 18,
                  padding: "clamp(22px, 3.5vw, 32px)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    marginBottom: 16,
                  }}
                >
                  <span
                    style={{
                      width: 38,
                      height: 38,
                      flex: "0 0 auto",
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 10,
                      background: "var(--color-primary)",
                      color: "#fff",
                      fontFamily: "var(--font-display)",
                      fontSize: 17,
                      fontWeight: 800,
                    }}
                  >
                    A
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "var(--color-ink)",
                        letterSpacing: "-0.3px",
                      }}
                    >
                      성요셉목수학교 답변
                    </span>
                    <span style={{ fontSize: 13, color: "var(--color-muted)" }}>
                      교육상담팀 · 1영업일 내 답변
                    </span>
                  </span>
                </div>
                <Paragraphs
                  text={post.answer!}
                  color="var(--color-body-strong)"
                  size={16.5}
                />
              </div>
            ) : (
              <div
                style={{
                  marginTop: 28,
                  background: "var(--color-surface-strong)",
                  border: "1px solid var(--color-hairline)",
                  borderRadius: 18,
                  padding: "clamp(22px, 3.5vw, 30px)",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
                >
                  <span
                    style={{
                      width: 38,
                      height: 38,
                      flex: "0 0 auto",
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 10,
                      background: "var(--color-surface-card)",
                      border: "1px solid var(--color-hairline)",
                      color: "var(--color-muted)",
                    }}
                  >
                    <Clock size={19} strokeWidth={2.1} />
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "var(--color-ink)",
                      }}
                    >
                      답변을 준비하고 있습니다
                    </span>
                    <span
                      style={{
                        fontSize: 14.5,
                        color: "var(--color-muted)",
                        lineHeight: 1.65,
                        wordBreak: "keep-all",
                      }}
                    >
                      남겨주신 문의는 확인 후 전화 또는 게시판으로
                      답변드립니다. 급하시면{" "}
                      <a
                        href={"tel:" + PHONE_MAIN}
                        style={{
                          color: "var(--color-primary)",
                          fontWeight: 700,
                          textDecoration: "none",
                        }}
                      >
                        {PHONE_MAIN}
                      </a>{" "}
                      으로 전화 주세요.
                    </span>
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {/* 하단 액션 */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            marginTop: 30,
          }}
        >
          <Link href="/inquiry">
            <Button
              variant="outline"
              size="md"
              leftIcon={
                <span
                  style={{ transform: "rotate(180deg)", display: "inline-flex" }}
                >
                  <ChevronRight size={17} />
                </span>
              }
            >
              목록으로
            </Button>
          </Link>
          <InquiryWriteButton />
        </div>
      </div>
    </section>
  );
}
