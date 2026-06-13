"use client";

// '문의 남기기' 버튼 — useConsult 사용을 위해 'use client'.

import { Button } from "@/components/ui/Button";
import { useConsult } from "@/components/layout/SiteShell";

export function InquiryWriteButton() {
  const { openConsult } = useConsult();
  return (
    <Button variant="primary" size="md" onClick={() => openConsult("inquiry")}>
      문의 남기기
    </Button>
  );
}
