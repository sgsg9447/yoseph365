import { Badge } from "@/components/ui/Badge";

type Tone = "neutral" | "ink" | "success" | "solid" | "soft";

function getTone(status: string): Tone {
  if (["모집중", "승인", "등록확인", "완료", "답변완료"].includes(status)) return "success";
  if (["마감", "취소", "보류"].includes(status)) return "neutral";
  if (["상담중"].includes(status)) return "soft";
  if (["신규", "대기", "답변대기"].includes(status)) return "solid";
  return "neutral";
}

interface StatusChipProps {
  status: string;
}

export function StatusChip({ status }: StatusChipProps) {
  return <Badge tone={getTone(status)}>{status}</Badge>;
}
