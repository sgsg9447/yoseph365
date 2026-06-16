// T32 — 훈련 사진 갤러리 페이지
// 참조: HANDOFF/ui_kits/website/photos.html (PhotoGallery)

import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { PhotoSlot } from "@/components/ui/PhotoSlot";

export const metadata: Metadata = {
  title: "훈련 사진 — 성요셉목수학교",
  description:
    "실제 시공 현장과 같은 장비·공정으로 실습하는 훈련 현장을 사진으로 만나보세요.",
};

const GROUPS = [
  {
    title: "실습 현장",
    photos: [
      "목공 실습",
      "벽체 단열 실습",
      "타일 시공 실습",
      "전동공구 수업",
      "필름 시공 실습",
      "설비 실습",
    ],
  },
  {
    title: "수강생 작품",
    photos: ["가벽·아치 개구부", "목재 창호", "수강생 작품"],
  },
  {
    title: "학원의 순간들",
    photos: ["수료식", "단체 사진", "작품 전시"],
  },
];

function PhotoGallery() {
  return (
    <section className="wrap band" style={{ paddingTop: 36 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
        {GROUPS.map((g, gi) => (
          <div key={gi}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                fontWeight: 700,
                color: "var(--color-ink)",
                letterSpacing: "-0.4px",
                margin: "0 0 20px",
              }}
            >
              {g.title}
            </h2>
            <div className="grid g-3">
              {g.photos.map((p, i) => (
                <PhotoSlot key={i} ratio="4 / 3" label={p} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function PhotosPage() {
  return (
    <>
      <PageHero
        eyebrow="훈련 사진"
        title="현장과 같은 실습 환경"
        sub="보여주기식이 아닌, 실제와 같은 장비·공정으로 실습하는 훈련 현장을 사진으로 만나보세요."
      />
      <PhotoGallery />
    </>
  );
}
