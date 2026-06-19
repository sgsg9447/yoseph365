import { describe, it, expect } from "vitest";
import { countByDate, buildMonth } from "./calendar";

describe("countByDate", () => {
  it("같은 날짜 건수를 센다", () => {
    const m = countByDate([{ date: "2026.06.17" }, { date: "2026.06.17" }, { date: "2026.06.18" }]);
    expect(m["2026.06.17"]).toBe(2);
    expect(m["2026.06.18"]).toBe(1);
  });
});

describe("buildMonth", () => {
  it("셀 개수는 7의 배수, 날짜 형식은 YYYY.MM.DD", () => {
    const cells = buildMonth(2026, 6); // 2026-06-01은 월요일
    expect(cells.length % 7).toBe(0);
    const first = cells.find((c) => c.inMonth);
    expect(first?.date).toBe("2026.06.01");
  });
  it("2026년 6월 1일은 월요일이라 앞에 빈칸 1개(일요일)", () => {
    const cells = buildMonth(2026, 6);
    expect(cells[0].inMonth).toBe(false);
    expect(cells[1].date).toBe("2026.06.01");
  });
  it("해당 월 일수만큼 inMonth 셀이 있다", () => {
    const cells = buildMonth(2026, 6); // 30일
    expect(cells.filter((c) => c.inMonth).length).toBe(30);
  });
});
