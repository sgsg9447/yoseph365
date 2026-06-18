import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterPills } from "./FilterPills";

describe("FilterPills", () => {
  const items = ["최근 30일", "최근 7일", "전체"];

  it("active로 지정한 칩이 처음에 눌린 상태(aria-pressed)다", () => {
    render(<FilterPills items={items} active="최근 30일" />);
    expect(screen.getByRole("button", { name: "최근 30일" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "최근 7일" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("다른 칩을 클릭하면 그 칩이 눌리고 이전 칩은 해제된다", async () => {
    const user = userEvent.setup();
    render(<FilterPills items={items} active="최근 30일" />);

    await user.click(screen.getByRole("button", { name: "최근 7일" }));

    expect(screen.getByRole("button", { name: "최근 7일" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "최근 30일" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("클릭 시 onChange가 선택한 항목으로 호출된다", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FilterPills items={items} active="최근 30일" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "전체" }));

    expect(onChange).toHaveBeenCalledWith("전체");
  });
});
