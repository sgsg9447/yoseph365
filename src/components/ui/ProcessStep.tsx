interface ProcessStepProps {
  number: number | string;
  title: string;
  desc?: string;
}

export function ProcessStep({ number, title, desc }: ProcessStepProps) {
  return (
    <div className="flex items-start gap-[14px]">
      <span className="flex-shrink-0 w-[34px] h-[34px] grid place-items-center rounded-full bg-primary text-white text-[16px] font-bold">
        {number}
      </span>
      <span className="flex flex-col gap-1 pt-1">
        <span className="text-[17px] font-semibold text-ink tracking-[-0.2px]">{title}</span>
        {desc && (
          <span className="text-[15px] text-muted leading-[1.5] break-keep">{desc}</span>
        )}
      </span>
    </div>
  );
}
