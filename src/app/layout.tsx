import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "성요셉목수학교 — 국비지원 목공·집수리·인테리어 직업훈련",
  description:
    "내일배움카드(국민내일배움카드) 국비지원 목공·집수리·인테리어 직업훈련. 자격 확인부터 과정 안내까지 전화 한 통으로.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        {/* 로고 워드마크 전용 — IBM Plex Sans KR (Logo 컴포넌트 텍스트에만 사용).
            App Router 루트 레이아웃의 <head> 폰트 링크는 전 페이지에 적용되므로
            Pages Router용 no-page-custom-font 규칙은 여기선 오탐이다. */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@500;700&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
