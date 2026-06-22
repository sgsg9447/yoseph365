export type InquiryReplyState = "answered" | "replied-directly" | "pending";

/**
 * 공개 상담문의 답변 영역 상태 판정.
 * - answered: 운영자가 작성한 답변 본문이 있음 → 답변 표시
 * - replied-directly: 답변완료지만 작성 답변이 없음 → 전화·방문으로 직접 답변 처리
 * - pending: 아직 답변대기 → 준비중 안내
 */
export function inquiryReplyState(post: { answer: string | null; status: string }): InquiryReplyState {
  if (post.answer && post.answer.trim() !== "") return "answered";
  if (post.status === "답변완료") return "replied-directly";
  return "pending";
}
