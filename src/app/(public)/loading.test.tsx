import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Loading from "./loading";

describe("(public)/loading 스켈레톤", () => {
  it("스크린리더용 로딩 안내(role=status)를 노출한다", () => {
    render(<Loading />);
    expect(screen.getByRole("status")).toHaveTextContent(
      /불러오는 중/,
    );
  });

  it("과정 카드 스켈레톤 3개를 보여준다", () => {
    const { container } = render(<Loading />);
    expect(container.querySelectorAll(".sk-card")).toHaveLength(3);
  });
});
