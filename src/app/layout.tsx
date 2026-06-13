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
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
