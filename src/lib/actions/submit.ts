"use server";

import { createPublicClient } from "@/lib/supabase/public";
import { applicationSchema, consultSchema } from "@/lib/validations/forms";

export type SubmitResult = { ok: true } | { ok: false; error: string };

const GENERIC_ERROR = "제출 중 오류가 발생했습니다. 잠시 후 다시 시도하거나 전화로 문의해 주세요.";

// 수강신청 → application INSERT (anon, RLS: privacy_agreed=true)
export async function submitApplication(input: unknown): Promise<SubmitResult> {
  const parsed = applicationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }
  const v = parsed.data;
  const noteParts = [
    v.birth && `생년월일: ${v.birth}`,
    v.gender && `성별: ${v.gender}`,
    v.address && `주소: ${v.address}`,
    v.career && `관련 경력: ${v.career}`,
    v.motivation && `지원동기: ${v.motivation}`,
  ].filter(Boolean) as string[];

  const sb = createPublicClient();
  const { error } = await sb.from("application").insert({
    name: v.name,
    phone: v.phone,
    selected_courses: [v.course],
    additional_note: noteParts.length ? noteParts.join("\n") : null,
    privacy_agreed: true,
  });
  if (error) return { ok: false, error: GENERIC_ERROR };
  return { ok: true };
}

// 상담신청 → inquiry INSERT (anon). 관심과정은 선택(course_id FK).
export async function submitConsult(input: unknown): Promise<SubmitResult> {
  const parsed = consultSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }
  const v = parsed.data;
  const contentParts = [
    v.message ? `추가문의: ${v.message}` : "상담 신청",
    v.email && `이메일: ${v.email}`,
  ].filter(Boolean) as string[];

  const sb = createPublicClient();
  const { error } = await sb.from("inquiry").insert({
    name: v.name,
    phone: v.phone,
    category: v.courseId ? "과정문의" : "기타",
    course_id: v.courseId || null,
    content: contentParts.join("\n"),
    privacy_agreed: true,
  });
  if (error) return { ok: false, error: GENERIC_ERROR };
  return { ok: true };
}
