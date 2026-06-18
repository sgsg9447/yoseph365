import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("open=false면 아무것도 렌더하지 않는다", () => {
    render(
      <Modal open={false} onClose={() => {}} title="제목">
        <p>내용</p>
      </Modal>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("내용")).not.toBeInTheDocument();
  });

  it("open=true면 제목과 내용을 보여준다", () => {
    render(
      <Modal open onClose={() => {}} title="신청 상세">
        <p>내용</p>
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("신청 상세")).toBeInTheDocument();
    expect(screen.getByText("내용")).toBeInTheDocument();
  });

  it("닫기 버튼을 누르면 onClose가 호출된다", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal open onClose={onClose} title="t">
        <p>내용</p>
      </Modal>,
    );
    await user.click(screen.getByRole("button", { name: "닫기" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Esc 키를 누르면 onClose가 호출된다", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal open onClose={onClose} title="t">
        <p>내용</p>
      </Modal>,
    );
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
