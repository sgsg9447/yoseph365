"use client";

// ApplyClient — ?course= 파라미터를 읽어 ApplyFlow를 렌더.
// useSearchParams는 'use client' + Suspense 바운더리 안에서만 사용 가능.
// 참조: HANDOFF/ui_kits/website/apply.jsx (ApplyPage, ApplyCoursePicker, APPLY_COURSES)

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { ApplyFlow } from "@/components/apply/ApplyFlow";
import { APPLY_COURSES } from "@/lib/data/courses";

function ApplyCoursePicker({
  course,
  onChange,
}: {
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
        {APPLY_COURSES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ApplyClient() {
  const params = useSearchParams();
  const fromUrl = params.get("course") ?? "";
  const [course, setCourse] = useState(fromUrl || APPLY_COURSES[0]);

  return (
    <Card padding={0} style={{ padding: "clamp(20px, 3.5vw, 32px)" }}>
      {/* 과정 선택기: ?course= 파라미터가 없을 때만 표시 */}
      {!fromUrl && (
        <ApplyCoursePicker course={course} onChange={setCourse} />
      )}
      {/* 3단계 위저드: ApplyFlow가 완료 후 첫 화면으로 돌아감 */}
      <ApplyFlow course={course} />
    </Card>
  );
}
