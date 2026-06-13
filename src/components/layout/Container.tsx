// Server component — wraps content in the `.wrap` utility (max-width + responsive padding).

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={["wrap", className].filter(Boolean).join(" ")}>{children}</div>
  );
}
