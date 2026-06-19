"use client";

// 홈: 목적(HeroIntent) 선택 → 운영중인 훈련과정(Schedule)에서 매칭 과정 하이라이트.
// 두 섹션이 상태를 공유해야 하므로 하나의 클라이언트 컴포넌트로 묶는다.

import { useState } from "react";
import { HeroIntent } from "./HeroIntent";
import { Schedule } from "./Schedule";
import type { ScheduleCourse } from "@/lib/queries/types";

// 목적 → 하이라이트할 과정 id
const INTENT_COURSE_IDS: Record<string, string[]> = {
  "재취업 준비": ["course_weekday_repair", "course_weekday_carpentry"],
  "창업·부업": ["course_weekend_carpentry", "course_weekend_interior_film"],
  "내 집 직접 수리": ["course_weekday_repair"],
  "자격증 취득": ["course_architecture_certificate"],
};

export function HomeIntentSchedule({ courses }: { courses: ScheduleCourse[] }) {
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const [pulse, setPulse] = useState(0);

  function handlePick(intentTitle: string) {
    setHighlightedIds(INTENT_COURSE_IDS[intentTitle] ?? []);
    setPulse((p) => p + 1);
    requestAnimationFrame(() => {
      document.getElementById("schedule")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  return (
    <>
      <div id="hero">
        <HeroIntent onPick={handlePick} />
      </div>
      <Schedule courses={courses} highlightedIds={highlightedIds} pulse={pulse} />
    </>
  );
}
