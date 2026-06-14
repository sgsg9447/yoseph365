import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PhotoSlot } from "./PhotoSlot";

describe("PhotoSlot", () => {
  it("src가 없으면 placeholder 라벨을 보여주고 이미지는 없다", () => {
    render(<PhotoSlot label="목공 실습" />);
    expect(screen.getByText("목공 실습")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("src가 있으면 label을 alt로 한 이미지를 보여준다", () => {
    render(<PhotoSlot src="/photos/training/01.jpg" label="목공 실습" />);
    expect(screen.getByRole("img", { name: "목공 실습" })).toBeInTheDocument();
    // 이미지 모드에서는 placeholder 라벨 텍스트를 따로 렌더하지 않는다
    expect(screen.queryByText("목공 실습")).not.toBeInTheDocument();
  });
});
