import { describe, it, expect } from "vitest";
import {
  applicationSchema,
  consultSchema,
  applicationMemoSchema,
  applicationStatusSchema,
  courseEditSchema,
  inquiryStatusSchema,
  inquiryMemoSchema,
  noticeCreateSchema,
  noticeUpdateSchema,
  curriculumSaveSchema,
  trackSaveSchema,
  applyInfoSchema,
  trainingPhotoAddSchema,
  inquiryPostSchema,
  verifySecretSchema,
} from "./forms";

describe("applyInfoSchema", () => {
  const base = {
    courseId: "course_weekday_repair",
    qualifications: ["내일배움카드 보유자", "일반"],
    applyMethod: [],
    recruitPeriod: "개강 전까지 선착순 모집",
    trainingPeriod: "26.08.24 ~ 26.10.13",
    trainingTime: ["09:00 ~ 17:40"],
    capacity: "16명",
    cost: "1,950,480원",
    costNotes: [],
    steps: ["전화 확인", "가등록", "수강신청"],
    exclusions: [],
  };
  it("유효한 입력 통과", () => {
    expect(applyInfoSchema.safeParse(base).success).toBe(true);
  });
  it("배열·문자 기본값 허용(부분 입력)", () => {
    expect(applyInfoSchema.safeParse({ courseId: "c" }).success).toBe(true);
  });
  it("courseId 없으면 실패", () => {
    expect(applyInfoSchema.safeParse({ ...base, courseId: "" }).success).toBe(false);
  });
});

describe("curriculumSaveSchema", () => {
  const base = {
    courseId: "course_weekday_carpentry",
    rows: [
      { round: 1, unit: "목공이론", contents: ["오리엔테이션"], hours: 6, place: "강의실" },
      { round: 2, unit: "", contents: [], hours: null, place: "" },
    ],
  };
  it("유효한 입력 통과", () => {
    expect(curriculumSaveSchema.safeParse(base).success).toBe(true);
  });
  it("courseId 없으면 실패", () => {
    expect(curriculumSaveSchema.safeParse({ ...base, courseId: "" }).success).toBe(false);
  });
  it("round가 1 미만이면 실패", () => {
    expect(
      curriculumSaveSchema.safeParse({
        ...base,
        rows: [{ round: 0, unit: "x", contents: [], hours: null, place: "" }],
      }).success,
    ).toBe(false);
  });
});

describe("trackSaveSchema", () => {
  const base = {
    courseId: "course_architecture_certificate",
    trackId: "track_architecture_woodwork",
    name: "건축목공기능사",
    description: "건축목공기능사 속성 대비반",
    sessionsTotal: 5,
    price: 600000,
    scheduleSummary: ["4회 09:00~17:00 (1일 8시간)", "1회 09:00~14:00 (1일 5시간)"],
    recruitStatus: "마감",
    year: 2026,
    exams: [
      {
        round: "제1회",
        applyStart: "2026-02-02",
        applyEnd: "2026-02-05",
        examStart: "2026-03-14",
        examEnd: "2026-04-01",
        resultDates: ["2026-04-10", "2026-04-17"],
      },
    ],
  };

  it("유효한 입력 통과", () => {
    expect(trackSaveSchema.safeParse(base).success).toBe(true);
  });

  it("courseId·trackId·name이 비면 실패", () => {
    expect(trackSaveSchema.safeParse({ ...base, courseId: "" }).success).toBe(false);
    expect(trackSaveSchema.safeParse({ ...base, trackId: "" }).success).toBe(false);
    expect(trackSaveSchema.safeParse({ ...base, name: " " }).success).toBe(false);
  });

  it("정의되지 않은 모집상태는 실패", () => {
    expect(trackSaveSchema.safeParse({ ...base, recruitStatus: "종료" }).success).toBe(false);
  });

  it("가격·회차는 null 허용", () => {
    expect(
      trackSaveSchema.safeParse({ ...base, price: null, sessionsTotal: null }).success,
    ).toBe(true);
  });

  it("빈 발표일은 저장 시 제외된다", () => {
    const r = trackSaveSchema.safeParse({
      ...base,
      exams: [{ ...base.exams[0], resultDates: ["2026-04-10", ""] }],
    });
    expect(r.success && r.data.exams[0].resultDates).toEqual(["2026-04-10"]);
  });

  it("빈 날짜 문자열은 null 로 정규화된다", () => {
    const r = trackSaveSchema.safeParse({
      ...base,
      exams: [{ ...base.exams[0], applyStart: "", examEnd: "" }],
    });
    expect(r.success && r.data.exams[0].applyStart).toBe(null);
    expect(r.success && r.data.exams[0].examEnd).toBe(null);
  });

  it("잘못된 날짜 형식은 실패", () => {
    expect(
      trackSaveSchema.safeParse({
        ...base,
        exams: [{ ...base.exams[0], applyStart: "2026/02/02" }],
      }).success,
    ).toBe(false);
  });

  it("회차(round)가 비면 실패", () => {
    expect(
      trackSaveSchema.safeParse({ ...base, exams: [{ ...base.exams[0], round: " " }] }).success,
    ).toBe(false);
  });
});

