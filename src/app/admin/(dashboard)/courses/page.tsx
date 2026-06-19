import { getCourseEditBundles } from "@/lib/queries/admin";
import { CourseEditor } from "./CourseEditor";
import { EmptyState } from "@/components/admin/EmptyState";

export default async function CoursesPage() {
  const bundles = await getCourseEditBundles();
  if (bundles.length === 0) return <EmptyState message="등록된 과정이 없습니다." />;
  return <CourseEditor bundles={bundles} />;
}
