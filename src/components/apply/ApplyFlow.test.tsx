import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { ApplyFlow } from "@/components/apply/ApplyFlow";

describe("ApplyFlow", () => {
  it("모집안내에서 '확인했어요'를 누르면 신청서 단계로 간다", async () => {
    render(<ApplyFlow course="건축목공 입문과정" />);
    // 단계 표시기 nav 안에서 '모집안내' 레이블을 확인
    const nav = screen.getByRole("navigation", { name: "신청 진행 단계" });
    expect(within(nav).getByText("모집안내")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /신청서 작성하기/ }));
    expect(screen.getByText(/성명/)).toBeInTheDocument();
  });
  it("동의 전에는 제출이 완료로 넘어가지 않는다", async () => {
    render(<ApplyFlow course="건축목공 입문과정" />);
    await userEvent.click(screen.getByRole("button", { name: /신청서 작성하기/ }));
    await userEvent.click(screen.getByRole("button", { name: /신청서 제출하기/ }));
    expect(screen.queryByText(/접수가 완료/)).not.toBeInTheDocument();
  });
});
