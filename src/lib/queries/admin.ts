import { maskName, maskPhone } from "@/lib/admin/mask";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type ApplicationRow = Database["public"]["Tables"]["application"]["Row"];
type InquiryRow = Database["public"]["Tables"]["inquiry"]["Row"];

export type EnrollStatus = Database["public"]["Enums"]["application_status"]; // 신규/상담중/등록확인/보류

export interface EnrollmentView {
  id: number;
  name: string;
  /** 첫 선택 과정(대시보드 등 단일 표시용) */
  course: string;
  /** 선택한 전체 과정(과정 필터용) */
  courses: string[];
  phone: string;
  date: string;
  status: EnrollStatus;
  /** 신청 시 추가 입력에서 파싱(테이블 표시용) */
  birth: string;
  gender: string;
  /** 펼침 상세용 추가 정보 */
  address: string;
  career: string;
  motivation: string;
  /** 운영자 메모(admin_memo) */
  memo: string;
}

/** additional_note("라벨: 값" 줄글)에서 라벨에 해당하는 값을 추출. 없으면 "". */
export function extractNoteField(note: string, label: string): string {
  for (const line of note.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    if (line.slice(0, idx).trim() === label) return line.slice(idx + 1).trim();
  }
  return "";
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

/** ISO → "YYYY.MM.DD" (Asia/Seoul 기준) */
function fmtDate(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}.${get("month")}.${get("day")}`;
}

export function toEnrollmentView(
  r: Pick<
    ApplicationRow,
    | "id"
    | "name"
    | "phone"
    | "selected_courses"
    | "status"
    | "created_at"
    | "admin_memo"
    | "additional_note"
  >,
): EnrollmentView {
  // 관리자(authenticated) 화면 — 신청 처리를 위해 이름·연락처를 마스킹하지 않고 그대로 노출한다.
  const note = r.additional_note ?? "";
  return {
    id: r.id,
    name: r.name,
    course: r.selected_courses[0] ?? "-",
    courses: r.selected_courses,
    phone: r.phone,
    date: fmtDate(r.created_at),
    status: r.status,
    birth: extractNoteField(note, "생년월일"),
    gender: extractNoteField(note, "성별"),
    address: extractNoteField(note, "주소"),
    career: extractNoteField(note, "관련 경력"),
    motivation: extractNoteField(note, "지원동기"),
    memo: r.admin_memo ?? "",
  };
}

export function inquiryStatusLabel(s: InquiryRow["status"]): "신규" | "완료" {
  return s === "답변완료" ? "완료" : "신규";
}

export function toInquiryView(
  r: Pick<InquiryRow, "id" | "name" | "phone" | "category" | "content" | "status" | "created_at">,
  courseName?: string | null,
): InquiryView {
  return {
    id: r.id,
    name: maskName(r.name),
    phone: maskPhone(r.phone),
    interest: courseName ?? r.category,
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
    .select("id,name,phone,selected_courses,status,created_at,admin_memo,additional_note")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toEnrollmentView);
}

export async function getInquiries(): Promise<InquiryView[]> {
  const supabase = await createClient();
  const [inquiryRes, courses] = await Promise.all([
    supabase
      .from("inquiry")
      .select("id,name,phone,category,course_id,content,status,created_at")
      .order("created_at", { ascending: false }),
    getAdminCourses(),
  ]);
  if (inquiryRes.error) throw inquiryRes.error;
  const nameById = new Map(courses.map((c) => [c.id, c.name]));
  return (inquiryRes.data ?? []).map((r) =>
    toInquiryView(r, r.course_id ? nameById.get(r.course_id) ?? null : null),
  );
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

export interface CourseEditView {
  id: string;
  name: string;
  summary: string;
  skills: string[];
  tuition: string;
  selfPay: string;
  sessionsTotal: number | null;
  sessionHours: string;
  totalHours: number | null;
  recruitStatus: Database["public"]["Enums"]["recruit_status"];
}

/** 과정 수정용 — 공개 화면에 표시되는 course 필드 일체. */
export async function getCoursesForEdit(): Promise<CourseEditView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course")
    .select(
      "id,name,summary,skills,tuition,self_pay,sessions_total,session_hours,total_hours,recruit_status",
    )
    .eq("is_deleted", false)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    summary: c.summary ?? "",
    skills: c.skills ?? [],
    tuition: c.tuition ?? "",
    selfPay: c.self_pay ?? "",
    sessionsTotal: c.sessions_total,
    sessionHours: c.session_hours ?? "",
    totalHours: c.total_hours,
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
