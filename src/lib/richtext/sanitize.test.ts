import { describe, it, expect } from "vitest";
import { sanitizeRichHtml, isBlankHtml } from "./sanitize";

describe("isBlankHtml", () => {
  it("빈 문자열·공백은 빈 것으로 본다", () => {
    expect(isBlankHtml("")).toBe(true);
    expect(isBlankHtml("   ")).toBe(true);
  });

  it("에디터의 빈 단락·줄바꿈만 있는 HTML은 빈 것으로 본다", () => {
    expect(isBlankHtml("<p></p>")).toBe(true);
    expect(isBlankHtml("<p><br></p>")).toBe(true);
    expect(isBlankHtml("<p>&nbsp;</p>")).toBe(true);
  });

  it("텍스트가 있으면 빈 것이 아니다", () => {
    expect(isBlankHtml("<p>안녕하세요</p>")).toBe(false);
  });

  it("이미지·구분선만 있어도 빈 것이 아니다", () => {
    expect(isBlankHtml('<p><img src="https://x/a.jpg"></p>')).toBe(false);
    expect(isBlankHtml("<hr>")).toBe(false);
  });
});

describe("sanitizeRichHtml", () => {
  it("이미지 태그와 src를 보존한다(에디터 본문 이미지)", () => {
    const out = sanitizeRichHtml('<p><img src="https://cdn.example.com/a.jpg" alt="현장"></p>');
    expect(out).toContain("<img");
    expect(out).toContain('src="https://cdn.example.com/a.jpg"');
  });

  it("text-align 정렬 스타일을 보존한다", () => {
    const out = sanitizeRichHtml('<p style="text-align: center">가운데</p>');
    expect(out).toMatch(/text-align/);
    expect(out).toContain("center");
  });

  it("script 등 위험한 태그·핸들러는 제거한다", () => {
    const out = sanitizeRichHtml('<p>안녕</p><script>alert(1)</script>');
    expect(out).not.toContain("<script");
    expect(out).not.toContain("alert(1)");
    expect(out).toContain("안녕");
  });

  it("javascript: 링크는 제거한다", () => {
    const out = sanitizeRichHtml('<a href="javascript:alert(1)">링크</a>');
    expect(out).not.toContain("javascript:");
  });

  it("글자 색상(color, hex) 스타일을 보존한다", () => {
    const out = sanitizeRichHtml('<span style="color: #e02424">빨강</span>');
    expect(out).toMatch(/color/);
    expect(out.toLowerCase()).toContain("#e02424");
  });

  it("글자 크기(font-size, px) 스타일을 보존한다", () => {
    const out = sanitizeRichHtml('<span style="font-size: 20px">크게</span>');
    expect(out).toMatch(/font-size/);
    expect(out).toContain("20px");
  });

  it("허용되지 않은 색상 표현식(expression 등)은 제거한다", () => {
    const out = sanitizeRichHtml('<span style="color: expression(alert(1))">x</span>');
    expect(out).not.toContain("expression");
  });

  it("이미지 너비(style width, %) 를 보존한다", () => {
    const out = sanitizeRichHtml('<img src="https://cdn.example.com/a.jpg" style="width: 50%">');
    expect(out).toMatch(/width/);
    expect(out).toContain("50%");
  });

  it("이미지 정렬(data-align) 속성을 보존한다", () => {
    const out = sanitizeRichHtml('<img src="https://cdn.example.com/a.jpg" data-align="center">');
    expect(out).toContain('data-align="center"');
  });

  it("이미지 너비는 % 만 허용하고 px 등은 제거한다", () => {
    const out = sanitizeRichHtml('<img src="https://cdn.example.com/a.jpg" style="width: 9999px">');
    expect(out).not.toContain("9999px");
  });
});
