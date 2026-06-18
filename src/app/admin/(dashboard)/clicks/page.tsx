import { FilterPills } from "@/components/admin/FilterPills";
import { SectionCard } from "@/components/admin/SectionCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { getAdminCourses } from "@/lib/queries/admin";

export default async function ClicksPage() {
  const courses = await getAdminCourses();

  return (
    <div>
      <FilterPills items={["최근 30일", "최근 7일", "전체"]} active="최근 30일" />

      <SectionCard title="과정 상세 페이지 클릭 & 전환" className="mt-5">
        {courses.length === 0 ? (
          <EmptyState message="등록된 과정이 없습니다." />
        ) : (
          <>
            <p className="text-[14px] text-muted mb-4">
              방문·클릭 집계는 준비 중입니다. 현재는 과정 목록만 표시됩니다.
            </p>
            <div className="flex flex-col gap-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between border-b border-hairline-soft pb-4 last:border-b-0 last:pb-0"
                >
                  <p className="text-[15px] font-semibold text-ink">{course.name}</p>
                  <span className="text-[13px] font-semibold text-muted bg-surface-strong rounded-full px-3 py-1">
                    집계 전
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </SectionCard>
    </div>
  );
}
