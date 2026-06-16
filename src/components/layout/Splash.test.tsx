import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Splash } from "./Splash";

describe("Splash (전체화면 로딩)", () => {
  it("학원명과 부제를 보여준다", () => {
    render(<Splash />);
    expect(screen.getByText("성요셉목수학교")).toBeInTheDocument();
    expect(screen.getByText("요셉인테리어기술건축학원")).toBeInTheDocument();
  });

  it("스크린리더용 로딩 안내(role=status)를 노출한다", () => {
    render(<Splash />);
    expect(screen.getByRole("status")).toHaveTextContent(/불러오는 중/);
  });

  it("지붕 마크 SVG를 렌더한다", () => {
    const { container } = render(<Splash />);
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
