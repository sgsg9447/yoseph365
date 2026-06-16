import { Card } from "./Card";
import { ChevronRight } from "@/components/icons";

interface IntentCardProps {
  index: string;
  title: string;
  desc: string;
  onClick?: () => void;
}

export function IntentCard({ index, title, desc, onClick }: IntentCardProps) {
  return (
    <Card
      interactive
      padding={22}
      onClick={onClick}
      className="flex flex-col items-stretch h-full box-border"
      style={{ background: "linear-gradient(155deg, #FFFFFF 0%, #FCFAF6 100%)" }}
    >
      <span className="flex items-center justify-between">
        <span className="text-[14px] font-bold text-muted-soft tracking-[0.5px] tabular-nums">
          {index}
        </span>
        <ChevronRight size={20} className="text-muted-soft flex-shrink-0" />
      </span>
      <span className="text-[18px] font-bold text-ink tracking-[-0.3px] leading-[1.35] break-keep mt-[14px]">
        {title}
      </span>
      <span className="text-[15px] text-muted leading-[1.6] break-keep mt-[8px]">
        {desc}
      </span>
    </Card>
  );
}
