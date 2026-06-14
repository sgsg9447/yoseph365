import Image from "next/image";
import { ImageIcon } from "@/components/icons";

interface PhotoSlotProps {
  /** 실제 이미지 경로. 없으면 placeholder를 표시한다. */
  src?: string;
  ratio?: string;
  label?: string;
  radius?: number;
  className?: string;
}

export function PhotoSlot({
  src,
  ratio = "4 / 3",
  label = "수료 사진",
  radius = 12,
  className,
}: PhotoSlotProps) {
  return (
    <div
      className={[
        "relative overflow-hidden bg-surface-strong border border-hairline grid place-items-center text-muted-soft",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ aspectRatio: ratio, borderRadius: radius }}
    >
      {src ? (
        <Image
          src={src}
          alt={label}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
        />
      ) : (
        <span className="flex flex-col items-center gap-[6px]">
          <ImageIcon size={26} />
          <span className="text-[12px] font-medium">{label}</span>
        </span>
      )}
    </div>
  );
}
