// T30 — 학원소개 페이지
// 참조: HANDOFF/ui_kits/website/about.jsx + about.html

import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { AboutClient } from "./AboutClient";

export const metadata: Metadata = {
  title: "학원소개 — 성요셉목수학교",
  description:
    "성요셉목수학교 소개 — 소수 정원 실습, 현장 경력 강사진, 수료 후 연계까지. 목공·집수리·인테리어 직업훈련기관.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="학원소개"
        title="성요셉목수학교"
        sub="손으로 배우고 기술로 다시 서는 곳 — 고용노동부 지정 직업능력개발 훈련기관입니다."
      />
      <AboutClient />
    </>
  );
}
