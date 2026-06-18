"use client";

import { useState } from "react";
import type { AdminCourseView } from "@/lib/queries/admin";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

interface EditableCourse {
  id: string;
  name: string;
  open: boolean;
  capacity: string;
  start: string;
}

interface CourseEditorProps {
  initial: AdminCourseView[];
}

export function CourseEditor({ initial }: CourseEditorProps) {
  const [courses, setCourses] = useState<EditableCourse[]>(
    initial.map((c) => ({
      id: c.id,
      name: c.name,
      open: c.open,
      capacity: "",
      start: "",
    }))
  );

  function patch(id: string, key: keyof EditableCourse, val: string | boolean) {
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [key]: val } : c))
    );
  }

  return (
    <div className="flex flex-col gap-[14px]">
      {courses.map((course) => (
        <Card key={course.id} padding={20}>
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-muted font-semibold">
              과정 #{course.id}
            </span>
            <button
              type="button"
              onClick={() => patch(course.id, "open", !course.open)}
              className={[
                "inline-flex items-center gap-1.5 rounded-full px-3 h-8 text-[13px] font-semibold cursor-pointer",
                course.open
                  ? "bg-success-soft text-success"
                  : "bg-surface-strong text-muted",
              ].join(" ")}
            >
              <span
                className={[
                  "w-1.5 h-1.5 rounded-full",
                  course.open ? "bg-success" : "bg-muted-soft",
                ].join(" ")}
              />
              {course.open ? "모집중" : "마감"}
            </button>
          </div>

          {/* Body */}
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1.3fr] gap-3 mt-4">
            <Field
              label="과정명"
              value={course.name}
              onChange={(e) => patch(course.id, "name", e.target.value)}
            />
            <Field
              label="정원"
              value={course.capacity}
              onChange={(e) => patch(course.id, "capacity", e.target.value)}
              placeholder="예: 20명"
            />
            <Field
              label="개강일"
              value={course.start}
              onChange={(e) => patch(course.id, "start", e.target.value)}
              placeholder="신청 시 안내"
            />
          </div>

          {/* Footer */}
          <div className="mt-4 flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={() => console.log("저장", course)}
            >
              저장
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
