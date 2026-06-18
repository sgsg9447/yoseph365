import { describe, it, expect } from "vitest";
import {
  toEnrollmentView,
  toInquiryView,
  inquiryStatusLabel,
  countPending,
  countNewInquiries,
  toCourseClickViews,
  type EnrollmentView,
} from "./admin";
import { filterEnrollments } from "@/lib/admin/enroll";

const appRow = {
  id: 1, name: "김지희", phone: "01012345678",
  selected_courses: ["목공 기초 종합반", "집수리 실무반"],
  status: "신규" as const, created_at: "2026-06-15T02:00:00Z",
  admin_memo: "전화 연결 안 됨",
};

describe("toEnrollmentView", () => {
  it("관리자용 — 이름·연락처를 마스킹하지 않고 그대로 노출한다", () => {
    const v = toEnrollmentView(appRow);
    expect(v.name).toBe("김지희");
    expect(v.phone).toBe("01012345678");
    expect(v.date).toBe("2026.06.15");
    expect(v.status).toBe("신규");
  });

  it("선택 과정 전체(courses)와 메모를 노출한다", () => {
    const v = toEnrollmentView(appRow);
    expect(v.courses).toEqual(["목공 기초 종합반", "집수리 실무반"]);
    expect(v.course).toBe("목공 기초 종합반");
    expect(v.memo).toBe("전화 연결 안 됨");
  });

  it("메모(admin_memo)가 null이면 빈 문자열", () => {
    const v = toEnrollmentView({ ...appRow, admin_memo: null });
    expect(v.memo).toBe("");
  });
});

describe("filterEnrollments", () => {
  const rows: EnrollmentView[] = [
    { id: 1, name: "A", course: "목공", courses: ["목공"], phone: "p", date: "d", status: "신규", memo: "" },
    { id: 2, name: "B", course: "집수리", courses: ["집수리", "목공"], phone: "p", date: "d", status: "등록확인", memo: "" },
    { id: 3, name: "C", course: "인테리어", courses: ["인테리어"], phone: "p", date: "d", status: "신규", memo: "" },
  ];

  it("전체/전체면 모두 통과", () => {
    expect(filterEnrollments(rows, { status: "전체", course: "전체" })).toHaveLength(3);
  });

  it("상태로 필터링", () => {
    const r = filterEnrollments(rows, { status: "신규", course: "전체" });
    expect(r.map((x) => x.id)).toEqual([1, 3]);
  });

  it("과정으로 필터링 — 선택 과정에 포함되면 통과", () => {
    const r = filterEnrollments(rows, { status: "전체", course: "목공" });
    expect(r.map((x) => x.id)).toEqual([1, 2]);
  });

  it("상태+과정 동시 필터링", () => {
    const r = filterEnrollments(rows, { status: "신규", course: "목공" });
    expect(r.map((x) => x.id)).toEqual([1]);
  });
});

describe("inquiryStatusLabel", () => {
  it("답변대기→신규, 답변완료→완료", () => {
    expect(inquiryStatusLabel("답변대기")).toBe("신규");
    expect(inquiryStatusLabel("답변완료")).toBe("완료");
  });
});

describe("toInquiryView", () => {
  const baseRow = {
    id: 9, name: "박민수", phone: "01055556666",
    category: "국비지원" as const,
    content: "문의합니다", status: "답변대기" as const,
    created_at: "2026-06-17T05:00:00Z",
  };

  it("마스킹 + 라벨 매핑 + interest=category (과정명 없음)", () => {
    const v = toInquiryView(baseRow);
    expect(v.name).toBe("박O수");
    expect(v.phone).toBe("010-5555-••••");
    expect(v.interest).toBe("국비지원");
    expect(v.status).toBe("신규");
    expect(v.message).toBe("문의합니다");
  });

  it("과정명 전달 시 interest=과정명", () => {
    const v = toInquiryView(baseRow, "목공 기초 종합반");
    expect(v.interest).toBe("목공 기초 종합반");
  });
});

describe("카운트 도출", () => {
  it("countPending = status '신규' 개수", () => {
    expect(countPending([{ status: "신규" }, { status: "상담중" }, { status: "신규" }])).toBe(2);
  });
  it("countNewInquiries = '답변대기' 개수", () => {
    expect(countNewInquiries([{ status: "답변대기" }, { status: "답변완료" }])).toBe(1);
  });
});

describe("toCourseClickViews", () => {
  const courses = [
    { id: "a", name: "목공 기초" },
    { id: "b", name: "집수리" },
    { id: "c", name: "인테리어" },
  ];

  it("클릭 데이터 없으면 모두 clicks=0, pct=0 (집계 전)", () => {
    const views = toCourseClickViews(courses);
    expect(views.map((v) => v.clicks)).toEqual([0, 0, 0]);
    expect(views.map((v) => v.pct)).toEqual([0, 0, 0]);
    expect(views[0]).toMatchObject({ id: "a", name: "목공 기초" });
  });

  it("최다 클릭 과정이 pct 100, 나머지는 비율로 반올림", () => {
    const views = toCourseClickViews(courses, { a: 100, b: 50, c: 0 });
    expect(views.find((v) => v.id === "a")).toMatchObject({ clicks: 100, pct: 100 });
    expect(views.find((v) => v.id === "b")).toMatchObject({ clicks: 50, pct: 50 });
    expect(views.find((v) => v.id === "c")).toMatchObject({ clicks: 0, pct: 0 });
  });

  it("맵에 없는 과정은 clicks 0으로 처리", () => {
    const views = toCourseClickViews(courses, { a: 30 });
    expect(views.find((v) => v.id === "b")?.clicks).toBe(0);
    expect(views.find((v) => v.id === "a")?.pct).toBe(100);
  });
});
