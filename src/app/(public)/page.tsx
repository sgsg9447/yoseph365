// Home page (server component).
// Interactive sections (HeroIntent + Schedule) are isolated in HomeInteractive ('use client').
// Section order: Banner → AwardsStrip → HeroIntent → Barriers → SocialProof → Videos → Schedule → ClosingCTA

import { Banner } from "@/components/layout/Banner";
import { AwardsStrip } from "@/components/layout/AwardsStrip";
import { HomeInteractive } from "@/components/sections/HomeInteractive";
import { Barriers } from "@/components/sections/Barriers";
import { SocialProof } from "@/components/sections/SocialProof";
import { Videos } from "@/components/sections/Videos";
import { ClosingCTA } from "@/components/sections/ClosingCTA";

export default function HomePage() {
  return (
    <>
      <Banner />
      <AwardsStrip />
      <HomeInteractive />
      <Barriers />
      <SocialProof />
      <Videos />
      <ClosingCTA />
    </>
  );
}
