// Server component — 서브 페이지 히어로 헤더.
// 참조: HANDOFF/ui_kits/website/sections.jsx:454-466

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  sub?: string;
}

export function PageHero({ eyebrow, title, sub }: PageHeroProps) {
  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        borderBottom: "1px solid var(--color-hairline)",
      }}
    >
      {/* Atmospheric orb */}
      <div
        className="orb"
        style={{
          width: 360,
          height: 360,
          top: -160,
          right: "8%",
          background: "var(--color-gradient-sky)",
          opacity: 0.4,
        }}
      />

      <div
        className="wrap"
        style={{
          position: "relative",
          zIndex: 1,
          padding: "48px 0 40px",
          textAlign: "center",
        }}
      >
        {eyebrow && (
          <p
            style={{
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "0.3px",
              color: "var(--color-primary)",
              margin: "0 0 12px",
            }}
          >
            {eyebrow}
          </p>
        )}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 700,
            color: "var(--color-ink)",
            lineHeight: 1.25,
            letterSpacing: "-0.8px",
            margin: "0 auto",
            maxWidth: 720,
            wordBreak: "keep-all",
          }}
        >
          {title}
        </h1>
        {sub && (
          <p
            style={{
              fontSize: 17,
              color: "var(--color-body)",
              lineHeight: 1.7,
              margin: "14px auto 0",
              maxWidth: 800,
              wordBreak: "keep-all",
            }}
          >
            {sub}
          </p>
        )}
      </div>
    </section>
  );
}
