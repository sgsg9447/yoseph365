import { z } from "zod";
import { LEAF_CATEGORIES } from "@/lib/gallery/categories";

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

const pin4 = z.string().trim().regex(/^[0-9]{4}$/, "비밀번호는 숫자 4자리로 입력해 주세요");

// 게시판 글쓰기(공개 문의글) — 비밀글이면 PIN 필수
export const inquiryPostSchema = z
  .object({
    name: z.string().trim().min(1, "이름을 입력해 주세요").max(50),
    phone,
    category: z.enum(["국비지원", "과정문의", "기타"]),
    courseId: optText(80),
    title: z.string().trim().min(1, "제목을 입력해 주세요").max(200),
    content: z.string().trim().min(1, "문의 내용을 입력해 주세요").max(1000),
    email: optEmail,
    isSecret: z.boolean().optional().default(false),
    password: z.string().trim().optional().default(""),
  })
  .superRefine((v, ctx) => {
    if (v.isSecret && !/^[0-9]{4}$/.test(v.password)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "비밀글 비밀번호는 숫자 4자리로 입력해 주세요",
      });
    }
  });
export type InquiryPostInput = z.infer<typeof inquiryPostSchema>;

// 비밀글 열람 검증
export const verifySecretSchema = z.object({
  id: z.number().int().positive(),
  password: pin4,
});
export type VerifySecretInput = z.infer<typeof verifySecretSchema>;

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

// 관리자 — 기능사 과정 트랙(course_track) + 실기 시험일정(exam_schedule) 저장
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
// 빈 문자열("")은 null 로 정규화, 값이 있으면 YYYY-MM-DD 형식만 허용
const optDate = z
  .union([z.literal(""), z.string().regex(ISO_DATE, "날짜 형식(YYYY-MM-DD)이 올바르지 않습니다")])
  .optional()
  .default("")
  .transform((s) => (s ? s : null));
export const examRowSchema = z.object({
  round: z.string().trim().min(1, "회차를 입력해 주세요").max(20),
  applyStart: optDate,
  applyEnd: optDate,
  examStart: optDate,
  examEnd: optDate,
  // 빈 발표일은 제외하고, 남은 값은 YYYY-MM-DD 형식이어야 한다
  resultDates: z
    .array(z.string().trim())
    .max(2)
    .optional()
    .default([])
    .transform((arr) => arr.filter((s) => s.length > 0))
    .refine((arr) => arr.every((s) => ISO_DATE.test(s)), "발표일 날짜 형식이 올바르지 않습니다"),
});
export const trackSaveSchema = z.object({
  courseId: z.string().trim().min(1),
  trackId: z.string().trim().min(1),
  name: z.string().trim().min(1, "트랙명을 입력해 주세요").max(100),
  description: optStr(200),
  sessionsTotal: optInt,
  price: optInt,
  scheduleSummary: z.array(z.string().trim().min(1)).max(20).optional().default([]),
  recruitStatus: z.enum(["모집예정", "모집중", "마감"]),
  year: z.number().int().min(2000).max(2100),
  exams: z.array(examRowSchema).max(20).optional().default([]),
});
export type TrackSaveInput = z.infer<typeof trackSaveSchema>;

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

// 관리자 — 훈련사진 추가(업로드 완료된 객체 키 목록 + 카테고리)
export const trainingPhotoAddSchema = z.object({
  galleryCategory: z.enum(LEAF_CATEGORIES),
  photos: z
    .array(
      z.object({
        key: z.string().trim().min(1).max(200),
        label: z.string().trim().max(100).default(""),
      }),
    )
    .min(1, "업로드할 사진이 없습니다")
    .max(50, "한 번에 최대 50장까지 올릴 수 있습니다"),
});
export type TrainingPhotoAddInput = z.infer<typeof trainingPhotoAddSchema>;

// 관리자 — 훈련사진 메인 노출 토글
export const featuredToggleSchema = z.object({
  id: z.number().int().positive(),
  on: z.boolean(),
});
export type FeaturedToggleInput = z.infer<typeof featuredToggleSchema>;
