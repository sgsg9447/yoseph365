// 공지사항 상세 (ISR)

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import { getNotices, getNoticeById } from "@/lib/queries/notice";

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const notices = await getNotices();
    return notices.map((n) => ({ id: String(n.id) }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const notice = await getNoticeById(Number(id)).catch(() => null);
  if (!notice) return { title: "공지사항 — 성요셉목수학교" };
  return {
    title: `${notice.title} — 성요셉목수학교`,
    description: notice.body.slice(0, 100),
  };
}

function fmtDate(d: string | null) {
  return d ? d.replace(/-/g, ".") : "";
}

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const notice = await getNoticeById(Number(id)).catch(() => null);
  if (!notice) notFound();

  return (
    <section className="wrap band" style={{ paddingTop: 36, paddingBottom: 64 }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <Link
          href="/notice"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            height: 38,
            padding: "0 14px 0 10px",
            borderRadius: 9999,
            border: "1px solid var(--color-hairline-strong)",
            background: "var(--color-surface-card)",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--color-body-strong)",
            textDecoration: "none",
            marginBottom: 24,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m15 18-6-6 6-6" />
          </svg>
          공지사항 목록
        </Link>

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(22px, 3vw, 30px)",
            fontWeight: 700,
            color: "var(--color-ink)",
            letterSpacing: "-0.5px",
            lineHeight: 1.35,
            margin: 0,
            wordBreak: "keep-all",
          }}
        >
          {notice.title}
        </h1>
        {notice.publishedAt && (
          <p style={{ fontSize: 14, color: "var(--color-muted)", margin: "10px 0 0" }}>
            {fmtDate(notice.publishedAt)}
          </p>
        )}

        <div
          className="rich-content"
          style={{
            marginTop: 24,
            paddingTop: 24,
            borderTop: "1px solid var(--color-hairline)",
            fontSize: 16,
            lineHeight: 1.85,
          }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(notice.body) }}
        />

        {notice.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 28 }}>
            {notice.tags.map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 13,
                  color: "var(--color-muted)",
                  background: "var(--color-canvas-soft)",
                  border: "1px solid var(--color-hairline)",
                  borderRadius: 9999,
                  padding: "5px 11px",
                }}
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
