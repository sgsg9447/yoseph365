import { describe, it, expect } from "vitest";
import { pickPopupImage } from "./image";

describe("pickPopupImage", () => {
  it("데스크톱이면 데스크톱 이미지를 고른다", () => {
    expect(
      pickPopupImage({ desktopUrl: "d.jpg", mobileUrl: "m.jpg", isMobile: false }),
    ).toBe("d.jpg");
  });

  it("모바일이고 모바일 이미지가 있으면 모바일 이미지를 고른다", () => {
    expect(
      pickPopupImage({ desktopUrl: "d.jpg", mobileUrl: "m.jpg", isMobile: true }),
    ).toBe("m.jpg");
  });

  it("모바일이지만 모바일 이미지가 없으면 데스크톱 이미지로 대체한다", () => {
    expect(
      pickPopupImage({ desktopUrl: "d.jpg", mobileUrl: null, isMobile: true }),
    ).toBe("d.jpg");
  });

  it("모바일 이미지가 빈 문자열이면 데스크톱 이미지로 대체한다", () => {
    expect(
      pickPopupImage({ desktopUrl: "d.jpg", mobileUrl: "", isMobile: true }),
    ).toBe("d.jpg");
  });
});
