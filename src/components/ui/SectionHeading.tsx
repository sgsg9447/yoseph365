import { type ReactNode } from "react";

type Align = "left" | "center" | "right";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  sub?: string;
  align?: Align;
}

export function SectionHeading({ eyebrow, title, sub, align = "left" }: SectionHeadingProps) {
  const alignClass =
    align === "center"
      ? "text-center items-center"
      : align === "right"
        ? "text-right items-end"
        : "text-left items-start";

  return (
    <div className={`flex flex-col gap-[10px] ${alignClass}`}>
      {eyebrow && (
        <span className="text-[15px] font-bold tracking-[0.3px] text-primary">{eyebrow}</span>
      )}
      <h2
        className="font-display font-bold text-ink leading-[1.3] tracking-[-0.6px] break-keep m-0"
        style={{ fontSize: "clamp(26px, 3.4vw, 36px)" }}
      >
        {title}
      </h2>
      {sub && (
        <p className="text-[17px] text-body leading-[1.7] break-keep m-0">{sub}</p>
      )}
    </div>
  );
}
