// 과정 상세 — /courses/[id] (ISR). organic 유입 핵심 채널이라 과정별 메타 생성.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/sections/PageHero";
import { getCatalogCourses, getCourseById } from "@/lib/queries/courses";
import { CourseDetailView } from "../CourseDetailView";
import { EnrollSteps } from "../EnrollSteps";

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const courses = await getCatalogCourses();
    return courses.map((c) => ({ id: c.id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const course = await getCourseById(id).catch(() => null);
  if (!course) return { title: "과정 안내 — 성요셉목수학교" };
  return {
    title: `${course.name} — 성요셉목수학교`,
    description: course.desc || `${course.name} 과정 안내`,
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourseById(id).catch(() => null);
  if (!course) notFound();

  return (
    <>
      <PageHero
        eyebrow="훈련과정"
        title="성요셉목수학교 과정 안내"
        sub="목공·집수리·인테리어 전문 기술을 체계적으로 배웁니다. 초보자부터 자격증 준비생까지 수준별 과정을 운영합니다."
      />
      <CourseDetailView course={course} />
      <EnrollSteps />
    </>
  );
}
