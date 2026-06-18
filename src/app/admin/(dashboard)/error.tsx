// src/app/admin/(dashboard)/error.tsx
"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-7 flex flex-col gap-3 items-start">
      <p className="text-body">데이터를 불러오지 못했습니다.</p>
      <button onClick={reset} className="text-primary font-semibold">다시 시도</button>
    </div>
  );
}
