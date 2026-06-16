import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Loading from "./loading";

describe("루트 loading (느린 페이지 이동 시 전체화면 스플래시)", () => {
  it("브랜드 스플래시(학원명 + 로딩 안내)를 렌더한다", () => {
    render(<Loading />);
    expect(screen.getByText("성요셉목수학교")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/불러오는 중/);
  });
});
