import { getEnrollments, getAdminCourses } from "@/lib/queries/admin";
import { EnrollTable } from "./EnrollTable";

export default async function EnrollPage() {
  const [rows, courses] = await Promise.all([getEnrollments(), getAdminCourses()]);
  return <EnrollTable rows={rows} courseOptions={courses.map((c) => c.name)} />;
}
