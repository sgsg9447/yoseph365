// Server component — vertical-padding band. variant controls padding size.

interface SectionProps {
  children: React.ReactNode;
  /** "md" (56px mobile, 80px desktop) | "lg" (64px mobile, 96px desktop) */
  variant?: "md" | "lg";
  /** Optional background token class, e.g. "bg-surface-strong" */
  bg?: string;
  className?: string;
  id?: string;
}

export function Section({
  children,
  variant = "md",
  bg,
  className,
  id,
}: SectionProps) {
  const bandClass = variant === "lg" ? "band-lg" : "band";
  return (
    <section
      id={id}
      className={[bandClass, bg, className].filter(Boolean).join(" ")}
    >
      {children}
    </section>
  );
}
