import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

interface SectionCardProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  padding?: number | string;
  className?: string;
}

export function SectionCard({ title, action, children, padding = 20, className }: SectionCardProps) {
  const hasHeader = title || action;

  if (padding === 0 || padding === "0" || padding === "0px") {
    return (
      <Card padding={0} className={className}>
        {hasHeader && (
          <div className="flex items-center justify-between px-5 py-4">
            {title && <h2 className="text-[17px] font-bold text-ink">{title}</h2>}
            {action && <div>{action}</div>}
          </div>
        )}
        {children}
      </Card>
    );
  }

  return (
    <Card padding={padding} className={className}>
      {hasHeader && (
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-[17px] font-bold text-ink">{title}</h2>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </Card>
  );
}
