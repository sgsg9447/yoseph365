// T29 — 국비지원 안내 페이지
// 참조: HANDOFF/ui_kits/website/funding.jsx + funding.html

import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { FundingClient } from "./FundingClient";

export const metadata: Metadata = {
  title: "국비지원 안내 — 성요셉목수학교",
  description:
    "국민내일배움카드 발급, 훈련 참여 절차, 산재노동자 직업훈련까지 한눈에 정리했습니다.",
};

// 탭 ID 유효성 검사
const VALID_TABS = ["nbcard", "process", "sanjae"] as const;
type TabId = (typeof VALID_TABS)[number];
function isValidTab(s: string): s is TabId {
  return (VALID_TABS as readonly string[]).includes(s);
}

export default function FundingPage() {
  // 서버에서는 초기 탭을 "nbcard"로 고정.
  // 클라이언트에서 hash 기반 전환은 FundingClient가 담당.
  const initialTab: TabId = "nbcard";

  return (
    <>
      <PageHero
        eyebrow="국비지원"
        title="국비지원 안내"
        sub="내일배움카드 발급, 훈련 참여 절차, 산재노동자 직업훈련까지 한눈에 정리했습니다."
      />
      <FundingClient initialTab={initialTab} />
    </>
  );
}

export { isValidTab };
