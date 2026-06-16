import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import NotFound from "./not-found";

describe("not-found 페이지 (404)", () => {
  it("404 제목과 안내를 보여준다", () => {
    render(<NotFound />);
    expect(
      screen.getByRole("heading", { name: /페이지를 찾을 수 없습니다/ }),
    ).toBeInTheDocument();
  });

  it("홈으로 돌아가기 링크(href=/)를 제공한다", () => {
    render(<NotFound />);
    const home = screen.getByRole("link", { name: /홈으로 돌아가기/ });
    expect(home).toHaveAttribute("href", "/");
  });

  it("새로고침 버튼은 없다(404는 숨김)", () => {
    render(<NotFound />);
    expect(
      screen.queryByRole("button", { name: /새로고침/ }),
    ).not.toBeInTheDocument();
  });
});
