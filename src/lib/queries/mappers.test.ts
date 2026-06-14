import { describe, it, expect } from "vitest";
import {
  patternToDay,
  patternToStartDate,
  curriculumToTable,
  trackToView,
  historyToView,
  applyInfoRowToView,
  courseRecruitStatus,
} from "./mappers";

describe("patternToDay", () => {
  it("maps schedule_pattern to UI day", () => {
    expect(patternToDay("평일주간")).toBe("평일");
    expect(patternToDay("주말")).toBe("주말");
    expect(patternToDay("단기")).toBe("단기");
    expect(patternToDay(null)).toBe("평일");
  });
});

describe("patternToStartDate", () => {
  it("maps to 반 label", () => {
    expect(patternToStartDate("평일주간")).toBe("평일반");
    expect(patternToStartDate("주말")).toBe("주말반");
    expect(patternToStartDate("단기")).toBe("단기");
  });
});

describe("curriculumToTable", () => {
  it("builds 4-col rows joined by newline, sorted by round", () => {
    const rows = [
      { round: 2, unit: "U2", contents: ["a", "b"], hours: 8, place: "실습실" },
      { round: 1, unit: "U1", contents: ["x"], hours: 8, place: "강의실" },
    ];
    expect(curriculumToTable(rows)).toEqual([
      ["1", "U1", "x", "강의실"],
      ["2", "U2", "a\nb", "실습실"],
    ]);
  });
});

describe("trackToView", () => {
  it("formats price/sessions and exam periods", () => {
    const track = {
      name: "건축목공기능사",
      description: "속성",
      sessions_total: 5,
      schedule_summary: ["4회 8h"],
      price: 600000,
      recruit_status: "마감" as const,
    };
    const exams = [
      {
        round: "제1회",
        apply_start: "2026-02-02",
        apply_end: "2026-02-05",
        exam_start: "2026-03-14",
        exam_end: "2026-04-01",
        result_dates: ["2026-04-10", "2026-04-17"],
      },
    ];
    const v = trackToView(track, exams);
    expect(v.priceText).toBe("600,000원");
    expect(v.sessionsText).toBe("5회");
    expect(v.recruitStatus).toBe("마감");
    expect(v.exams[0].applyPeriod).toBe("02.02 ~ 02.05");
    expect(v.exams[0].examPeriod).toBe("03.14 ~ 04.01");
    expect(v.exams[0].resultDates).toBe("04.10, 04.17");
  });

  it("falls back to 상담 안내 when price is null", () => {
    const v = trackToView(
      {
        name: "X",
        description: null,
        sessions_total: null,
        schedule_summary: [],
        price: null,
        recruit_status: "모집중" as const,
      },
      [],
    );
    expect(v.priceText).toBe("상담 안내");
    expect(v.sessionsText).toBe("");
  });
});

describe("courseRecruitStatus", () => {
  it("정규 과정은 코스 모집상태를 그대로 쓴다", () => {
    expect(courseRecruitStatus("모집중", undefined)).toBe("모집중");
    expect(courseRecruitStatus("마감", undefined)).toBe("마감");
    expect(courseRecruitStatus("모집예정", undefined)).toBe("모집예정");
  });
  it("자격증 과정은 트랙 중 하나라도 모집중이면 모집중", () => {
    expect(
      courseRecruitStatus("모집중", [{ recruitStatus: "마감" }, { recruitStatus: "모집중" }]),
    ).toBe("모집중");
  });
  it("자격증 과정은 트랙이 모두 마감이면 마감", () => {
    expect(
      courseRecruitStatus("모집중", [{ recruitStatus: "마감" }, { recruitStatus: "마감" }]),
    ).toBe("마감");
  });
});

describe("applyInfoRowToView", () => {
  it("maps snake_case row to camelCase view", () => {
    const row = {
      qualifications: ["내일배움카드 보유자"],
      recruit_period: null,
      training_period: "26.08.24 ~ 26.10.13",
      training_time: ["09:00 ~ 17:40"],
      capacity: "16명",
      cost: "1,950,480원",
      cost_notes: ["최대자비부담금 780,170원"],
      steps: ["등록 완료"],
      exclusions: ["상용직 취업상태인 자"],
    };
    expect(applyInfoRowToView(row)).toEqual({
      qualifications: ["내일배움카드 보유자"],
      recruitPeriod: null,
      trainingPeriod: "26.08.24 ~ 26.10.13",
      trainingTime: ["09:00 ~ 17:40"],
      capacity: "16명",
      cost: "1,950,480원",
      costNotes: ["최대자비부담금 780,170원"],
      steps: ["등록 완료"],
      exclusions: ["상용직 취업상태인 자"],
    });
  });
});

describe("historyToView", () => {
  it("groups items by year sorted, items by display_order", () => {
    const histories = [{ id: 1, year: 2025, display_order: 1 }];
    const items = [
      { history_id: 1, content: "b", is_highlighted: false, display_order: 2 },
      { history_id: 1, content: "a", is_highlighted: true, display_order: 1 },
    ];
    expect(historyToView(histories, items)).toEqual([
      {
        year: 2025,
        items: [
          { content: "a", isHighlighted: true },
          { content: "b", isHighlighted: false },
        ],
      },
    ]);
  });
});
