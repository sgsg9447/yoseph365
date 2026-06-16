"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ErrorScreen } from "@/components/layout/ErrorScreen";
import { Home, Reload } from "@/components/icons";

// 런타임 에러 경계: (public) 페이지에서 올라온 에러를 잡고 app/layout.tsx
// (크롬 없음) 안에서 단독 풀스크린으로 렌더한다. 네트워크 오류도 여기에 통합.
// Next 16.2: 복구 prop 은 unstable_retry (reset 보다 권장) — 재페치·재렌더.
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      {/* 클라이언트 컴포넌트라 metadata export 불가 → React <title> 사용 */}
      <title>오류가 발생했습니다 — 성요셉목수학교</title>
      <ErrorScreen
        title="일시적인 오류가 발생했어요"
        desc={
          <>
            서버에 문제가 생겼습니다.
            <br />
            잠시 후 새로고침해 주세요.
          </>
        }
        actions={
          <>
            <Link
              href="/"
              className="inline-flex h-14 items-center justify-center gap-[9px] rounded-button border border-primary bg-primary px-7 text-[18px] font-semibold text-white transition hover:bg-primary-hover active:scale-[0.98]"
            >
              <Home size={20} />
              홈으로 돌아가기
            </Link>
            <button
              type="button"
              onClick={() => unstable_retry()}
              className="inline-flex h-14 items-center justify-center gap-[9px] rounded-button border border-hairline-strong bg-transparent px-7 text-[18px] font-semibold text-ink transition hover:border-muted-soft active:scale-[0.98]"
            >
              <Reload size={20} />
              새로고침
            </button>
          </>
        }
      />
    </>
  );
}
