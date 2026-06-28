import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { publicUrl } from "@/lib/storage/keys";
import { isLeafCategory, type LeafCategory } from "@/lib/gallery/categories";
import { applyInfoRowToView } from "./mappers";
import type { ApplyInfoView } from "./types";

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
  memo: string;
  title: string | null;
  isPublicPost: boolean;
  isSecret: boolean;
  isPublished: boolean;
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
  r: Pick<
    InquiryRow,
    | "id"
    | "name"
    | "phone"
    | "category"
    | "content"
    | "status"
    | "created_at"
    | "admin_memo"
    | "title"
    | "is_public_post"
    | "is_secret"
    | "is_published"
  >,
  courseName?: string | null,
): InquiryView {
  // 관리자(authenticated) 화면 — 상담 처리를 위해 이름·연락처를 그대로 노출.
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    interest: courseName ?? r.category,
    message: r.content,
    date: fmtDate(r.created_at),
    status: inquiryStatusLabel(r.status),
    memo: r.admin_memo ?? "",
    title: r.title,
    isPublicPost: r.is_public_post,
    isSecret: r.is_secret,
    isPublished: r.is_published,
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
      .select("id,name,phone,category,course_id,content,status,created_at,admin_memo,title,is_public_post,is_secret,is_published")
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
  category: Database["public"]["Enums"]["course_category"];
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
      "id,name,category,summary,skills,tuition,self_pay,sessions_total,session_hours,total_hours,recruit_status",
    )
    .eq("is_deleted", false)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    category: c.category,
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

export interface CurriculumEditRow {
  round: number;
  unit: string;
  contents: string[];
  hours: number | null;
  place: string;
}

/** 기능사 트랙의 시험일정 행(편집용). 빈 날짜는 "" 로 표현. */
export interface TrackExamEditRow {
  round: string;
  applyStart: string;
  applyEnd: string;
  examStart: string;
  examEnd: string;
  resultDates: string[];
}

/** 기능사 과정 트랙(편집용) — 트랙 기본정보 + 그 트랙의 시험일정. */
export interface TrackEditRow {
  id: string;
  name: string;
  description: string;
  sessionsTotal: number | null;
  price: number | null;
  scheduleSummary: string[];
  recruitStatus: Database["public"]["Enums"]["recruit_status"];
  year: number; // 시험 연도 — 그 트랙 시험행에서 도출(없으면 현재 연도)
  exams: TrackExamEditRow[];
}

export interface CourseBundle {
  course: CourseEditView;
  curriculum: CurriculumEditRow[];
  tracks: TrackEditRow[];
  applyInfo: ApplyInfoView | null;
}

/** 과정 수정용 — 과정별 기본정보 + 커리큘럼 + 트랙·시험일정 + 신청안내 묶음. */
export async function getCourseEditBundles(): Promise<CourseBundle[]> {
  const supabase = await createClient();
  const courses = await getCoursesForEdit();
  const [curRes, trackRes, examRes, infoRes] = await Promise.all([
    supabase.from("curriculum_item").select("course_id,round,unit,contents,hours,place"),
    supabase.from("course_track").select("*").order("sort_order", { ascending: true }),
    supabase.from("exam_schedule").select("*").order("sort_order", { ascending: true }),
    supabase.from("course_apply_info").select("*"),
  ]);

  const byCourse: Record<string, CurriculumEditRow[]> = {};
  for (const r of curRes.data ?? []) {
    (byCourse[r.course_id] ??= []).push({
      round: r.round,
      unit: r.unit ?? "",
      contents: r.contents ?? [],
      hours: r.hours,
      place: r.place ?? "",
    });
  }
  for (const k of Object.keys(byCourse)) byCourse[k].sort((a, b) => a.round - b.round);

  // 트랙별 시험일정 그룹
  const examsByTrack: Record<string, TrackExamEditRow[]> = {};
  for (const e of examRes.data ?? []) {
    (examsByTrack[e.track_id] ??= []).push({
      round: e.round,
      applyStart: e.apply_start ?? "",
      applyEnd: e.apply_end ?? "",
      examStart: e.exam_start ?? "",
      examEnd: e.exam_end ?? "",
      resultDates: e.result_dates ?? [],
    });
  }
  const yearByTrack: Record<string, number> = {};
  for (const e of examRes.data ?? []) {
    yearByTrack[e.track_id] = Math.max(yearByTrack[e.track_id] ?? 0, e.year);
  }
  const currentYear = new Date().getFullYear();

  // 과정별 트랙 그룹
  const tracksByCourse: Record<string, TrackEditRow[]> = {};
  for (const t of trackRes.data ?? []) {
    (tracksByCourse[t.course_id] ??= []).push({
      id: t.id,
      name: t.name,
      description: t.description ?? "",
      sessionsTotal: t.sessions_total,
      price: t.price,
      scheduleSummary: t.schedule_summary ?? [],
      recruitStatus: t.recruit_status,
      year: yearByTrack[t.id] ?? currentYear,
      exams: examsByTrack[t.id] ?? [],
    });
  }

  const infoByCourse: Record<string, ApplyInfoView> = {};
  for (const row of infoRes.data ?? []) infoByCourse[row.course_id] = applyInfoRowToView(row);

  return courses.map((c) => ({
    course: c,
    curriculum: byCourse[c.id] ?? [],
    tracks: tracksByCourse[c.id] ?? [],
    applyInfo: infoByCourse[c.id] ?? null,
  }));
}

