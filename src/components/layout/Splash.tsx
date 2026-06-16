import { RoofMark } from "./RoofMark";

// 전체화면 브랜드 로딩. 루트 app/loading.tsx 의 Suspense fallback 으로 쓰여,
// 느린(동적·미프리페치) 페이지 이동 시에만 화면 전체에 나타난다.
// splash-fade: 빠른 로딩에서 깜빡이지 않도록 0.25s 지연 후 서서히 등장(globals.css).
export function Splash() {
  return (
    <div
      className="splash-fade flex min-h-screen flex-col items-center justify-center gap-[26px] px-6 py-10 text-center"
      style={{
        background:
          "radial-gradient(900px 460px at 50% 30%, color-mix(in srgb, #2f6fd6 6%, #fff) 0%, rgba(255,255,255,0) 60%), var(--color-canvas)",
      }}
    >
      <RoofMark size={104} />
      <div className="flex flex-col items-center gap-1.5">
        <p
          className="font-bold text-ink"
          style={{ fontSize: "21px", letterSpacing: "-0.5px" }}
        >
          성요셉목수학교
        </p>
        <p
          className="font-medium text-muted"
          style={{ fontSize: "14.5px", letterSpacing: "-0.2px" }}
        >
          요셉인테리어기술건축학원
        </p>
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        페이지를 불러오는 중입니다.
      </span>
    </div>
  );
}
