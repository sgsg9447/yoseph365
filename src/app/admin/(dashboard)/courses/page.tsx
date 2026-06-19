import { getCoursesForEdit } from "@/lib/queries/admin";
import { CourseEditor } from "./CourseEditor";
import { EmptyState } from "@/components/admin/EmptyState";

export default async function CoursesPage() {
  const courses = await getCoursesForEdit();
  if (courses.length === 0) return <EmptyState message="등록된 과정이 없습니다." />;
  return <CourseEditor initial={courses} />;
}
