import Link from "next/link";
import { KpiCard } from "@/components/admin/KpiCard";
import { SectionCard } from "@/components/admin/SectionCard";
import { ProgressBar } from "@/components/admin/ProgressBar";
import { StatusChip } from "@/components/admin/StatusChip";
import { EmptyState } from "@/components/admin/EmptyState";
import { Users, Clipboard, Message, Hammer } from "@/components/icons";
import { DEMO_KPI } from "@/app/admin/demo";
import { getOpenCourseCount, getAdminCourses, getEnrollments } from "@/lib/queries/admin";
import { getCourseFunnel } from "@/lib/analytics/events";
import { viewBarPct } from "@/lib/analytics/funnel";

export default async function DashboardPage() {
  const [openCount, courses, enrollments, funnel] = await Promise.all([
    getOpenCourseCount(),
    getAdminCourses(),
    getEnrollments(),
    getCourseFunnel(),
  ]);
  const recent = enrollments.slice(0, 4);
  const totalCourses = courses.length;
  const clickViews = funnel.slice(0, 5);
  const maxViews = Math.max(0, ...clickViews.map((c) => c.views));

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="오늘 방문자"
          value={String(DEMO_KPI.visitors)}
          delta={DEMO_KPI.visitorsDelta}
          icon={<Users size={18} />}
        />
        <KpiCard
          label="이번 달 수강신청"
          value={`${DEMO_KPI.enroll}건`}
          delta={DEMO_KPI.enrollDelta}
          icon={<Clipboard size={18} />}
        />
        <KpiCard
          label="상담 대기"
          value={`${DEMO_KPI.consult}건`}
          delta={DEMO_KPI.consultNew}
          icon={<Message size={18} />}
        />
        <KpiCard
          label="모집 중 과정"
          value={`${openCount}개`}
          delta={`전체 ${totalCourses}개 중`}
          icon={<Hammer size={18} />}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <SectionCard
          title="과정별 클릭률"
          action={
            <Link href="/admin/clicks" className="text-primary text-[14px] font-semibold">
              자세히 →
            </Link>
          }
        >
          {clickViews.length === 0 ? (
            <EmptyState message="등록된 과정이 없습니다." />
          ) : (
            <div className="flex flex-col gap-3">
              {clickViews.map((course) =>
                course.views > 0 ? (
                  <div key={course.id}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[14px] text-body-strong">{course.name}</span>
                      <span className="text-[13px] text-muted">
                        {course.views.toLocaleString()}회 · 전환 {course.conversionPct}%
                      </span>
                    </div>
                    <ProgressBar pct={viewBarPct(course.views, maxViews)} />
                  </div>
                ) : (
                  <div key={course.id} className="flex items-center justify-between">
                    <span className="text-[14px] text-body-strong">{course.name}</span>
                    <span className="text-[13px] font-semibold text-muted bg-surface-strong rounded-full px-2.5 py-0.5">
                      집계 전
                    </span>
                  </div>
                ),
              )}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="최근 수강신청"
          action={
            <Link href="/admin/enroll" className="text-primary text-[14px] font-semibold">
              전체 →
            </Link>
          }
        >
          {recent.length === 0 ? (
            <EmptyState message="아직 수강신청 내역이 없습니다." />
          ) : (
            <div className="flex flex-col gap-3">
              {recent.map((r) => (
                <div key={r.id} className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-surface-strong text-ink font-bold text-[14px] inline-flex items-center justify-center flex-shrink-0">
                    {r.name[0]}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-ink">{r.name}</p>
                    <p className="text-[13px] text-muted truncate">{r.course}</p>
                  </div>
                  <StatusChip status={r.status} />
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
