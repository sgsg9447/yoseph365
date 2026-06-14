import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ConsultSheet } from "./ConsultSheet";

// 서버 액션·Supabase 클라이언트는 테스트 환경에서 모킹
vi.mock("@/lib/actions/submit", () => ({
  submitConsult: vi.fn(async () => ({ ok: true })),
  submitApplication: vi.fn(async () => ({ ok: true })),
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [] }) }) }),
    }),
  }),
}));

describe("ConsultSheet", () => {
  it("consult 모드: 이름·연락처 입력 후 상담 신청하면 완료 메시지 표시", async () => {
    render(<ConsultSheet open mode="consult" onClose={() => {}} />);
    await userEvent.type(screen.getByPlaceholderText("홍길동"), "홍길동");
    await userEvent.type(screen.getByPlaceholderText("010-0000-0000"), "010-1234-5678");
    await userEvent.click(screen.getByRole("button", { name: /상담 신청하기/ }));
    expect(
      await screen.findByText(/접수되었어요|안내해 드립니다/),
    ).toBeInTheDocument();
  });
  it("inquiry 모드: 강좌 선택 토글이 동작한다", async () => {
    render(<ConsultSheet open mode="inquiry" onClose={() => {}} />);
    const first = screen.getByLabelText(/집수리과정/);
    await userEvent.click(first);
    expect(first).toBeChecked();
  });
});
