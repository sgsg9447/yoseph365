import { describe, it, expect } from "vitest";
import { buildNotificationItems } from "./notifications";

const names = { "wood-101": "주중 목공 기초반", "int-201": "실내건축 산업기사반" };

describe("buildNotificationItems", () => {
  it("수강신청 1건은 과정명을 라벨로 쓴다", () => {
    const items = buildNotificationItems(
      [{ id: 12, selected_courses: ["wood-101"] }],
      [],
      names,
    );
    expect(items).toEqual([{ type: "application", id: 12, label: "주중 목공 기초반" }]);
  });

  it("여러 과정 선택은 'OO 외 N건'", () => {
    const items = buildNotificationItems(
      [{ id: 13, selected_courses: ["wood-101", "int-201"] }],
      [],
      names,
    );
    expect(items).toEqual([{ type: "application", id: 13, label: "주중 목공 기초반 외 1건" }]);
  });

  it("선택 과정 없음은 '신청 과정 미선택'", () => {
    const items = buildNotificationItems([{ id: 14, selected_courses: [] }], [], names);
    expect(items).toEqual([{ type: "application", id: 14, label: "신청 과정 미선택" }]);
  });

  it("알 수 없는 과정 id는 라벨에서 제외", () => {
    const items = buildNotificationItems([{ id: 15, selected_courses: ["ghost"] }], [], names);
    expect(items).toEqual([{ type: "application", id: 15, label: "신청 과정 미선택" }]);
  });

  it("상담문의는 course_id 있으면 과정명, 없으면 category", () => {
    const items = buildNotificationItems(
      [],
      [
        { id: 31, category: "과정문의", course_id: "wood-101" },
        { id: 32, category: "국비지원", course_id: null },
      ],
      names,
    );
    expect(items).toEqual([
      { type: "inquiry", id: 31, label: "주중 목공 기초반" },
      { type: "inquiry", id: 32, label: "국비지원" },
    ]);
  });

  it("수강신청 먼저, 그다음 상담문의 순서", () => {
    const items = buildNotificationItems(
      [{ id: 1, selected_courses: ["wood-101"] }],
      [{ id: 2, category: "기타", course_id: null }],
      names,
    );
    expect(items.map((i) => i.type)).toEqual(["application", "inquiry"]);
  });

  it("빈 입력은 빈 배열", () => {
    expect(buildNotificationItems([], [], {})).toEqual([]);
  });
});
