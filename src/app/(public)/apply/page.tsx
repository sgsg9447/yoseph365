// 수강신청 페이지 — ?course= 파라미터로 과정명 전달
// 참조: HANDOFF/ui_kits/website/apply.jsx (ApplyPage, ApplyCoursePicker)
// useSearchParams를 사용하므로 Suspense 래핑 필요 (Next 16 정적 최적화)

import { Suspense } from "react";
import { PageHero } from "@/components/sections/PageHero";
import { getApplyCourses } from "@/lib/queries/courses";
import type { ApplyCourse } from "@/lib/queries/types";
import { ApplyClient } from "./ApplyClient";

export const revalidate = 3600;

export default async function ApplyPage() {
  let courses: ApplyCourse[];
  try {
    courses = await getApplyCourses();
  } catch {
    courses = [];
  }
  return (
    <>
      <PageHero
        eyebrow="수강신청"
        title="온라인 수강신청"
        sub="모집안내 확인 후 신청서를 작성하시면 접수가 완료됩니다."
        subMobileLines={[
          "모집안내 확인 후 신청서를 작성하시면",
          "접수가 완료됩니다.",
        ]}
      />
      <section className="wrap" style={{ paddingTop: 32, paddingBottom: 72 }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <Suspense fallback={null}>
            <ApplyClient courses={courses} />
          </Suspense>
        </div>
      </section>
    </>
  );
}
