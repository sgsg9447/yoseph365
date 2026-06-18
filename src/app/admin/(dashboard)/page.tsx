import Link from "next/link";
import { KpiCard } from "@/components/admin/KpiCard";
import { SectionCard } from "@/components/admin/SectionCard";
import { ProgressBar } from "@/components/admin/ProgressBar";
import { StatusChip } from "@/components/admin/StatusChip";
import { EmptyState } from "@/components/admin/EmptyState";
import { Users, Clipboard, Message, Hammer } from "@/components/icons";
import { DEMO_KPI, DEMO_COURSE_CLICKS } from "@/app/admin/demo";
import { getOpenCourseCount, getAdminCourses, getEnrollments } from "@/lib/queries/admin";

export default async function DashboardPage() {
  const [openCount, courses, enrollments] = await Promise.all([
    getOpenCourseCount(),
    getAdminCourses(),
    getEnrollments(),
  ]);
  const recent = enrollments.slice(0, 4);
  const totalCourses = courses.length;

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
          title="과정별 클릭률 TOP 5"
          action={
            <Link href="/admin/clicks" className="text-primary text-[14px] font-semibold">
              자세히 →
            </Link>
          }
        >
          <div className="flex flex-col gap-3">
            {DEMO_COURSE_CLICKS.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between mb-1">
                  <span className="text-[14px] text-body-strong">{item.name}</span>
                  <span className="text-[13px] text-muted">{item.clicks.toLocaleString()} 클릭</span>
                </div>
                <ProgressBar pct={item.pct} />
              </div>
            ))}
          </div>
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
