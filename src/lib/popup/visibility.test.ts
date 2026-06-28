import { describe, it, expect } from "vitest";
import { shouldShowPopup, hideUntilTimestamp } from "./visibility";

const base = {
  isActive: true,
  hideOnMobile: false,
  isMobile: false,
  hideUntil: null as number | null,
  now: 1_000_000,
};

describe("shouldShowPopup", () => {
  it("활성 + 억제 없음 + 데스크톱이면 노출", () => {
    expect(shouldShowPopup(base)).toBe(true);
  });

  it("비활성이면 노출 안 함", () => {
    expect(shouldShowPopup({ ...base, isActive: false })).toBe(false);
  });

  it("'오늘 그만보기' 만료 전(now < hideUntil)이면 노출 안 함", () => {
    expect(shouldShowPopup({ ...base, hideUntil: base.now + 1 })).toBe(false);
  });

  it("'오늘 그만보기' 만료 후(now >= hideUntil)면 노출", () => {
    expect(shouldShowPopup({ ...base, hideUntil: base.now - 1 })).toBe(true);
  });

  it("모바일 숨김 설정 + 모바일이면 노출 안 함", () => {
    expect(shouldShowPopup({ ...base, hideOnMobile: true, isMobile: true })).toBe(false);
  });

  it("모바일 숨김 설정이어도 데스크톱이면 노출", () => {
    expect(shouldShowPopup({ ...base, hideOnMobile: true, isMobile: false })).toBe(true);
  });

  it("모바일이어도 모바일 숨김 설정이 꺼져 있으면 노출", () => {
    expect(shouldShowPopup({ ...base, hideOnMobile: false, isMobile: true })).toBe(true);
  });
});

describe("hideUntilTimestamp", () => {
  it("현재 시각에서 24시간 뒤 epoch(ms)를 반환", () => {
    expect(hideUntilTimestamp(1_000_000)).toBe(1_000_000 + 24 * 60 * 60 * 1000);
  });
});
