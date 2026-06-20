"use client";

import { Phone } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { useConsult } from "@/components/layout/SiteShell";
import { PHONE_MAIN } from "@/lib/data/site";

export function PhotosEmptyCta() {
  const { openConsult } = useConsult();
  return (
    <div style={{ textAlign: "center", padding: "48px 0" }}>
      <p className="text-muted text-[15px]">아직 등록된 훈련 사진이 없습니다.</p>
      <p className="text-muted text-[14px]" style={{ marginTop: 6, marginBottom: 18 }}>
        궁금한 점은 상담으로 편하게 문의해 주세요.
      </p>
      <div className="flex justify-center">
        <Button
          variant="primary"
          size="lg"
          leftIcon={<Phone size={20} strokeWidth={2.2} />}
          onClick={() => openConsult("consult")}
        >
          전화로 무료 상담
        </Button>
      </div>
      <a
        href={`tel:${PHONE_MAIN}`}
        className="text-[18px] font-bold text-primary no-underline"
        style={{ display: "inline-block", marginTop: 12 }}
      >
        {PHONE_MAIN}
      </a>
    </div>
  );
}
