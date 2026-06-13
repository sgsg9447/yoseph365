"use client";

// Minimal client wrapper for home-page interactive sections.
// - HeroIntent.onPick → smooth-scroll to #schedule
// - Schedule.onApply  → navigate to /apply?course=<encoded>

import { useRouter } from "next/navigation";
import { HeroIntent } from "./HeroIntent";
import { Schedule } from "./Schedule";

export function HomeInteractive() {
  const router = useRouter();

  function handlePick() {
    const el = document.getElementById("schedule");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  function handleApply(courseName: string) {
    router.push(`/apply?course=${encodeURIComponent(courseName)}`);
  }

  return (
    <>
      <div id="hero">
        <HeroIntent onPick={handlePick} />
      </div>
      <Schedule onApply={handleApply} />
    </>
  );
}
