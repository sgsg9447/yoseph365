import { describe, it, expect } from "vitest";
import { buildNotificationItems } from "./notifications";

// 상담문의(inquiry)만 course_id → 과정명 매핑이 필요하다.
// 수강신청(application)의 selected_courses에는 이미 과정명(문자열)이 저장된다.
const courseNames = { "wood-101": "주중 목공 기초반" };

describe("buildNotificationItems", () => {
  it("수강신청은 selected_courses의 과정명을 그대로 라벨로 쓴다", () => {
    const items = buildNotificationItems(
      [{ id: 12, selected_courses: ["(경기도지원)평일 건축목공과정"] }],
      [],
      courseNames,
    );
    expect(items).toEqual([
      { type: "application", id: 12, label: "(경기도지원)평일 건축목공과정" },
    ]);
  });

  it("여러 과정은 'OO 외 N건'", () => {
    const items = buildNotificationItems(
      [{ id: 13, selected_courses: ["평일 건축목공과정", "주말 가구제작반"] }],
      [],
      courseNames,
    );
    expect(items).toEqual([{ type: "application", id: 13, label: "평일 건축목공과정 외 1건" }]);
  });

  it("과정명이 없으면 '신청 과정 미선택'", () => {
    expect(buildNotificationItems([{ id: 14, selected_courses: [] }], [], courseNames)).toEqual([
      { type: "application", id: 14, label: "신청 과정 미선택" },
    ]);
  });

  it("빈 문자열만 있으면 '신청 과정 미선택'", () => {
    expect(buildNotificationItems([{ id: 15, selected_courses: [""] }], [], courseNames)).toEqual([
      { type: "application", id: 15, label: "신청 과정 미선택" },
    ]);
  });

  it("상담문의는 course_id 있으면 과정명, 없으면 category", () => {
    const items = buildNotificationItems(
      [],
      [
        { id: 31, category: "과정문의", course_id: "wood-101" },
        { id: 32, category: "국비지원", course_id: null },
      ],
      courseNames,
    );
    expect(items).toEqual([
      { type: "inquiry", id: 31, label: "주중 목공 기초반" },
      { type: "inquiry", id: 32, label: "국비지원" },
    ]);
  });

  it("수강신청 먼저, 그다음 상담문의 순서", () => {
    const items = buildNotificationItems(
      [{ id: 1, selected_courses: ["평일 건축목공과정"] }],
      [{ id: 2, category: "기타", course_id: null }],
      courseNames,
    );
    expect(items.map((i) => i.type)).toEqual(["application", "inquiry"]);
  });

  it("빈 입력은 빈 배열", () => {
    expect(buildNotificationItems([], [], {})).toEqual([]);
  });
});