describe("noticeCreateSchema", () => {
  it("제목·본문 있으면 통과", () => {
    expect(noticeCreateSchema.safeParse({ title: "여름 휴무 안내", body: "<p>내용</p>" }).success).toBe(true);
  });
  it("제목이 비면 실패", () => {
    expect(noticeCreateSchema.safeParse({ title: " ", body: "<p>x</p>" }).success).toBe(false);
  });
  it("pinned 기본 false", () => {
    const r = noticeCreateSchema.safeParse({ title: "t", body: "b" });
    expect(r.success && r.data.pinned).toBe(false);
  });
});

describe("noticeUpdateSchema", () => {
  it("id·제목·본문 있으면 통과", () => {
    expect(
      noticeUpdateSchema.safeParse({ id: 1, title: "수정 제목", body: "<p>x</p>", pinned: true })
        .success,
    ).toBe(true);
  });
  it("제목이 비면 실패", () => {
    expect(noticeUpdateSchema.safeParse({ id: 1, title: " ", body: "<p>x</p>" }).success).toBe(false);
  });
  it("id가 양의 정수가 아니면 실패", () => {
    expect(noticeUpdateSchema.safeParse({ id: 0, title: "t", body: "b" }).success).toBe(false);
  });
});

describe("inquiryStatusSchema", () => {
  it("유효한 상태값 통과", () => {
    expect(inquiryStatusSchema.safeParse({ id: 1, status: "답변완료" }).success).toBe(true);
    expect(inquiryStatusSchema.safeParse({ id: 1, status: "답변대기" }).success).toBe(true);
  });
  it("정의되지 않은 상태/잘못된 id 실패", () => {
    expect(inquiryStatusSchema.safeParse({ id: 1, status: "완료" }).success).toBe(false);
    expect(inquiryStatusSchema.safeParse({ id: 0, status: "답변완료" }).success).toBe(false);
  });
});

describe("inquiryMemoSchema", () => {
  it("id·메모 있으면 통과", () => {
    expect(inquiryMemoSchema.safeParse({ id: 1, memo: "전화 상담 완료" }).success).toBe(true);
  });
  it("빈 메모도 허용(메모 삭제)", () => {
    expect(inquiryMemoSchema.safeParse({ id: 1, memo: "" }).success).toBe(true);
  });
  it("2000자 초과·잘못된 id 실패", () => {
    expect(inquiryMemoSchema.safeParse({ id: 1, memo: "a".repeat(2001) }).success).toBe(false);
    expect(inquiryMemoSchema.safeParse({ id: 0, memo: "x" }).success).toBe(false);
  });
});

describe("courseEditSchema", () => {
  const base = {
    id: "course_weekday_repair",
    name: "평일 집수리과정",
    summary: "주택수리 NCS 종합 과정",
    skills: ["타일", "욕실시공"],
    tuition: "1,950,480원",
    selfPay: "상담 안내",
    sessionsTotal: 33,
    sessionHours: "8H",
    totalHours: 264,
    recruitStatus: "모집중",
  };

  it("유효한 입력을 통과시킨다", () => {
    expect(courseEditSchema.safeParse(base).success).toBe(true);
  });
  it("id·name이 비면 실패", () => {
    expect(courseEditSchema.safeParse({ ...base, name: " " }).success).toBe(false);
    expect(courseEditSchema.safeParse({ ...base, id: "" }).success).toBe(false);
  });
  it("회차·총시간은 null 허용", () => {
    expect(
      courseEditSchema.safeParse({ ...base, sessionsTotal: null, totalHours: null }).success,
    ).toBe(true);
  });
  it("정의되지 않은 모집상태는 실패", () => {
    expect(courseEditSchema.safeParse({ ...base, recruitStatus: "종료" }).success).toBe(false);
  });
});

