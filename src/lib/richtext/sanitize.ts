import sanitizeHtml from "sanitize-html";

/**
 * 리치 텍스트(공지 본문·상담 답변) sanitize 정책.
 * 에디터가 만드는 이미지(<img src>)와 정렬(style="text-align:...")은 보존하고,
 * script·이벤트 핸들러·javascript: 링크 등 위험 요소는 제거한다.
 * 저장과 공개 렌더 양쪽에서 같은 정책을 쓴다.
 */
export function sanitizeRichHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "a",
      "b",
      "blockquote",
      "br",
      "code",
      "div",
      "em",
      "h1",
      "h2",
      "h3",
      "hr",
      "i",
      "img",
      "li",
      "ol",
      "p",
      "pre",
      "s",
      "span",
      "strong",
      "u",
      "ul",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      "*": ["style"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      img: ["http", "https"],
    },
    allowedStyles: {
      "*": {
        "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
      },
    },
  });
}

/**
 * 리치 텍스트가 내용 없이 비었는지 판정.
 * 빈 단락(<p></p>)·줄바꿈·&nbsp;는 빈 것으로, 이미지·구분선은 내용으로 본다.
 */
export function isBlankHtml(html: string): boolean {
  if (/<(img|hr)\b/i.test(html)) return false;
  const text = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim();
  return text.length === 0;
}
