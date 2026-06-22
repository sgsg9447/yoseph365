import { FilterPills } from "@/components/admin/FilterPills";
import { SectionCard } from "@/components/admin/SectionCard";
import { ProgressBar } from "@/components/admin/ProgressBar";
import { EmptyState } from "@/components/admin/EmptyState";
import { getCourseFunnel } from "@/lib/analytics/events";
import { viewBarPct } from "@/lib/analytics/funnel";

export default async function ClicksPage() {
  const courses = await getCourseFunnel();
  const maxViews = Math.max(0, ...courses.map((c) => c.views));

  return (
    <div>
      <FilterPills items={["최근 30일", "최근 7일", "전체"]} active="최근 30일" />

      <SectionCard title="과정 상세 페이지 조회 & 전환" className="mt-5">
        {courses.length === 0 ? (
          <EmptyState message="등록된 과정이 없습니다." />
        ) : (
          <div className="flex flex-col gap-5">
            {courses.map((course) =>
              course.views > 0 ? (
                <div key={course.id}>
                  <div className="flex items-baseline justify-between mb-1">
                    <p className="text-[15px] font-semibold text-ink">{course.name}</p>
                    {course.rateReliable ? (
                      <p className="text-[13px] text-muted">
                        전환 <strong className="text-primary">{course.conversionPct}%</strong>
                      </p>
                    ) : (
                      <p className="text-[13px] text-muted-soft" title="조회 표본이 적어 전환율은 오차가 큽니다">
                        표본 적음
                      </p>
                    )}
                  </div>
                  <p className="text-[14px] text-muted mb-2">
                    <strong>{course.views.toLocaleString()}</strong>회 조회 · 신청 {course.applies}건
                  </p>
                  <ProgressBar pct={viewBarPct(course.views, maxViews)} thick />
                </div>
              ) : (
                <div
                  key={course.id}
                  className="flex items-center justify-between border-b border-hairline-soft pb-4 last:border-b-0 last:pb-0"
                >
                  <p className="text-[15px] font-semibold text-ink">{course.name}</p>
                  <span className="text-[13px] font-semibold text-muted bg-surface-strong rounded-full px-3 py-1">
                    집계 전
                  </span>
                </div>
              ),
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
