import { z } from "zod";

// 한국 휴대전화: 하이픈 선택
const phoneRe = /^01[016789]-?\d{3,4}-?\d{4}$/;
const phone = z.string().trim().regex(phoneRe, "연락처 형식을 확인해 주세요");
const optText = (max: number) => z.string().trim().max(max).optional().default("");
const optEmail = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : value),
  z.union([z.string().email("이메일 형식을 확인해 주세요").max(100), z.literal("")])
    .optional()
    .default(""),
);

// 수강신청(application)
export const applicationSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해 주세요").max(50),
  phone,
  course: z.string().trim().min(1, "신청 과정을 선택해 주세요"),
  birth: optText(20),
  gender: optText(4),
  address: optText(200),
  career: optText(500),
  motivation: optText(1000),
  privacyAgreed: z.literal(true, { message: "개인정보 수집·이용에 동의해 주세요" }),
});
export type ApplicationInput = z.infer<typeof applicationSchema>;

// 상담신청(inquiry) — 관심과정은 선택
export const consultSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해 주세요").max(50),
  phone,
  courseId: optText(80),
  email: optEmail,
  message: optText(1000),
});
export type ConsultInput = z.infer<typeof consultSchema>;

// 관리자 — 수강신청 메모(admin_memo) 갱신
export const applicationMemoSchema = z.object({
  id: z.number().int().positive(),
  memo: z.string().trim().max(2000, "메모는 2000자 이내로 입력해 주세요"),
});
export type ApplicationMemoInput = z.infer<typeof applicationMemoSchema>;

// 관리자 — 수강신청 상태(status) 변경
export const applicationStatusSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["신규", "상담중", "등록확인", "보류"]),
});
export type ApplicationStatusInput = z.infer<typeof applicationStatusSchema>;
