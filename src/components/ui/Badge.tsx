type Tone = "neutral" | "ink" | "success" | "solid" | "soft";

interface BadgeProps {
  children: React.ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}

const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface-strong text-body-strong",
  ink: "bg-surface-strong text-ink",
  success: "bg-success-soft text-success",
  solid: "bg-primary text-white",
  soft: "bg-primary-soft text-primary",
};

export function Badge({ children, tone = "neutral", dot, className }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 text-[13px] font-semibold leading-[1.3] px-3 py-[5px] rounded-full whitespace-nowrap",
        toneClasses[tone],
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {dot && (
        <span
          className="w-[6px] h-[6px] rounded-full bg-current flex-shrink-0"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
