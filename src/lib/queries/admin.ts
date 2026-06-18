import { maskName, maskPhone } from "@/lib/admin/mask";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

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

export async function getEnrollments(): Promise<EnrollmentView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("application")
    .select("id,name,phone,selected_courses,status,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toEnrollmentView);
}

export async function getInquiries(): Promise<InquiryView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inquiry")
    .select("id,name,phone,category,course_id,content,status,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toInquiryView);
}

export interface AdminCourseView {
  id: string;
  name: string;
  open: boolean; // recruit_status === '모집중'
  recruitStatus: Database["public"]["Enums"]["recruit_status"];
}

export async function getAdminCourses(): Promise<AdminCourseView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course")
    .select("id,name,recruit_status")
    .eq("is_deleted", false)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    open: c.recruit_status === "모집중",
    recruitStatus: c.recruit_status,
  }));
}

export interface AdminPhotoView {
  id: number;
  label: string;
  image: string | null;
}

export async function getTrainingPhotos(): Promise<AdminPhotoView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("post")
    .select("id,title,images,category,is_published,is_deleted,created_at")
    .eq("category", "훈련사진")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((p) => ({ id: p.id, label: p.title, image: p.images[0] ?? null }));
}

export interface AdminNoticeView {
  id: number;
  title: string;
  body: string;
  date: string;
  pinned: boolean;
}

export async function getAdminNotices(): Promise<AdminNoticeView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notice")
    .select("id,title,body,is_pinned,is_deleted,published_at,created_at")
    .eq("is_deleted", false)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    date: fmtDate(n.published_at ?? n.created_at),
    pinned: n.is_pinned,
  }));
}

/** 사이드바 카운트 */
export async function getSidebarCounts(): Promise<{ pending: number; newInquiries: number }> {
  const supabase = await createClient();
  const [{ count: pending }, { count: newInquiries }] = await Promise.all([
    supabase.from("application").select("id", { count: "exact", head: true }).eq("status", "신규"),
    supabase.from("inquiry").select("id", { count: "exact", head: true }).eq("status", "답변대기"),
  ]);
  return { pending: pending ?? 0, newInquiries: newInquiries ?? 0 };
}

export async function getOpenCourseCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("course")
    .select("id", { count: "exact", head: true })
    .eq("is_deleted", false)
    .eq("recruit_status", "모집중");
  return count ?? 0;
}