export interface AdminPhotoView {
  id: number;
  label: string;
  image: string | null;
  category: LeafCategory | null;
  isFeatured: boolean;
}

export interface AdminPhotosResult {
  photos: AdminPhotoView[];
  featuredCount: number;
}

export async function getTrainingPhotos(): Promise<AdminPhotosResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("post")
    .select("id,title,images,gallery_category,is_featured,is_deleted,created_at")
    .eq("category", "훈련사진")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const photos = (data ?? []).map((p) => ({
    id: p.id,
    label: p.title,
    image: p.images[0] ? publicUrl(p.images[0]) : null,
    category: isLeafCategory(p.gallery_category) ? p.gallery_category : null,
    isFeatured: p.is_featured,
  }));
  return { photos, featuredCount: photos.filter((p) => p.isFeatured).length };
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

/** 공지 단건 조회(수정 폼 prefill용). 없으면 null. */
export async function getAdminNotice(id: number): Promise<AdminNoticeView | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notice")
    .select("id,title,body,is_pinned,published_at,created_at")
    .eq("id", id)
    .eq("is_deleted", false)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    title: data.title,
    body: data.body,
    date: fmtDate(data.published_at ?? data.created_at),
    pinned: data.is_pinned,
  };
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

/** 대시보드 KPI — 세부 페이지와 동일한 실데이터 집계. */
export async function getDashboardStats(): Promise<{
  todayViews: number;
  monthEnroll: number;
  pendingConsult: number;
}> {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();

  const [enrollRes, consultRes] = await Promise.all([
    supabase
      .from("application")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStart),
    supabase
      .from("inquiry")
      .select("id", { count: "exact", head: true })
      .eq("status", "답변대기"),
  ]);

  let todayViews = 0;
  try {
    const { count } = await supabase
      .from("event_log")
      .select("id", { count: "exact", head: true })
      .eq("name", "course_view")
      .gte("created_at", todayStart);
    todayViews = count ?? 0;
  } catch {
    // event_log 미적용 시 0
  }

  return {
    todayViews,
    monthEnroll: enrollRes.count ?? 0,
    pendingConsult: consultRes.count ?? 0,
  };
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

export interface AdminPopupView {
  id: number;
  title: string;
  isActive: boolean;
  hideOnMobile: boolean;
  kind: "renewal" | "image";
  imageUrl: string;
  mobileImageUrl: string;
  linkUrl: string;
}

/** 어드민 — 관리 대상 팝업 1건(싱글턴). 없으면 null. */
export async function getAdminPopup(): Promise<AdminPopupView | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("popup")
    .select("id, title, is_active, hide_on_mobile, kind, image_url, mobile_image_url, link_url")
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    title: data.title ?? "리뉴얼 안내 팝업",
    isActive: data.is_active,
    hideOnMobile: data.hide_on_mobile,
    kind: data.kind === "image" ? "image" : "renewal",
    imageUrl: data.image_url ?? "",
    mobileImageUrl: data.mobile_image_url ?? "",
    linkUrl: data.link_url ?? "",
  };
}
