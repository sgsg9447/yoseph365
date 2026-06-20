import { describe, it, expect } from "vitest";
import {
  countInquiriesByStatus,
  filterInquiriesByMonth,
  stepMonth,
  inquiryYearRange,
  searchInquiriesByName,
} from "./inquiry";

describe("countInquiriesByStatus", () => {
  it("전체·신규·완료 건수를 센다", () => {
    const rows = [{ status: "신규" }, { status: "신규" }, { status: "완료" }];
    expect(countInquiriesByStatus(rows)).toEqual({ 전체: 3, 신규: 2, 완료: 1 });
  });
  it("빈 목록은 모두 0", () => {
    expect(countInquiriesByStatus([])).toEqual({ 전체: 0, 신규: 0, 완료: 0 });
  });
});

describe("filterInquiriesByMonth", () => {
  const rows = [
    { date: "2026.06.20" },
    { date: "2026.06.01" },
    { date: "2026.05.31" },
    { date: "2025.06.10" },
  ];
  it("선택한 연·월의 문의만 남긴다", () => {
    expect(filterInquiriesByMonth(rows, 2026, 6)).toEqual([
      { date: "2026.06.20" },
      { date: "2026.06.01" },
    ]);
  });
  it("문의 없는 달은 빈 배열", () => {
    expect(filterInquiriesByMonth(rows, 2026, 1)).toEqual([]);
  });
});

describe("stepMonth", () => {
  it("다음 달로 이동", () => {
    expect(stepMonth(2026, 6, 1)).toEqual({ year: 2026, month: 7 });
  });
  it("12월 다음은 다음 해 1월", () => {
    expect(stepMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });
  it("1월 이전은 지난 해 12월", () => {
    expect(stepMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  });
});

describe("inquiryYearRange", () => {
  it("가장 이른 해부터 올해까지 내림차순", () => {
    const rows = [{ date: "2024.03.01" }, { date: "2026.06.01" }];
    expect(inquiryYearRange(rows, 2026)).toEqual([2026, 2025, 2024]);
  });
  it("빈 목록이면 올해만", () => {
    expect(inquiryYearRange([], 2026)).toEqual([2026]);
  });
});

describe("searchInquiriesByName", () => {
  const rows = [{ name: "김철수" }, { name: "이영희" }, { name: "Park" }];
  it("이름 부분일치만 남긴다", () => {
    expect(searchInquiriesByName(rows, "영희")).toEqual([{ name: "이영희" }]);
  });
  it("대소문자를 무시한다", () => {
    expect(searchInquiriesByName(rows, "park")).toEqual([{ name: "Park" }]);
  });
  it("빈 검색어는 전체 반환", () => {
    expect(searchInquiriesByName(rows, "  ")).toEqual(rows);
  });
  it("일치 없으면 빈 배열", () => {
    expect(searchInquiriesByName(rows, "최")).toEqual([]);
  });
});
