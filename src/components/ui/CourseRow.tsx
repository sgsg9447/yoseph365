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
  const metaText = meta ? `· ${meta}` : null;

  const inner = (
    <>
      <span className="flex items-center gap-3">
        <span className="flex flex-col gap-[7px] flex-1 min-w-0">
          <span className="text-[15px] sm:text-[18px] font-semibold text-ink tracking-[-0.3px]">{name}</span>
          <span className="flex items-center gap-2 flex-wrap">
            {startDate && (
              <span className="text-[15px] font-semibold text-primary whitespace-nowrap">
                {startDate} 개강
              </span>
            )}
            {/* 데스크톱: 설명을 개강 옆에 인라인으로 */}
            {metaText && (
              <span className="hidden sm:inline text-[14px] text-body leading-[1.5] min-w-0">{metaText}</span>
            )}
          </span>
        </span>
        <Badge tone={open ? "success" : "neutral"} dot={open}>
          {status}
        </Badge>
        <ChevronRight size={20} className="text-muted-soft flex-shrink-0" />
      </span>
      {/* 모바일: 설명을 전체 폭으로 아래에 (좁은 컬럼에서 3줄로 감기는 것 방지) */}
      {metaText && (
        <span className="sm:hidden block text-[14px] text-body leading-[1.5] mt-[7px]">{metaText}</span>
      )}
    </>
  );

  const commonClass = [
    "block w-full py-[18px] px-[12px] text-left transition-colors",
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
