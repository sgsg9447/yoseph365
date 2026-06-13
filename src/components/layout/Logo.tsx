// Brand logo — inlined SVG so the page-loaded IBM Plex Sans KR webfont applies
// to the wordmark text (an <img src=svg> would not pick up page fonts).
// Source: design 핸드오프 new-roof-ibm-black.svg. Colors/typeface used as-is — do not recolor.
// Scale via className height (e.g. "h-9 w-auto"); width follows the viewBox aspect ratio.

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 746 190"
      className={className}
      role="img"
      aria-label="성요셉목수학교"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        transform="scale(1.97917)"
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
      <text
        x="216"
        y="96"
        fontFamily="'IBM Plex Sans KR', sans-serif"
        fontWeight={700}
        fontSize={72}
        letterSpacing="-0.72"
        fill="#1a1a18"
      >
        <tspan fontWeight={500} fontSize={45}>
          (주)
        </tspan>
        성요셉 목수학교
      </text>
      <text
        x="216"
        y="157"
        fontFamily="'IBM Plex Sans KR', sans-serif"
        fontWeight={500}
        fontSize={37.5}
        fill="#1a1a18"
        textLength={529}
        lengthAdjust="spacing"
      >
        요셉인테리어기술건축학원
      </text>
    </svg>
  );
}
