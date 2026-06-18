import { getInquiries } from "@/lib/queries/admin";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Phone } from "@/components/icons";
import { EmptyState } from "@/components/admin/EmptyState";

export default async function ConsultPage() {
  const rows = await getInquiries();
  if (rows.length === 0) return <EmptyState message="접수된 상담 문의가 없습니다." />;
  return (
    <div className="flex flex-col gap-[14px]">
      {rows.map((q) => (
        <Card key={q.id} padding={20}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[16px] font-bold text-ink">{q.name}</span>
            <span className="text-muted text-[14px]">{q.phone}</span>
            <span className="text-[12px] font-semibold text-primary bg-primary-soft rounded-full px-2.5 py-1">{q.interest}</span>
            <span className="ml-auto">
              <Badge tone={q.status === "신규" ? "solid" : "neutral"}>{q.status}</Badge>
            </span>
          </div>
          <p className="mt-3 text-body text-[15px] leading-[1.6]">{q.message}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-muted-soft text-[13px] mr-auto">{q.date}</span>
            <Button size="sm" leftIcon={<Phone size={15} />}>전화 상담</Button>
            <Button size="sm" variant="outline">완료 처리</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
