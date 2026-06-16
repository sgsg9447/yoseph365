import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RoofMark } from "./RoofMark";

describe("RoofMark", () => {
  it("지붕 서까래 2개와 바닥 바를 그리고 장식용이라 aria-hidden 이다", () => {
    const { container } = render(<RoofMark />);

    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
    // 좌·우 서까래 path 2개 + 바닥 line 1개
    expect(container.querySelectorAll("path")).toHaveLength(2);
    expect(container.querySelector("line")).not.toBeNull();
  });

  it("size prop 으로 가로·세로 크기를 정한다", () => {
    const { container } = render(<RoofMark size={84} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "84");
    expect(svg).toHaveAttribute("height", "84");
  });
});
