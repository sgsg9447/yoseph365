"use client";

// ApplyClient — ?course= 파라미터를 읽어 DB 모집안내(ApplyFlow)를 렌더.
// useSearchParams는 'use client' + Suspense 바운더리 안에서만 사용 가능.

import { useCallback, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { ApplyFlow } from "@/components/apply/ApplyFlow";
import type { ApplyCourse } from "@/lib/queries/types";

function ApplyCoursePicker({
  courses,
  courseId,
  onChange,
}: {
  courses: ApplyCourse[];
  courseId: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = courses.find((c) => c.id === courseId) ?? courses[0];

  return (
    <div
      style={{
        border: "1px solid var(--color-hairline-strong)",
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 18,
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          padding: "13px 16px",
          border: "none",
          background: "var(--color-surface-card)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          fontFamily: "var(--font-sans)",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--color-ink)",
              lineHeight: 1.45,
              wordBreak: "keep-all",
            }}
          >
            {selected?.name}
          </span>
        </span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          style={{
            flex: "0 0 auto",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform .15s ease",
          }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            borderTop: "1px solid var(--color-hairline)",
            background: "var(--color-surface-card)",
          }}
        >
          {courses.map((c, i) => {
            const active = c.id === courseId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onChange(c.id);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "none",
                  borderBottom: i === courses.length - 1 ? "none" : "1px solid var(--color-hairline-soft)",
                  background: active ? "var(--color-primary-soft)" : "transparent",
                  color: active ? "var(--color-primary)" : "var(--color-body-strong)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 15,
                  fontWeight: active ? 700 : 600,
                  lineHeight: 1.45,
                  textAlign: "left",
                  wordBreak: "keep-all",
                  cursor: "pointer",
                }}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ApplyClient({ courses }: { courses: ApplyCourse[] }) {
  const params = useSearchParams();
  const fromUrl = params.get("course") ?? "";
  const formTopRef = useRef<HTMLDivElement>(null);
  // 수강신청 버튼으로 직접 진입(파라미터 없음) 시에는 모집중 과정만 선택지로 노출
  const openCourses = courses.filter((c) => c.recruitStatus === "모집중");
  const [courseId, setCourseId] = useState(fromUrl || openCourses[0]?.id || "");

  const selected = courses.find((c) => c.id === courseId) ?? null;
  const scrollToFormTop = useCallback(() => {
    formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <Card padding={0} style={{ padding: "clamp(20px, 3.5vw, 32px)" }}>
      <div ref={formTopRef} style={{ scrollMarginTop: 88 }} />
      {/* 과정 선택기: ?course= 파라미터가 없을 때만 표시 (모집중 과정만) */}
      {!fromUrl && openCourses.length > 0 && (
        <ApplyCoursePicker courses={openCourses} courseId={courseId} onChange={setCourseId} />
      )}
      <ApplyFlow
        course={selected?.name ?? ""}
        applyInfo={selected?.applyInfo ?? null}
        recruitStatus={selected?.recruitStatus ?? "모집중"}
        onFormStepEnter={scrollToFormTop}
      />
    </Card>
  );
}
