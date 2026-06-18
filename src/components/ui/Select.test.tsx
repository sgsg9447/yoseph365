import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select } from "./Select";

const options = [
  { value: "전체", label: "전체 과정" },
  { value: "a", label: "평일 건축목공과정" },
];

describe("Select", () => {
  it("선택된 값의 라벨을 트리거에 보여준다", () => {
    render(<Select value="전체" options={options} onChange={() => {}} ariaLabel="과정 필터" />);
    expect(screen.getByRole("button", { name: "과정 필터" })).toHaveTextContent("전체 과정");
  });

  it("처음에는 옵션이 보이지 않다가 클릭하면 열린다", async () => {
    const user = userEvent.setup();
    render(<Select value="전체" options={options} onChange={() => {}} ariaLabel="과정 필터" />);
    expect(screen.queryByText("평일 건축목공과정")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "과정 필터" }));
    expect(screen.getByText("평일 건축목공과정")).toBeInTheDocument();
  });

  it("옵션을 고르면 onChange가 그 값으로 호출되고 닫힌다", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Select value="전체" options={options} onChange={onChange} ariaLabel="과정 필터" />);
    await user.click(screen.getByRole("button", { name: "과정 필터" }));
    await user.click(screen.getByText("평일 건축목공과정"));
    expect(onChange).toHaveBeenCalledWith("a");
    expect(screen.queryByText("평일 건축목공과정")).not.toBeInTheDocument();
  });
});
