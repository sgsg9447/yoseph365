"use client";

import { useEffect } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { RoofMark } from "@/components/layout/RoofMark";

const bodyStyle = {
  margin: 0,
  minHeight: "100vh",
  fontFamily:
    "Pretendard Variable, Pretendard, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  color: "#1a1a18",
  background:
    "radial-gradient(900px 460px at 50% 8%, color-mix(in srgb, #2f6fd6 7%, #fff) 0%, rgba(255,255,255,0) 60%), #fbfbf8",
} satisfies CSSProperties;

const pageStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "48px 24px",
  textAlign: "center",
  boxSizing: "border-box",
} satisfies CSSProperties;

const buttonStyle = {
  display: "inline-flex",
  height: 52,
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 12,
  border: "1px solid #2f6fd6",
  background: "#2f6fd6",
  color: "#fff",
  padding: "0 24px",
  fontSize: 17,
  fontWeight: 700,
  cursor: "pointer",
} satisfies CSSProperties;

const linkStyle = {
  ...buttonStyle,
  border: "1px solid #d9d9d2",
  background: "transparent",
  color: "#1a1a18",
  textDecoration: "none",
} satisfies CSSProperties;

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ko">
      <body style={bodyStyle}>
        <title>오류가 발생했습니다 — 성요셉목수학교</title>
        <main style={pageStyle}>
          <div style={{ width: "100%", maxWidth: 600 }}>
            <RoofMark size={84} />
            <h1
              style={{
                margin: "30px 0 16px",
                fontSize: "clamp(26px, 4.4vw, 40px)",
                lineHeight: 1.3,
                letterSpacing: "-0.6px",
                wordBreak: "keep-all",
              }}
            >
              일시적인 오류가 발생했어요
            </h1>
            <p
              style={{
                margin: "0 0 36px",
                fontSize: 18,
                lineHeight: 1.7,
                color: "#44443f",
                wordBreak: "keep-all",
              }}
            >
              서버에 문제가 생겼습니다.
              <br />
              잠시 후 새로고침해 주세요.
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <Link href="/" style={linkStyle}>
                홈으로 돌아가기
              </Link>
              <button type="button" onClick={() => unstable_retry()} style={buttonStyle}>
                새로고침
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
