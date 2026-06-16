// 워드마크 없는 지붕(△) 마크. 로고의 지붕 모양만 단순화한 형태로,
// 에러·404 페이지에서 공용으로 쓴다. (Logo.tsx 는 마크+워드마크 텍스트가
// 묶여 있어 그대로 재사용할 수 없어 별도 컴포넌트로 둔다.)
// stroke #2f6fd6 은 핸드오프 지정 코발트(토큰 아님) — Logo.tsx 와 동일.

interface RoofMarkProps {
  size?: number;
  className?: string;
}

export function RoofMark({ size = 84, className }: RoofMarkProps) {
  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      style={{ overflow: "visible" }}
    >
      <g
        fill="none"
        stroke="#2f6fd6"
        strokeWidth={13}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M48 18 L16 82" />
        <path d="M48 18 L80 82" />
        <line x1="30" y1="84" x2="66" y2="84" opacity={0.34} />
      </g>
    </svg>
  );
}
