import type { Metadata } from "next";
import Link from "next/link";
import { ErrorScreen } from "@/components/layout/ErrorScreen";
import { Home } from "@/components/icons";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다 — 성요셉목수학교",
};

// 루트 not-found: app/layout.tsx(html/body·폰트, 크롬 없음) 안에서 단독 풀스크린
// 렌더된다. notFound() 호출과 매칭되지 않는 모든 URL(404)을 처리.
export default function NotFound() {
  return (
    <ErrorScreen
      title="페이지를 찾을 수 없습니다"
      desc={
        <>
          주소가 바뀌었거나 삭제된 페이지일 수 있어요.
          <br />
          아래에서 원하시는 정보를 찾아보세요.
        </>
      }
      actions={
        <Link
          href="/"
          className="inline-flex h-14 items-center justify-center gap-[9px] rounded-button border border-primary bg-primary px-7 text-[18px] font-semibold text-white transition hover:bg-primary-hover active:scale-[0.98]"
        >
          <Home size={20} />
          홈으로 돌아가기
        </Link>
      }
    />
  );
}
