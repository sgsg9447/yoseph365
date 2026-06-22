import { describe, it, expect } from "vitest";
import { sanitizeRichHtml } from "./sanitize";

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
});
