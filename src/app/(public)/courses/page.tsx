// 과정 안내 — 카탈로그(목록). 상세는 /courses/[id]로 이동.

import { PageHero } from "@/components/sections/PageHero";
import { getCatalogCourses } from "@/lib/queries/courses";
import type { CatalogCourse } from "@/lib/queries/types";
import { CourseGrid } from "./CourseGrid";
import { EnrollSteps } from "./EnrollSteps";

export const revalidate = 3600;

export default async function CoursesPage() {
  let courses: CatalogCourse[];
  try {
    courses = await getCatalogCourses();
  } catch {
    courses = [];
  }
  return (
    <>
      <PageHero
        eyebrow="훈련과정"
        title="성요셉목수학교 과정 안내"
        sub="목공·집수리·인테리어 전문 기술을 체계적으로 배웁니다. 초보자부터 자격증 준비생까지 수준별 과정을 운영합니다."
      />
      <CourseGrid courses={courses} />
      <EnrollSteps />
    </>
  );
}
