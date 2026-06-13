// Server component — current course schedule.
// onApply is passed from HomeInteractive (client wrapper) in the home page.
// Per domain rule: no real calendar dates — only "평일반" / "주말반".

import Link from "next/link";
import { Calendar } from "@/components/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { CourseRow } from "@/components/ui/CourseRow";

interface CourseItem {
  name: string;
  startDate: string;
  meta: string;
  open: boolean;
}

const courses: CourseItem[] = [
  { name: "친환경 집수리 과정", startDate: "평일반", meta: "목공·전기·타일·설비·단열·욕실", open: true },
  { name: "건축목공(인테리어목수) 입문과정", startDate: "평일반", meta: "입문 · 주간", open: true },
  { name: "건축목공(인테리어목수) 입문과정", startDate: "주말반", meta: "입문 · 주말", open: true },
  { name: "인테리어필름 입문과정", startDate: "주말반", meta: "입문 · 주말", open: true },
  { name: "국가기능사 자격 과정", startDate: "평일반", meta: "자격 대비 · 주간", open: true },
];

interface ScheduleProps {
  onApply?: (name: string) => void;
}

export function Schedule({ onApply }: ScheduleProps) {
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
        <Card
          padding={8}
          style={{ maxWidth: 760, margin: "32px auto 0", padding: "8px 20px" }}
        >
          {courses.map((c, i) => (
            <CourseRow
              key={i}
              {...c}
              last={i === courses.length - 1}
              onClick={onApply ? () => onApply(c.name) : undefined}
            />
          ))}
        </Card>
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
