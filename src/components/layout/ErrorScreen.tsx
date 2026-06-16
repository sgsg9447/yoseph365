import type { ReactNode } from "react";
import { RoofMark } from "./RoofMark";

// 에러·404 공용 단독 풀스크린 셸: 옅은 블루 wash + 중앙 정렬 + 지붕 마크 +
// 제목/설명 + 액션 슬롯. 훅이 없어 서버·클라이언트 양쪽에서 쓸 수 있다.
interface ErrorScreenProps {
  title: string;
  desc: ReactNode;
  actions: ReactNode;
}

export function ErrorScreen({ title, desc, actions }: ErrorScreenProps) {
  return (
    <div
      className="flex min-h-screen items-center justify-center text-body"
      style={{
        background:
          "radial-gradient(900px 460px at 50% 8%, color-mix(in srgb, #2f6fd6 7%, #fff) 0%, rgba(255,255,255,0) 60%), var(--color-canvas)",
      }}
    >
      <div
        className="rise flex w-full max-w-[600px] flex-col items-center px-6 text-center"
        style={{ paddingBlock: "clamp(48px, 9vw, 96px)" }}
      >
        <RoofMark size={84} className="mb-[30px]" />
        <h1
          className="mb-4 max-w-[540px] font-bold text-ink"
          style={{
            fontSize: "clamp(26px, 4.4vw, 40px)",
            lineHeight: 1.3,
            letterSpacing: "-0.6px",
            wordBreak: "keep-all",
          }}
        >
          {title}
        </h1>
        <p
          className="mb-9 max-w-[520px] text-[18px] text-body"
          style={{ lineHeight: 1.7, wordBreak: "keep-all" }}
        >
          {desc}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actions}
        </div>
      </div>
    </div>
  );
}
