import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { ConsultSheet } from "./ConsultSheet";

describe("ConsultSheet", () => {
  it("consult 모드: 상담 신청 후 완료 메시지 표시", async () => {
    render(<ConsultSheet open mode="consult" onClose={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: /상담 신청하기/ }));
    expect(screen.getByText(/접수되었어요|안내해 드립니다/)).toBeInTheDocument();
  });
  it("inquiry 모드: 강좌 선택 토글이 동작한다", async () => {
    render(<ConsultSheet open mode="inquiry" onClose={() => {}} />);
    const first = screen.getByLabelText(/집수리과정/);
    await userEvent.click(first);
    expect(first).toBeChecked();
  });
});
