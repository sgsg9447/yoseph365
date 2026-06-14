"use client";

// ApplyClient — ?course= 파라미터를 읽어 DB 모집안내(ApplyFlow)를 렌더.
// useSearchParams는 'use client' + Suspense 바운더리 안에서만 사용 가능.

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { ApplyFlow } from "@/components/apply/ApplyFlow";
import type { ApplyCourse } from "@/lib/queries/types";

function ApplyCoursePicker({
  courses,
  course,
  onChange,
}: {
  courses: ApplyCourse[];
  course: string;
  onChange: (c: string) => void;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 18 }}>
      <span style={{ fontSize: 15, fontWeight: 600, color: "var(--color-body-strong)" }}>
        신청 과정 선택
      </span>
      <select
        value={course}
        onChange={(e) => onChange(e.target.value)}
        style={{
          height: 52,
          padding: "0 14px",
          fontFamily: "var(--font-sans)",
          fontSize: 16,
          color: "var(--color-ink)",
          background: "var(--color-surface-card)",
          borderRadius: 12,
          outline: "none",
          cursor: "pointer",
          border: "1px solid var(--color-hairline-strong)",
          width: "100%",
        }}
      >
        {courses.map((c) => (
          <option key={c.name} value={c.name}>
            {c.name}
            {c.recruitStatus !== "모집중" ? " (모집마감)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ApplyClient({ courses }: { courses: ApplyCourse[] }) {
  const params = useSearchParams();
  const fromUrl = params.get("course") ?? "";
  const [course, setCourse] = useState(fromUrl || courses[0]?.name || "");

  const selected = courses.find((c) => c.name === course) ?? null;

  return (
    <Card padding={0} style={{ padding: "clamp(20px, 3.5vw, 32px)" }}>
      {/* 과정 선택기: ?course= 파라미터가 없을 때만 표시 */}
      {!fromUrl && courses.length > 0 && (
        <ApplyCoursePicker courses={courses} course={course} onChange={setCourse} />
      )}
      <ApplyFlow
        course={course}
        applyInfo={selected?.applyInfo ?? null}
        recruitStatus={selected?.recruitStatus ?? "모집중"}
      />
    </Card>
  );
}
