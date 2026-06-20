// T32 — 훈련 사진 갤러리 페이지
// 어드민에서 관리하는 훈련사진(post category='훈련사진')을 갤러리로 보여준다.

import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { TrainingGallery } from "./TrainingGallery";
import { PhotosEmptyCta } from "./PhotosEmptyCta";
import { getTrainingGalleryPhotos } from "@/lib/queries/photos";

export const metadata: Metadata = {
  title: "훈련 사진 — 성요셉목수학교",
  description:
    "실제 시공 현장과 같은 장비·공정으로 실습하는 훈련 현장을 사진으로 만나보세요.",
};

export default async function PhotosPage() {
  const photos = await getTrainingGalleryPhotos();

  return (
    <>
      <PageHero
        eyebrow="훈련 사진"
        title="현장과 같은 실습 환경"
        sub="보여주기식이 아닌, 실제와 같은 장비·공정으로 실습하는 훈련 현장을 사진으로 만나보세요."
      />
      <section className="wrap band" style={{ paddingTop: 36 }}>
        {photos.length === 0 ? (
          <PhotosEmptyCta />
        ) : (
          <TrainingGallery photos={photos} />
        )}
      </section>
    </>
  );
}
