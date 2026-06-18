import { describe, it, expect } from "vitest";
import { applicationSchema, consultSchema, applicationMemoSchema } from "./forms";

describe("applicationMemoSchema", () => {
  it("유효한 id·메모를 통과시킨다", () => {
    expect(applicationMemoSchema.safeParse({ id: 1, memo: "전화 연결 예정" }).success).toBe(true);
  });
  it("빈 메모도 허용(메모 삭제)", () => {
    expect(applicationMemoSchema.safeParse({ id: 1, memo: "" }).success).toBe(true);
  });
  it("id가 양의 정수가 아니면 실패", () => {
    expect(applicationMemoSchema.safeParse({ id: 0, memo: "x" }).success).toBe(false);
    expect(applicationMemoSchema.safeParse({ id: 1.5, memo: "x" }).success).toBe(false);
  });
  it("메모가 2000자를 넘으면 실패", () => {
    expect(applicationMemoSchema.safeParse({ id: 1, memo: "가".repeat(2001) }).success).toBe(false);
  });
});

describe("applicationSchema", () => {
  const base = { name: "홍길동", phone: "010-1234-5678", course: "평일 집수리과정", privacyAgreed: true };

  it("유효한 입력을 통과시킨다", () => {
    expect(applicationSchema.safeParse(base).success).toBe(true);
  });
  it("이름이 비면 실패", () => {
    expect(applicationSchema.safeParse({ ...base, name: " " }).success).toBe(false);
  });
  it("연락처 형식이 틀리면 실패", () => {
    expect(applicationSchema.safeParse({ ...base, phone: "1234" }).success).toBe(false);
  });
  it("하이픈 없는 연락처도 허용", () => {
    expect(applicationSchema.safeParse({ ...base, phone: "01012345678" }).success).toBe(true);
  });
  it("과정이 비면 실패", () => {
    expect(applicationSchema.safeParse({ ...base, course: "" }).success).toBe(false);
  });
  it("개인정보 미동의면 실패", () => {
    expect(applicationSchema.safeParse({ ...base, privacyAgreed: false }).success).toBe(false);
  });
  it("선택 필드(생년월일·성별 등)는 없어도 통과하고 기본값은 빈 문자열", () => {
    const r = applicationSchema.safeParse(base);
    expect(r.success && r.data.birth).toBe("");
  });
});

describe("consultSchema", () => {
  const base = { name: "김상담", phone: "010-9876-5432" };
  it("유효한 입력을 통과(관심과정 선택)", () => {
    expect(consultSchema.safeParse({ ...base, courseId: "course_weekday_repair" }).success).toBe(true);
  });
  it("관심과정 없이도 통과", () => {
    const r = consultSchema.safeParse(base);
    expect(r.success && r.data.courseId).toBe("");
  });
  it("이메일과 추가문의사항은 선택값으로 받는다", () => {
    const r = consultSchema.safeParse({
      ...base,
      email: "test@example.com",
      message: "주말 과정 상담 부탁드립니다.",
    });
    expect(r.success && r.data.email).toBe("test@example.com");
    expect(r.success && r.data.message).toBe("주말 과정 상담 부탁드립니다.");
  });
  it("이메일이 있으면 형식이 맞아야 한다", () => {
    expect(consultSchema.safeParse({ ...base, email: "not-email" }).success).toBe(false);
  });
  it("연락처 형식이 틀리면 실패", () => {
    expect(consultSchema.safeParse({ ...base, phone: "abc" }).success).toBe(false);
  });
});
