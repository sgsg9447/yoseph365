import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { Banner } from "./Banner";

describe("Banner", () => {
  it("초기 인디케이터는 1 / 6", () => {
    render(<Banner />);
    expect(screen.getByText("1 / 6")).toBeInTheDocument();
  });
  it("두번째 dot 클릭 시 인디케이터가 2 / 6", async () => {
    render(<Banner />);
    await userEvent.click(screen.getByRole("button", { name: "슬라이드 2" }));
    expect(screen.getByText("2 / 6")).toBeInTheDocument();
  });
});
