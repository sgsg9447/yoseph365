"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { courseEditSchema, curriculumSaveSchema, applyInfoSchema } from "@/lib/validations/forms";

export type CourseResult = { ok: true } | { ok: false; error: string };

const GENERIC = "저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";

/** 과정(course) 표시 데이터 저장 — 관리자(authenticated)만. 공개 페이지(ISR) 재검증 포함. */
export async function updateCourse(input: unknown): Promise<CourseResult> {
  const parsed = courseEditSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }
  const v = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("course")
    .update({
      name: v.name,
      summary: v.summary || null,
      skills: v.skills,
      tuition: v.tuition || null,
      self_pay: v.selfPay || null,
      sessions_total: v.sessionsTotal,
      session_hours: v.sessionHours || null,
      total_hours: v.totalHours,
      recruit_status: v.recruitStatus,
    })
    .eq("id", v.id);
  if (error) return { ok: false, error: "저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." };

  // 공개 화면(ISR)·관리자 목록 재검증
  revalidatePath("/courses");
  revalidatePath(`/courses/${v.id}`);
  revalidatePath("/admin/courses");
  return { ok: true };
}

/** 과정 커리큘럼(회차표) 전체 교체 저장. */
export async function updateCurriculum(input: unknown): Promise<CourseResult> {
  const parsed = curriculumSaveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }
  const { courseId, rows } = parsed.data;

  const supabase = await createClient();
  const del = await supabase.from("curriculum_item").delete().eq("course_id", courseId);
  if (del.error) return { ok: false, error: GENERIC };

  if (rows.length > 0) {
    const ins = await supabase.from("curriculum_item").insert(
      rows.map((r) => ({
        course_id: courseId,
        round: r.round,
        unit: r.unit || null,
        contents: r.contents,
        hours: r.hours,
        place: r.place || null,
      })),
    );
    if (ins.error) return { ok: false, error: GENERIC };
  }

  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/admin/courses");
  return { ok: true };
}

/** 과정 신청안내(course_apply_info) 저장(upsert). */
export async function updateApplyInfo(input: unknown): Promise<CourseResult> {
  const parsed = applyInfoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }
  const v = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("course_apply_info").upsert(
    {
      course_id: v.courseId,
      qualifications: v.qualifications,
      apply_method: v.applyMethod,
      recruit_period: v.recruitPeriod || null,
      training_period: v.trainingPeriod || null,
      training_time: v.trainingTime,
      capacity: v.capacity || null,
      cost: v.cost || null,
      cost_notes: v.costNotes,
      steps: v.steps,
      exclusions: v.exclusions,
    },
    { onConflict: "course_id" },
  );
  if (error) return { ok: false, error: GENERIC };

  revalidatePath("/courses");
  revalidatePath(`/courses/${v.courseId}`);
  revalidatePath("/apply");
  revalidatePath("/admin/courses");
  return { ok: true };
}
