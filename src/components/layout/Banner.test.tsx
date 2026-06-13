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
  it("초기에는 훈련비 배너만 보이고 A등급 배너는 보이지 않는다", () => {
    render(<Banner />);
    expect(screen.getByText("자기부담금 안내")).toBeInTheDocument();
    expect(screen.queryByText("고용노동부 2025년 이수자평가")).not.toBeInTheDocument();
  });
  it("두번째 dot 클릭 시 A등급 배너 콘텐츠로 전환된다", async () => {
    render(<Banner />);
    await userEvent.click(screen.getByRole("button", { name: "슬라이드 2" }));
    expect(screen.getByText("고용노동부 2025년 이수자평가")).toBeInTheDocument();
    expect(screen.queryByText("자기부담금 안내")).not.toBeInTheDocument();
  });
});
