import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { Banner } from "./Banner";

// 가로 드래그(스와이프) 헬퍼 — pointerdown→move→up 시퀀스
function swipe(el: Element, fromX: number, toX: number) {
  fireEvent.pointerDown(el, { clientX: fromX, pointerId: 1 });
  fireEvent.pointerMove(el, { clientX: toX, pointerId: 1 });
  fireEvent.pointerUp(el, { clientX: toX, pointerId: 1 });
}

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

  it("초기에는 첫 슬라이드만 활성(aria-hidden=false)이다", () => {
    render(<Banner />);
    expect(
      screen.getByText("자기부담금 안내").closest("[aria-hidden]"),
    ).toHaveAttribute("aria-hidden", "false");
    expect(
      screen.getByText("고용노동부 2025년 이수자평가").closest("[aria-hidden]"),
    ).toHaveAttribute("aria-hidden", "true");
  });

  it("두번째 dot 클릭 시 A등급 슬라이드가 활성이 된다", async () => {
    render(<Banner />);
    await userEvent.click(screen.getByRole("button", { name: "슬라이드 2" }));
    expect(
      screen.getByText("고용노동부 2025년 이수자평가").closest("[aria-hidden]"),
    ).toHaveAttribute("aria-hidden", "false");
  });

  it("왼쪽으로 스와이프하면 다음 슬라이드로 넘어간다 (1 → 2 / 6)", () => {
    render(<Banner />);
    swipe(screen.getByTestId("banner-track"), 240, 40);
    expect(screen.getByText("2 / 6")).toBeInTheDocument();
  });

  it("오른쪽으로 스와이프하면 이전 슬라이드로 돌아간다 (2 → 1 / 6)", async () => {
    render(<Banner />);
    await userEvent.click(screen.getByRole("button", { name: "슬라이드 2" }));
    swipe(screen.getByTestId("banner-track"), 40, 240);
    expect(screen.getByText("1 / 6")).toBeInTheDocument();
  });

  it("첫 슬라이드에서 오른쪽으로 스와이프해도 1 / 6 을 유지한다", () => {
    render(<Banner />);
    swipe(screen.getByTestId("banner-track"), 40, 300);
    expect(screen.getByText("1 / 6")).toBeInTheDocument();
  });

  it("임계값 미만으로 살짝 끌면 슬라이드가 바뀌지 않는다", () => {
    render(<Banner />);
    swipe(screen.getByTestId("banner-track"), 200, 180);
    expect(screen.getByText("1 / 6")).toBeInTheDocument();
  });
});
