"use client";

// Minimal client wrappers for home-page interactive sections.
// Kept separate so the page can place each in the correct section order.
// - HeroIntent.onPick → smooth-scroll to #schedule
// - Schedule.onApply  → navigate to /apply?course=<encoded>

import { useRouter } from "next/navigation";
import { HeroIntent } from "./HeroIntent";
import { Schedule } from "./Schedule";

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

export function ScheduleSection() {
  const router = useRouter();

  function handleApply(courseName: string) {
    router.push(`/apply?course=${encodeURIComponent(courseName)}`);
  }

  return <Schedule onApply={handleApply} />;
}
