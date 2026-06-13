// 과정 안내 페이지
// 참조: HANDOFF/ui_kits/website/courses.jsx (CourseCatalog2, CourseGrid, CourseDetail, EnrollSteps)

import { PageHero } from "@/components/sections/PageHero";
import { CourseCatalog } from "./CourseCatalog";

export default function CoursesPage() {
  return (
    <>
      <PageHero
        eyebrow="훈련과정"
        title="성요셉목수학교 과정 안내"
        sub="목공·집수리·인테리어 전문 기술을 체계적으로 배웁니다. 초보자부터 자격증 준비생까지 수준별 과정을 운영합니다."
      />
      <CourseCatalog />
    </>
  );
}
