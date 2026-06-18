import { describe, it, expect } from "vitest";
import { maskName, maskPhone } from "./mask";

describe("maskName", () => {
  it("가운데 글자를 O로 가린다(3글자)", () => {
    expect(maskName("김지희")).toBe("김O희");
  });
  it("2글자는 마지막을 가린다", () => {
    expect(maskName("김희")).toBe("김O");
  });
  it("4글자 이상은 가운데를 모두 가린다", () => {
    expect(maskName("남궁민수")).toBe("남OO수");
  });
  it("빈/한 글자는 그대로", () => {
    expect(maskName("김")).toBe("김");
    expect(maskName("")).toBe("");
  });
});

describe("maskPhone", () => {
  it("마지막 4자리를 가린다", () => {
    expect(maskPhone("010-1234-5678")).toBe("010-1234-••••");
  });
  it("하이픈 없는 입력도 정규화해 가린다", () => {
    expect(maskPhone("01012345678")).toBe("010-1234-••••");
  });
  it("형식 불명은 끝 4자만 가린다", () => {
    expect(maskPhone("12345")).toBe("1••••");
  });
});
