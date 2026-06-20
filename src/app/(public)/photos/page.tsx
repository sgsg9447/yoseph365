// T32 — 훈련 사진 갤러리 페이지
// 실습현장/수강생작품/학원의 순간들 구분 없이, 보내주신 현장 사진을 하나의
// 갤러리로 모아 보여준다. 사진별 비율이 제각각이라 자르지 않고 배치한다.

import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { TrainingGallery } from "./TrainingGallery";

export const metadata: Metadata = {
  title: "훈련 사진 — 성요셉목수학교",
  description:
    "실제 시공 현장과 같은 장비·공정으로 실습하는 훈련 현장을 사진으로 만나보세요.",
};

export default function PhotosPage() {
  return (
    <>
      <PageHero
        eyebrow="훈련 사진"
        title="현장과 같은 실습 환경"
        sub="보여주기식이 아닌, 실제와 같은 장비·공정으로 실습하는 훈련 현장을 사진으로 만나보세요."
      />
      <section className="wrap band" style={{ paddingTop: 36 }}>
        <TrainingGallery />
      </section>
    </>
  );
}
