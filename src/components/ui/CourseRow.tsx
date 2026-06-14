import Link from "next/link";
import { Badge } from "./Badge";
import { ChevronRight } from "@/components/icons";

interface CourseRowProps {
  name: string;
  startDate?: string;
  meta?: string;
  status?: string;
  open?: boolean;
  last?: boolean;
  href?: string;
  highlighted?: boolean;
  onClick?: () => void;
}

export function CourseRow({
  name,
  startDate,
  meta,
  status = "모집중",
  open = true,
  last,
  href,
  highlighted,
  onClick,
}: CourseRowProps) {
  const inner = (
    <>
      <span className="flex flex-col gap-[6px] flex-1 min-w-0">
        <span className="text-[18px] font-semibold text-ink tracking-[-0.3px]">{name}</span>
        <span className="flex items-center gap-2 flex-wrap">
          {startDate && (
            <span className="text-[15px] font-semibold text-primary whitespace-nowrap">{startDate} 개강</span>
          )}
          {meta && <span className="text-[14px] text-muted whitespace-nowrap">· {meta}</span>}
        </span>
      </span>
      <Badge tone={open ? "success" : "neutral"} dot={open}>
        {status}
      </Badge>
      <ChevronRight size={20} className="text-muted-soft flex-shrink-0" />
    </>
  );

  const commonClass = [
    "flex items-center gap-3 w-full py-[18px] px-[12px] text-left transition-colors",
    last ? "" : "border-b border-hairline",
    highlighted ? "course-row-highlight" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <Link href={href} className={commonClass}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={[commonClass, "bg-transparent cursor-pointer"].join(" ")}
    >
      {inner}
    </button>
  );
}
