// admin 데스크탑 알림용 순수 라벨 로직. 서버·클라이언트 어디서도 import 가능(부수효과 없음).

export type NotifType = "application" | "inquiry";

export interface NotifItem {
  type: NotifType;
  id: number;
  label: string;
}

interface AppRow {
  id: number;
  // 수강신청은 selected_courses에 과정명(문자열)이 그대로 저장된다(course.id가 아님).
  selected_courses: string[];
}

interface InqRow {
  id: number;
  category: string;
  course_id: string | null;
}

/** 수강신청 과정 라벨: 1개면 과정명, 여러 개면 'OO 외 N건', 없으면 '신청 과정 미선택'. */
function applicationLabel(courseNamesList: string[]): string {
  const names = courseNamesList.map((s) => s.trim()).filter((s) => s.length > 0);
  if (names.length === 0) return "신청 과정 미선택";
  if (names.length === 1) return names[0];
  return `${names[0]} 외 ${names.length - 1}건`;
}

/**
 * 새 수강신청·상담문의 행을 PII 없는 알림 아이템으로 변환. 수강신청 먼저, 그다음 상담문의.
 * courseNames는 상담문의의 course_id → 과정명 매핑용(수강신청은 과정명이 이미 저장됨).
 */
export function buildNotificationItems(
  apps: AppRow[],
  inquiries: InqRow[],
  courseNames: Record<string, string>,
): NotifItem[] {
  const items: NotifItem[] = [];
  for (const a of apps) {
    items.push({
      type: "application",
      id: a.id,
      label: applicationLabel(a.selected_courses),
    });
  }
  for (const q of inquiries) {
    const label = (q.course_id && courseNames[q.course_id]) || q.category;
    items.push({ type: "inquiry", id: q.id, label });
  }
  return items;
}
