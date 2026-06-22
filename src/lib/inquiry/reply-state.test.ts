import { describe, it, expect } from "vitest";
import { inquiryReplyState } from "./reply-state";

describe("inquiryReplyState", () => {
  it("작성된 답변이 있으면 answered", () => {
    expect(inquiryReplyState({ answer: "<p>답변입니다</p>", status: "답변완료" })).toBe("answered");
  });

  it("답변완료지만 답변 본문이 없으면 replied-directly(전화·방문으로 직접 답변)", () => {
    expect(inquiryReplyState({ answer: null, status: "답변완료" })).toBe("replied-directly");
    expect(inquiryReplyState({ answer: "   ", status: "답변완료" })).toBe("replied-directly");
  });

  it("답변대기면 pending", () => {
    expect(inquiryReplyState({ answer: null, status: "답변대기" })).toBe("pending");
  });
});
