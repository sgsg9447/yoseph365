import { Card } from "./Card";
import { ChevronRight } from "@/components/icons";

interface IntentCardProps {
  title: string;
  desc: string;
  onClick?: () => void;
}

export function IntentCard({ title, desc, onClick }: IntentCardProps) {
  return (
    <Card
      interactive
      padding={22}
      onClick={onClick}
      className="flex flex-col items-stretch h-full box-border"
    >
      <span className="flex items-start justify-between gap-2">
        <span className="text-[21px] font-bold text-ink tracking-[-0.5px] leading-[1.3] break-keep">
          {title}
        </span>
        <ChevronRight size={20} className="text-muted-soft mt-1 flex-shrink-0" />
      </span>
      <span className="text-[15px] text-muted leading-[1.6] break-keep mt-[10px]">
        {desc}
      </span>
    </Card>
  );
}
