// Home page (server component).
// Interactive sections (HeroIntent + Schedule) are isolated in HomeInteractive ('use client').
// Section order: Banner → AwardsStrip → HeroIntent → Barriers → SocialProof → Videos → Schedule → ClosingCTA

import { Banner } from "@/components/layout/Banner";
import { AwardsStrip } from "@/components/layout/AwardsStrip";
import { HeroIntentSection, ScheduleSection } from "@/components/sections/HomeInteractive";
import { Barriers } from "@/components/sections/Barriers";
import { SocialProof } from "@/components/sections/SocialProof";
import { Videos } from "@/components/sections/Videos";
import { ClosingCTA } from "@/components/sections/ClosingCTA";
import { getScheduleCourses } from "@/lib/queries/courses";
import type { ScheduleCourse } from "@/lib/queries/types";

export const revalidate = 3600;

export default async function HomePage() {
  let scheduleCourses: ScheduleCourse[];
  try {
    scheduleCourses = await getScheduleCourses();
  } catch {
    scheduleCourses = [];
  }
  return (
    <>
      <Banner />
      <AwardsStrip />
      <HeroIntentSection />
      <Barriers />
      <SocialProof />
      <Videos />
      <ScheduleSection courses={scheduleCourses} />
      <ClosingCTA />
    </>
  );
}
