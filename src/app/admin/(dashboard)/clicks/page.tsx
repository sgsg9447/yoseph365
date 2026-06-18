import { FilterPills } from "@/components/admin/FilterPills";
import { SectionCard } from "@/components/admin/SectionCard";
import { ProgressBar } from "@/components/admin/ProgressBar";
import { DEMO_COURSE_CLICKS } from "@/app/admin/demo";

export default function ClicksPage() {
  return (
    <div>
      <FilterPills items={["최근 30일", "최근 7일", "전체"]} active="최근 30일" />

      <SectionCard
        title="과정 상세 페이지 클릭 & 전환"
        className="mt-5"
      >
        <div className="flex flex-col gap-5">
          {DEMO_COURSE_CLICKS.map((item) => (
            <div key={item.name}>
              <p className="text-[15px] font-semibold text-ink mb-1">{item.name}</p>
              <p className="text-[14px] text-muted mb-2">
                <strong>{item.clicks.toLocaleString()}</strong> 클릭 · {item.conv}
              </p>
              <ProgressBar pct={item.pct} thick />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
