interface ProgressBarProps {
  pct: number;
  thick?: boolean;
}

export function ProgressBar({ pct, thick }: ProgressBarProps) {
  const height = thick ? 14 : 10;
  return (
    <div
      className="w-full bg-hairline-soft rounded-full overflow-hidden"
      style={{ height }}
    >
      <div
        className="bg-primary rounded-full h-full"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}
