import { type ReactNode } from "react";
import { Card } from "./Card";
import { ChevronRight } from "@/components/icons";

type Tint = "none" | "rose" | "peach" | "lavender" | "sky";

interface TintStyle {
  bg: string;
  fg: string;
}

// These pastel tint values are from the handoff and are not design tokens — use inline style.
const tintStyles: Record<Tint, TintStyle> = {
  none: { bg: "var(--color-surface-strong)", fg: "var(--color-ink)" },
  rose: { bg: "#f9eef1", fg: "#a3596e" },
  peach: { bg: "#fbf0e8", fg: "#b06a44" },
  lavender: { bg: "#f2edf8", fg: "#6b5b8a" },
  sky: { bg: "#ebf2fa", fg: "#3a6294" },
};

interface IntentCardProps {
  icon: ReactNode;
  title: string;
  desc: string;
  tint?: Tint;
  onClick?: () => void;
}

export function IntentCard({ icon, title, desc, tint = "none", onClick }: IntentCardProps) {
  const t = tintStyles[tint];
  return (
    <Card
      interactive
      padding={22}
      onClick={onClick}
      className="flex flex-col items-stretch h-full box-border"
    >
      <span className="flex items-start justify-between">
        <span
          className="w-[52px] h-[52px] grid place-items-center rounded-[14px] flex-shrink-0"
          style={{ background: t.bg, color: t.fg }}
        >
          {icon}
        </span>
        <ChevronRight size={18} className="text-muted-soft mt-1 flex-shrink-0" />
      </span>
      <span className="text-[18px] font-bold text-ink tracking-[-0.4px] leading-[1.3] break-keep mt-[18px]">
        {title}
      </span>
      <span className="text-[15px] text-muted leading-[1.55] break-keep mt-[6px]">
        {desc}
      </span>
    </Card>
  );
}
