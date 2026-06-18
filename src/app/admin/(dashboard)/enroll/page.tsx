import { getEnrollments } from "@/lib/queries/admin";
import { SectionCard } from "@/components/admin/SectionCard";
import { StatusChip } from "@/components/admin/StatusChip";
import { FilterPills } from "@/components/admin/FilterPills";
import { EmptyState } from "@/components/admin/EmptyState";

export default async function EnrollPage() {
  const rows = await getEnrollments();
  return (
    <div className="flex flex-col gap-5">
      <FilterPills items={["전체", "대기", "승인", "취소"]} active="전체" />
      <SectionCard padding={0}>
        {rows.length === 0 ? (
          <EmptyState message="아직 수강신청 내역이 없습니다." />
        ) : (
          <div>
            <div
              className="hidden md:grid px-5 py-3 bg-canvas-soft text-[13px] font-semibold text-muted"
              style={{ gridTemplateColumns: "1.4fr 1.6fr 1.3fr 0.8fr 0.9fr" }}
            >
              <span>신청자</span>
              <span>과정</span>
              <span>연락처</span>
              <span>신청일</span>
              <span className="text-right">상태</span>
            </div>
            {rows.map((r) => (
              <div
                key={r.id}
                className="grid items-center px-5 py-4 border-t border-hairline-soft text-[15px]"
                style={{ gridTemplateColumns: "1.4fr 1.6fr 1.3fr 0.8fr 0.9fr" }}
              >
                <span className="font-semibold text-ink">{r.name}</span>
                <span className="text-body">{r.course}</span>
                <span className="text-body">{r.phone}</span>
                <span className="text-muted">{r.date}</span>
                <span className="text-right">
                  <StatusChip status={r.status} />
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
