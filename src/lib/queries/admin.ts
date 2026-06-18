import { maskName, maskPhone } from "@/lib/admin/mask";
import type { Database } from "@/lib/supabase/database.types";

type ApplicationRow = Database["public"]["Tables"]["application"]["Row"];
type InquiryRow = Database["public"]["Tables"]["inquiry"]["Row"];

export type EnrollStatus = Database["public"]["Enums"]["application_status"]; // 신규/상담중/등록확인/보류

export interface EnrollmentView {
  id: number;
  name: string;
  course: string;
  phone: string;
  date: string;
  status: EnrollStatus;
}

export interface InquiryView {
  id: number;
  name: string;
  phone: string;
  interest: string;
  message: string;
  date: string;
  status: "신규" | "완료";
}

/** ISO → "YYYY.MM.DD" (KST 기준 단순 포맷) */
function fmtDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export function toEnrollmentView(
  r: Pick<ApplicationRow, "id" | "name" | "phone" | "selected_courses" | "status" | "created_at">,
): EnrollmentView {
  return {
    id: r.id,
    name: maskName(r.name),
    course: r.selected_courses[0] ?? "-",
    phone: maskPhone(r.phone),
    date: fmtDate(r.created_at),
    status: r.status,
  };
}

export function inquiryStatusLabel(s: InquiryRow["status"]): "신규" | "완료" {
  return s === "답변완료" ? "완료" : "신규";
}

export function toInquiryView(
  r: Pick<InquiryRow, "id" | "name" | "phone" | "category" | "course_id" | "content" | "status" | "created_at">,
): InquiryView {
  return {
    id: r.id,
    name: maskName(r.name),
    phone: maskPhone(r.phone),
    interest: r.course_id ?? r.category,
    message: r.content,
    date: fmtDate(r.created_at),
    status: inquiryStatusLabel(r.status),
  };
}

export function countPending(rows: { status: EnrollStatus }[]): number {
  return rows.filter((r) => r.status === "신규").length;
}

export function countNewInquiries(rows: { status: InquiryRow["status"] }[]): number {
  return rows.filter((r) => r.status === "답변대기").length;
}
