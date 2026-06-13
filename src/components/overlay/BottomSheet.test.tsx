import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { BottomSheet } from "./BottomSheet";

describe("BottomSheet", () => {
  it("open=false면 내용이 렌더되지 않는다", () => {
    render(<BottomSheet open={false} onClose={() => {}} title="제목">내용</BottomSheet>);
    expect(screen.queryByText("내용")).not.toBeInTheDocument();
  });
  it("open=true면 제목과 내용을 보여준다", () => {
    render(<BottomSheet open onClose={() => {}} title="제목">내용</BottomSheet>);
    expect(screen.getByText("제목")).toBeInTheDocument();
    expect(screen.getByText("내용")).toBeInTheDocument();
  });
  it("닫기 버튼 클릭 시 onClose 호출", async () => {
    const onClose = vi.fn();
    render(<BottomSheet open onClose={onClose} title="제목">내용</BottomSheet>);
    await userEvent.click(screen.getByRole("button", { name: /닫기/ }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
