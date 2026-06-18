import { FilterPills } from "@/components/admin/FilterPills";
import { SectionCard } from "@/components/admin/SectionCard";
import { ProgressBar } from "@/components/admin/ProgressBar";
import { EmptyState } from "@/components/admin/EmptyState";
import { getCourseClicks } from "@/lib/queries/admin";

export default async function ClicksPage() {
  const courses = await getCourseClicks();

  return (
    <div>
      <FilterPills items={["최근 30일", "최근 7일", "전체"]} active="최근 30일" />

      <SectionCard title="과정 상세 페이지 클릭 & 전환" className="mt-5">
        {courses.length === 0 ? (
          <EmptyState message="등록된 과정이 없습니다." />
        ) : (
          <div className="flex flex-col gap-5">
            {courses.map((course) =>
              course.clicks > 0 ? (
                <div key={course.id}>
                  <p className="text-[15px] font-semibold text-ink mb-1">{course.name}</p>
                  <p className="text-[14px] text-muted mb-2">
                    <strong>{course.clicks.toLocaleString()}</strong> 클릭
                  </p>
                  <ProgressBar pct={course.pct} thick />
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
