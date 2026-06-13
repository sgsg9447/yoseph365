import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "outline" | "ghost" | "dark";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
}

const sizeClasses: Record<Size, string> = {
  sm: "h-10 px-4 text-[15px]",
  md: "h-12 px-[22px] text-[17px]",
  lg: "h-14 px-[26px] text-[18px]",
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-white border border-primary hover:bg-primary-hover",
  outline:
    "bg-transparent text-ink border border-hairline-strong",
  ghost:
    "bg-transparent text-primary border border-transparent",
  dark:
    "bg-white text-ink border border-white",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth,
  leftIcon,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 rounded-button font-semibold leading-none tracking-[-0.2px] whitespace-nowrap transition active:scale-[0.98]",
        sizeClasses[size],
        variantClasses[variant],
        fullWidth ? "w-full" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {leftIcon}
      {children}
    </button>
  );
}