describe("applicationStatusSchema", () => {
  it("유효한 상태값을 통과시킨다", () => {
    for (const status of ["신규", "상담중", "등록확인", "보류"]) {
      expect(applicationStatusSchema.safeParse({ id: 1, status }).success).toBe(true);
    }
  });
  it("정의되지 않은 상태값은 실패", () => {
    expect(applicationStatusSchema.safeParse({ id: 1, status: "취소" }).success).toBe(false);
  });
  it("id가 양의 정수가 아니면 실패", () => {
    expect(applicationStatusSchema.safeParse({ id: 0, status: "신규" }).success).toBe(false);
  });
});

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

describe("trainingPhotoAddSchema", () => {
  it("키·라벨 목록을 통과시킨다", () => {
    const r = trainingPhotoAddSchema.safeParse({
      photos: [{ key: "a.jpg", label: "현장" }, { key: "b.png", label: "" }],
    });
    expect(r.success).toBe(true);
  });
  it("빈 배열은 거부", () => {
    expect(trainingPhotoAddSchema.safeParse({ photos: [] }).success).toBe(false);
  });
  it("key 누락은 거부", () => {
    expect(
      trainingPhotoAddSchema.safeParse({ photos: [{ label: "x" }] }).success,
    ).toBe(false);
  });
  it("50장 초과는 거부", () => {
    const photos = Array.from({ length: 51 }, (_, i) => ({ key: `${i}.jpg`, label: "" }));
    expect(trainingPhotoAddSchema.safeParse({ photos }).success).toBe(false);
  });
});

describe("inquiryPostSchema", () => {
  const base = {
    name: "홍길동",
    phone: "010-1234-5678",
    category: "과정문의",
    courseId: "",
    title: "수업 시간이 궁금합니다",
    content: "오후반도 있나요?",
    email: "",
    isSecret: false,
    password: "",
  };

  it("기본 공개글을 통과시킨다", () => {
    expect(inquiryPostSchema.safeParse(base).success).toBe(true);
  });

  it("제목이 비면 거부한다", () => {
    expect(inquiryPostSchema.safeParse({ ...base, title: "" }).success).toBe(false);
  });

  it("본문이 비면 거부한다", () => {
    expect(inquiryPostSchema.safeParse({ ...base, content: "" }).success).toBe(false);
  });

  it("비밀글이면 4자리 숫자 PIN을 요구한다", () => {
    expect(
      inquiryPostSchema.safeParse({ ...base, isSecret: true, password: "" }).success,
    ).toBe(false);
    expect(
      inquiryPostSchema.safeParse({ ...base, isSecret: true, password: "12" }).success,
    ).toBe(false);
    expect(
      inquiryPostSchema.safeParse({ ...base, isSecret: true, password: "abcd" }).success,
    ).toBe(false);
    expect(
      inquiryPostSchema.safeParse({ ...base, isSecret: true, password: "1234" }).success,
    ).toBe(true);
  });

  it("잘못된 카테고리를 거부한다", () => {
    expect(inquiryPostSchema.safeParse({ ...base, category: "엉뚱" }).success).toBe(false);
  });
});

describe("verifySecretSchema", () => {
  it("숫자 4자리만 통과시킨다", () => {
    expect(verifySecretSchema.safeParse({ id: 1, password: "1234" }).success).toBe(true);
    expect(verifySecretSchema.safeParse({ id: 1, password: "12" }).success).toBe(false);
    expect(verifySecretSchema.safeParse({ id: 1, password: "abcd" }).success).toBe(false);
    expect(verifySecretSchema.safeParse({ id: 0, password: "1234" }).success).toBe(false);
  });
});
