import { Clipboard } from "@/components/icons";

interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Clipboard size={28} className="text-muted-soft" />
      <p className="text-muted text-[15px]">{message}</p>
    </div>
  );
}
