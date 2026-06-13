import { ImageIcon } from "@/components/icons";

interface PhotoSlotProps {
  ratio?: string;
  label?: string;
  radius?: number;
  className?: string;
}

export function PhotoSlot({
  ratio = "4 / 3",
  label = "수료 사진",
  radius = 12,
  className,
}: PhotoSlotProps) {
  return (
    <div
      className={[
        "bg-surface-strong border border-hairline grid place-items-center text-muted-soft",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ aspectRatio: ratio, borderRadius: radius }}
    >
      <span className="flex flex-col items-center gap-[6px]">
        <ImageIcon size={26} />
        <span className="text-[12px] font-medium">{label}</span>
      </span>
    </div>
  );
}
