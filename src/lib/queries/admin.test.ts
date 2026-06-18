import { describe, it, expect } from "vitest";
import {
  toEnrollmentView,
  toInquiryView,
  inquiryStatusLabel,
  countPending,
  countNewInquiries,
  toCourseClickViews,
} from "./admin";

const appRow = {
  id: 1, name: "김지희", phone: "01012345678",
  selected_courses: ["목공 기초 종합반", "집수리 실무반"],
  status: "신규" as const, created_at: "2026-06-15T02:00:00Z",
};

describe("toEnrollmentView", () => {
  it("이름·전화 마스킹 + 첫 과정 + 날짜 포맷", () => {
    const v = toEnrollmentView(appRow);
    expect(v.name).toBe("김O희");
    expect(v.phone).toBe("010-1234-••••");
    expect(v.course).toBe("목공 기초 종합반");
    expect(v.date).toBe("2026.06.15");
    expect(v.status).toBe("신규");
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
