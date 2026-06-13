import { type ReactNode } from "react";
import { Check } from "@/components/icons";

interface TrustBadgeProps {
  label: string;
  sub?: string;
  icon?: ReactNode;
}

export function TrustBadge({ label, sub, icon }: TrustBadgeProps) {
  return (
    <div className="flex items-center gap-3 p-[14px_16px] bg-surface-card border border-hairline rounded-button">
      <span className="flex-shrink-0 w-9 h-9 grid place-items-center rounded-full bg-primary-soft text-primary">
        {icon ?? <Check size={18} strokeWidth={2.4} />}
      </span>
      <span className="flex flex-col gap-[2px] min-w-0">
        <span className="text-[15px] font-semibold text-ink tracking-[-0.2px] leading-[1.35]">
          {label}
        </span>
        {sub && <span className="text-[13px] text-muted">{sub}</span>}
      </span>
    </div>
  );
}
