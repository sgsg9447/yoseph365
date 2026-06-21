// T31 — 상담문의 게시판 목록 페이지
// 참조: HANDOFF/ui_kits/website/inquiry.jsx + inquiry.html

import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { InquiryBoard } from "./InquiryBoard";
import { fetchPublicInquiries, type PublicInquiryListItem } from "@/lib/queries/inquiry";

export const dynamic = "force-dynamic"; // 제출 즉시 반영

export const metadata: Metadata = {
  title: "상담문의 — 성요셉목수학교",
  description:
    "국비지원 과정·수강 신청·일정 등 궁금한 점을 문의해 주세요. 1영업일 안에 전화로 답변드립니다.",
};

export default async function InquiryPage() {
  let posts: PublicInquiryListItem[] = [];
  let loadError = false;
  try {
    posts = await fetchPublicInquiries();
  } catch {
    loadError = true;
  }

  return (
    <>
      <PageHero
        eyebrow="상담문의"
        title="무엇이든 물어보세요"
        sub="국비지원부터 과정 선택까지, 남겨주신 문의는 확인 후 안내드립니다."
        subMobileLines={[
          "국비지원부터 과정 선택까지,",
          "남겨주신 문의는 확인 후 안내드립니다.",
        ]}
      />
      <InquiryBoard posts={posts} loadError={loadError} />
    </>
  );
}
