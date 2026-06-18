interface FilterPillsProps {
  items: string[];
  active: string;
}

export function FilterPills({ items, active }: FilterPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className={[
            "rounded-full px-4 h-9 text-[14px] font-semibold inline-flex items-center",
            item === active
              ? "bg-primary text-white"
              : "bg-transparent text-body border border-hairline-strong",
          ].join(" ")}
        >
          {item}
        </span>
      ))}
    </div>
  );
}
