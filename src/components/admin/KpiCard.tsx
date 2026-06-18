import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

interface KpiCardProps {
  label: string;
  value: string;
  delta?: string;
  icon: ReactNode;
}

export function KpiCard({ label, value, delta, icon }: KpiCardProps) {
  return (
    <Card padding={20} className="rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-[14px] text-muted">{label}</span>
        <span className="w-[34px] h-[34px] bg-primary-soft text-primary rounded-[10px] inline-flex items-center justify-center flex-shrink-0">
          {icon}
        </span>
      </div>
      <p className="text-[32px] font-bold text-ink leading-tight mt-3">{value}</p>
      {delta && <p className="text-[13px] text-success mt-1">{delta}</p>}
    </Card>
  );
}
