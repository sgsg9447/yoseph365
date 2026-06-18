"use client";

import { useEffect, useRef } from "react";

/** 마운트 시 이벤트 1건을 /api/track으로 전송(중복 방지). 화면에 아무것도 렌더하지 않음. */
export function TrackView({ name, courseId }: { name: string; courseId?: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, courseId }),
      keepalive: true,
    }).catch(() => {});
  }, [name, courseId]);

  return null;
}
