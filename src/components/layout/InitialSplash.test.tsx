import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { InitialSplash } from "./InitialSplash";

describe("InitialSplash (첫 진입 스플래시)", () => {
  it("서버 렌더(하이드레이션 전)에는 브랜드 스플래시를 출력한다", () => {
    const html = renderToStaticMarkup(<InitialSplash />);
    expect(html).toContain("성요셉목수학교");
  });

  it("하이드레이션 완료 후에는 스플래시를 제거한다", () => {
    render(<InitialSplash />);
    // 마운트(=하이드레이션) 시 effect 가 오버레이를 제거한다
    expect(screen.queryByText("성요셉목수학교")).toBeNull();
  });
});
