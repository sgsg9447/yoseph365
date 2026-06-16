import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// URL 공유(카카오톡·네이버 등 Open Graph) 시 노출되는 미리보기 이미지.
// 브랜드 마크(파란 쐐기) + 워드마크 텍스트를 합쳐 "텍스트까지 있는" 풀 로고로 렌더한다.
// 마크는 폰트가 필요 없는 SVG 패스, 텍스트는 디자인 시점에 래스터화된 logo-primary.png를
// 그대로 합성하므로 한글 폰트를 빌드 타임에 따로 로드할 필요가 없다.

export const alt = "성요셉목수학교 — 국비지원 목공·집수리·인테리어 직업훈련";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 로고 마크(Logo 컴포넌트의 <g>와 동일 — 색/형태 그대로). 텍스트 없는 아이콘 부분.
const MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 190" width="190" height="190"><g transform="scale(1.97917)" fill="none" stroke="#2f6fd6" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"><path d="M48 18 L16 82"/><path d="M48 18 L80 82"/><line x1="30" y1="84" x2="66" y2="84" opacity="0.34"/></g></svg>`;

export default async function Image() {
  const wordmark = await readFile(
    join(process.cwd(), "public/logo/logo-primary.png"),
  );
  const wordmarkSrc = `data:image/png;base64,${wordmark.toString("base64")}`;
  const markSrc = `data:image/svg+xml;base64,${Buffer.from(MARK_SVG).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={markSrc} width={200} height={200} alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={wordmarkSrc} width={760} height={183} alt="" />
        </div>
      </div>
    ),
    { ...size },
  );
}
