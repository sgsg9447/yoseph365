import type { ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

interface KpiCardProps {
  label: string;
  value: string;
  delta?: string;
  icon: ReactNode;
  /** 있으면 카드 전체가 해당 경로로 이동하는 링크가 된다 */
  href?: string;
}

export function KpiCard({ label, value, delta, icon, href }: KpiCardProps) {
  const card = (
    <Card padding={20} interactive={!!href} className="rounded-lg">
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

  return href ? (
    <Link href={href} className="block">
      {card}
    </Link>
  ) : (
    card
  );
}
