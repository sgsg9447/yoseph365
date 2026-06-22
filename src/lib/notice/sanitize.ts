import DOMPurify from "isomorphic-dompurify";

/**
 * 공지 본문(리치 텍스트) sanitize 정책.
 * 에디터가 만드는 이미지(<img src>)와 정렬(style="text-align:...")은 보존하고,
 * script·이벤트 핸들러·javascript: 링크 등 위험 요소는 제거한다.
 * 저장(create/update)과 공개 렌더 양쪽에서 같은 정책을 쓴다.
 */
export function sanitizeRichHtml(html: string): string {
  return DOMPurify.sanitize(html);
}
