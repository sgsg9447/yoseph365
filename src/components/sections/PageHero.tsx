// Server component — 서브 페이지 히어로 헤더.
// 참조: HANDOFF/ui_kits/website/sections.jsx:454-466

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  sub?: string;
  subMobileOneLine?: boolean;
  subMobileLines?: string[];
}

export function PageHero({
  eyebrow,
  title,
  sub,
  subMobileOneLine = false,
  subMobileLines,
}: PageHeroProps) {
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
          paddingTop: 48,
          paddingBottom: 40,
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
            wordBreak: "normal",
            overflowWrap: "anywhere",
          }}
        >
          {title}
        </h1>
        {sub && (
          <p
            style={{
              color: "var(--color-body)",
              fontSize: subMobileOneLine ? "clamp(9.5px, 3vw, 17px)" : 17,
              lineHeight: subMobileOneLine ? 1.5 : 1.7,
              margin: "14px auto 0",
              maxWidth: 800,
              wordBreak: "normal",
              overflowWrap: "anywhere",
              whiteSpace: subMobileOneLine ? "nowrap" : undefined,
            }}
          >
            {subMobileLines ? (
              <>
                <span className="hidden sm:inline">{sub}</span>
                <span className="block sm:hidden">
                  {subMobileLines.map((line, i) => (
                    <span key={i} style={{ display: "block" }}>
                      {line}
                    </span>
                  ))}
                </span>
              </>
            ) : (
              sub
            )}
          </p>
        )}
      </div>
    </section>
  );
}
