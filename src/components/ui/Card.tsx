import { type HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  padding?: number | string;
}

export function Card({
  children,
  interactive,
  padding = 20,
  className,
  style,
  ...rest
}: CardProps) {
  return (
    <div
      className={[
        "bg-surface-card border border-hairline rounded-lg shadow-card",
        interactive
          ? "transition hover:-translate-y-0.5 hover:border-hairline-strong hover:shadow-card-hover cursor-pointer"
          : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ padding, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}
