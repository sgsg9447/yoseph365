"use client";

// Minimal client wrapper for the home hero (smooth-scroll to #schedule).
// 일정 섹션(Schedule)은 행이 Link라 클라이언트 핸들러가 필요 없어 page에서 직접 렌더.

import { HeroIntent } from "./HeroIntent";

export function HeroIntentSection() {
  function handlePick() {
    const el = document.getElementById("schedule");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div id="hero">
      <HeroIntent onPick={handlePick} />
    </div>
  );
}
