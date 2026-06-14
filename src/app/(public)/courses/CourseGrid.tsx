// 과정 카탈로그 그리드 — 카드는 /courses/[id] 상세로 이동하는 Link.

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { CatalogCourse } from "@/lib/queries/types";
import { PHONE_MAIN } from "@/lib/data/site";
import { DayChip, RecruitBadge, FundingBadge } from "./chips";

export function CourseGrid({ courses }: { courses: CatalogCourse[] }) {
  if (courses.length === 0) {
    return (
      <section className="wrap band" style={{ paddingBottom: 24, textAlign: "center" }}>
        <SectionHeading align="center" eyebrow="2026년" title="운영중인 훈련과정" />
        <p
          style={{
            fontSize: 15.5,
            color: "var(--color-muted)",
            lineHeight: 1.7,
            margin: "24px 0 0",
            wordBreak: "keep-all",
          }}
        >
          현재 안내해 드릴 과정 정보를 준비 중입니다.
          <br />
          개설 과정은 전화({PHONE_MAIN})로 바로 안내해 드립니다.
        </p>
      </section>
    );
  }
  return (
    <section className="wrap band" style={{ paddingBottom: 24 }}>
      <SectionHeading
        align="center"
        eyebrow="2026년"
        title="운영중인 훈련과정"
        sub="과정을 누르면 회차별 교육 내용을 볼 수 있습니다."
      />
      <div className="grid g-2" style={{ marginTop: 36 }}>
        {courses.map((c) => (
          <Link
            key={c.id}
            href={`/courses/${c.id}`}
            style={{ display: "block", textDecoration: "none" }}
          >
            <Card
              interactive
              padding={26}
              style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}
            >
              {/* 뱃지 행 */}
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {c.days.map((d) => (
                    <DayChip key={d} day={d} />
                  ))}
                  <FundingBadge funding={c.funding} />
                  <RecruitBadge status={c.recruitStatus} />
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-muted-soft)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </span>

              <span
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--color-ink)",
                  letterSpacing: "-0.3px",
                  lineHeight: 1.35,
                  wordBreak: "keep-all",
                }}
              >
                {c.name}
              </span>

              <span style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {c.tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: "var(--color-muted)",
                      background: "var(--color-canvas-soft)",
                      border: "1px solid var(--color-hairline)",
                      padding: "4px 10px",
                      borderRadius: 9999,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </span>

              <p
                style={{
                  fontSize: 15,
                  color: "var(--color-body)",
                  lineHeight: 1.7,
                  margin: 0,
                  wordBreak: "keep-all",
                  flex: 1,
                }}
              >
                {c.desc}
              </p>

              <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--color-muted)" }}>
                {c.meta}
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
