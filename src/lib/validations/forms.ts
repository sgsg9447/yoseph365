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

// 관리자 — 상담문의 상태 변경
export const inquiryStatusSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["답변대기", "답변완료"]),
});
export type InquiryStatusInput = z.infer<typeof inquiryStatusSchema>;

// 관리자 — 상담문의 메모(admin_memo) 갱신
export const inquiryMemoSchema = z.object({
  id: z.number().int().positive(),
  memo: z.string().trim().max(2000, "메모는 2000자 이내로 입력해 주세요"),
});
export type InquiryMemoInput = z.infer<typeof inquiryMemoSchema>;

// 관리자 — 과정(course) 표시 데이터 편집
const optStr = (max: number) => z.string().trim().max(max).optional().default("");
const optInt = z.number().int().min(0).nullable().optional().default(null);
export const courseEditSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1, "과정명을 입력해 주세요").max(100),
  summary: optStr(500),
  skills: z.array(z.string().trim().min(1)).max(30).optional().default([]),
  tuition: optStr(50),
  selfPay: optStr(50),
  sessionsTotal: optInt,
  sessionHours: optStr(20),
  totalHours: optInt,
  recruitStatus: z.enum(["모집예정", "모집중", "마감"]),
});
export type CourseEditInput = z.infer<typeof courseEditSchema>;

// 관리자 — 신청안내(course_apply_info) 저장
const strList = z.array(z.string().trim().min(1)).max(50).optional().default([]);
export const applyInfoSchema = z.object({
  courseId: z.string().trim().min(1),
  qualifications: strList,
  applyMethod: strList,
  recruitPeriod: z.string().trim().max(200).optional().default(""),
  trainingPeriod: z.string().trim().max(200).optional().default(""),
  trainingTime: strList,
  capacity: z.string().trim().max(100).optional().default(""),
  cost: z.string().trim().max(100).optional().default(""),
  costNotes: strList,
  steps: strList,
  exclusions: strList,
});
export type ApplyInfoInput = z.infer<typeof applyInfoSchema>;

// 관리자 — 커리큘럼(회차표) 저장
export const curriculumRowSchema = z.object({
  round: z.number().int().min(1),
  unit: z.string().trim().max(200).optional().default(""),
  contents: z.array(z.string().trim().min(1)).max(30).optional().default([]),
  hours: z.number().int().min(0).nullable().optional().default(null),
  place: z.string().trim().max(100).optional().default(""),
});
export const curriculumSaveSchema = z.object({
  courseId: z.string().trim().min(1),
  rows: z.array(curriculumRowSchema).max(100),
});
export type CurriculumSaveInput = z.infer<typeof curriculumSaveSchema>;

// 관리자 — 공지 작성
export const noticeCreateSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해 주세요").max(200),
  body: z.string().max(50000).optional().default(""),
  pinned: z.boolean().optional().default(false),
});
export type NoticeCreateInput = z.infer<typeof noticeCreateSchema>;

// 관리자 — 공지 수정(작성 필드 + id)
export const noticeUpdateSchema = noticeCreateSchema.extend({
  id: z.number().int().positive(),
});
export type NoticeUpdateInput = z.infer<typeof noticeUpdateSchema>;

// 이벤트 트래킹(/api/track) — 범용 기획 지표 로깅
export const trackEventSchema = z.object({
  name: z.string().trim().min(1).max(50),
  courseId: z.string().trim().max(80).optional(),
});
export type TrackEventInput = z.infer<typeof trackEventSchema>;
