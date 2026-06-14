// Server component — current course schedule.
// 행 클릭 시 과정 상세(/courses/[id])로 이동.
// Per domain rule: no real calendar dates — only "평일반" / "주말반".

import Link from "next/link";
import { Calendar } from "@/components/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { CourseRow } from "@/components/ui/CourseRow";
import type { ScheduleCourse } from "@/lib/queries/types";
import { PHONE_MAIN } from "@/lib/data/site";

interface ScheduleProps {
  courses: ScheduleCourse[];
}

export function Schedule({ courses }: ScheduleProps) {
  return (
    <section
      id="schedule"
      style={{
        background: "var(--color-canvas)",
        borderTop: "1px solid var(--color-hairline)",
        borderBottom: "1px solid var(--color-hairline)",
      }}
    >
      <div className="wrap band">
        <div className="text-center mb-2">
          <span className="inline-flex items-center gap-2 text-muted">
            <Calendar size={18} strokeWidth={2.1} />
            <span className="text-[13px] font-bold tracking-[0.3px]">2026년 7–8월 모집</span>
          </span>
        </div>
        <SectionHeading align="center" title={<>운영중인 훈련과정</>} />
        {courses.length > 0 ? (
          <Card
            padding={8}
            style={{ maxWidth: 760, margin: "32px auto 0", padding: "8px 20px" }}
          >
            {courses.map((c, i) => (
              <CourseRow
                key={c.id}
                name={c.name}
                startDate={c.startDate}
                meta={c.meta}
                open={c.open}
                status={c.open ? "모집중" : "모집마감"}
                last={i === courses.length - 1}
                href={`/courses/${c.id}`}
              />
            ))}
          </Card>
        ) : (
          <p className="text-[15px] text-muted leading-[1.7] mt-8 mx-auto max-w-[760px] text-center break-keep">
            현재 모집 중인 과정 안내는 전화({PHONE_MAIN})로 도와드립니다.
          </p>
        )}
        <p className="text-[14px] text-muted leading-[1.6] mt-4 mx-auto max-w-[760px] text-center break-keep">
          회차별 교육 내용과 개강일은 과정 안내에서 확인하세요.
        </p>
        <div className="flex justify-center mt-[22px]">
          <Link
            href="/courses"
            className="inline-flex items-center justify-center gap-2 rounded-button font-semibold leading-none tracking-[-0.2px] whitespace-nowrap transition active:scale-[0.98] h-12 px-[22px] text-[17px] bg-transparent text-ink border border-hairline-strong"
          >
            과정 안내 전체보기
          </Link>
        </div>
      </div>
    </section>
  );
}
