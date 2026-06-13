// 과정 안내 페이지 — 서버 컴포넌트
// 참조: HANDOFF/ui_kits/website/sections.jsx:468-490, courses.jsx, courses.html

import Link from "next/link";
import { PageHero } from "@/components/sections/PageHero";
import { Card } from "@/components/ui/Card";
import { CATALOG_COURSES } from "@/lib/data/courses";

// CourseCatalog: "수강 신청" → /apply?course=<encoded> (Link, 서버 컴포넌트 유지)
function CourseCatalog() {
  return (
    <section className="wrap band">
      <div className="grid g-2">
        {CATALOG_COURSES.map((c, i) => (
          <Card
            key={i}
            padding={26}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "var(--color-ink)",
                letterSpacing: "-0.3px",
              }}
            >
              {c.name}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--color-primary)",
              }}
            >
              {c.meta}
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
            <div>
              <Link
                href={`/apply?course=${encodeURIComponent(c.name)}`}
                className="inline-flex items-center justify-center gap-2 rounded-button font-semibold leading-none tracking-[-0.2px] whitespace-nowrap transition active:scale-[0.98] h-12 px-[22px] text-[17px] bg-transparent text-ink border border-hairline-strong"
              >
                수강 신청
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default function CoursesPage() {
  return (
    <>
      <PageHero
        eyebrow="훈련과정"
        title="성요셉목수학교 과정 안내"
        sub="목공·집수리·인테리어 전문 기술을 체계적으로 배웁니다. 초보자부터 자격증 준비생까지 수준별 과정을 운영합니다."
      />
      <CourseCatalog />
    </>
  );
}
