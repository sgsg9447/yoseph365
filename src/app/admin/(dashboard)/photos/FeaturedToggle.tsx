"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFeatured } from "./actions";

export function FeaturedToggle({ id, on }: { id: number; on: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onClick() {
    setErr(null);
    start(async () => {
      const res = await toggleFeatured({ id, on: !on });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={on}
      title={err ?? (on ? "메인에서 내리기" : "메인에 올리기")}
      className="absolute top-2 left-2 rounded-md px-2 py-1 text-[12px] font-bold disabled:opacity-60"
      style={{
        background: on ? "var(--color-primary)" : "rgba(0,0,0,0.55)",
        color: "#fff",
      }}
    >
      {on ? "메인 노출 ✓" : "메인 올리기"}
    </button>
  );
}
