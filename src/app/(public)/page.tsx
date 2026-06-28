// Home page (server component).
// 목적(HeroIntent)+운영중인 훈련과정(Schedule)은 HomeIntentSchedule('use client')로 묶여 있고
// 목적 선택 시 매칭 과정이 하이라이트된다.
// Section order: Banner → AwardsStrip → HeroIntent → Schedule → Barriers → SocialProof → Videos → ClosingCTA

import { Banner } from "@/components/layout/Banner";
import { AwardsStrip } from "@/components/layout/AwardsStrip";
import { HomeIntentSchedule } from "@/components/sections/HomeIntentSchedule";
import { Barriers } from "@/components/sections/Barriers";
import { SocialProof } from "@/components/sections/SocialProof";
import { Videos } from "@/components/sections/Videos";
import { ClosingCTA } from "@/components/sections/ClosingCTA";
import { getScheduleCourses } from "@/lib/queries/courses";
import { getFeaturedTrainingPhotos } from "@/lib/queries/photos";
import type { ScheduleCourse } from "@/lib/queries/types";

export const revalidate = 3600;

export default async function HomePage() {
  let scheduleCourses: ScheduleCourse[];
  try {
    scheduleCourses = await getScheduleCourses();
  } catch {
    scheduleCourses = [];
  }
  let featuredPhotos: string[];
  try {
    featuredPhotos = await getFeaturedTrainingPhotos();
  } catch {
    featuredPhotos = [];
  }
  return (
    <>
      <Banner />
      <AwardsStrip />
      <HomeIntentSchedule courses={scheduleCourses} />
      <Barriers />
      <SocialProof photos={featuredPhotos} />
      <Videos />
      <ClosingCTA />
    </>
  );
}
