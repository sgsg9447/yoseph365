import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ConsultSheet } from "./ConsultSheet";
import { submitConsult, submitInquiryPost } from "@/lib/actions/submit";

// 서버 액션·Supabase 클라이언트는 테스트 환경에서 모킹
vi.mock("@/lib/actions/submit", () => ({
  submitConsult: vi.fn(async () => ({ ok: true })),
  submitApplication: vi.fn(async () => ({ ok: true })),
  submitInquiryPost: vi.fn(async () => ({ ok: true })),
  verifyInquiryPassword: vi.fn(async () => ({ ok: false, error: "오류" })),
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
  it("inquiry 모드: 상담 기준 입력 폼을 연다", () => {
    render(<ConsultSheet open mode="inquiry" onClose={() => {}} />);
    expect(screen.getByPlaceholderText("010-0000-0000")).toBeInTheDocument();
    expect(screen.getByLabelText("이메일")).toBeInTheDocument();
    expect(screen.queryByText("수강신청 강좌")).not.toBeInTheDocument();
  });

  it("inquiry 모드: 게시판 글쓰기 폼으로 제목·내용·이름·연락처 입력 후 문의 등록하면 완료 메시지 표시", async () => {
    const submit = vi.mocked(submitInquiryPost);
    submit.mockClear();

    render(<ConsultSheet open mode="inquiry" onClose={() => {}} />);

    await userEvent.type(screen.getByPlaceholderText("문의 제목을 입력해 주세요"), "수업 시간 문의");
    await userEvent.type(screen.getByPlaceholderText("궁금하신 점을 자유롭게 남겨주세요"), "오후반도 있나요?");
    await userEvent.type(screen.getByPlaceholderText("홍길동"), "김문의");
    await userEvent.type(screen.getByPlaceholderText("010-0000-0000"), "010-1111-2222");
    await userEvent.click(screen.getByRole("button", { name: /문의 등록/ }));

    expect(submit).toHaveBeenCalled();
    expect(await screen.findByText(/문의가 등록되었어요/)).toBeInTheDocument();
  });
});
