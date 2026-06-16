// 공지사항 목록 (ISR)

import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/sections/PageHero";
import { getNotices } from "@/lib/queries/notice";
import type { NoticeListItem } from "@/lib/queries/types";
import { PHONE_MAIN } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "공지사항 — 성요셉목수학교",
  description: "성요셉목수학교 공지사항 — 수강신청 안내, 학원 소식, 인증·표창 소식.",
};

export const revalidate = 3600;

function fmtDate(d: string | null) {
  return d ? d.replace(/-/g, ".") : "";
}

export default async function NoticePage() {
  let notices: NoticeListItem[];
  try {
    notices = await getNotices();
  } catch {
    notices = [];
  }

  return (
    <>
      <PageHero
        eyebrow="공지사항"
        title="공지사항"
        sub={"수강신청 안내부터 학원 소식까지, 한눈에 확인하세요."}
      />
      <section className="wrap band" style={{ paddingTop: 32 }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {notices.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                fontSize: 15.5,
                color: "var(--color-muted)",
                lineHeight: 1.7,
                wordBreak: "keep-all",
              }}
            >
              등록된 공지사항이 없습니다.
              <br />
              궁금한 점은 전화({PHONE_MAIN})로 문의해 주세요.
            </p>
          ) : (
            <div
              style={{
                border: "1px solid var(--color-hairline)",
                borderRadius: 16,
                overflow: "hidden",
                background: "var(--color-surface-card)",
              }}
            >
              {notices.map((n, i) => (
                <Link
                  key={n.id}
                  href={`/notice/${n.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "18px 20px",
                    borderBottom:
                      i === notices.length - 1 ? "none" : "1px solid var(--color-hairline)",
                    textDecoration: "none",
                  }}
                >
                  {n.isPinned && (
                    <span
                      style={{
                        flex: "0 0 auto",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--color-primary)",
                        background: "var(--color-primary-soft)",
                        border: "1px solid var(--color-primary-border)",
                        borderRadius: 9999,
                        padding: "3px 9px",
                      }}
                    >
                      공지
                    </span>
                  )}
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: 16,
                      fontWeight: 600,
                      color: "var(--color-ink)",
                      lineHeight: 1.5,
                      wordBreak: "keep-all",
                    }}
                  >
                    {n.title}
                  </span>
                  <span
                    style={{
                      flex: "0 0 auto",
                      fontSize: 13.5,
                      color: "var(--color-muted)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {fmtDate(n.publishedAt)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
