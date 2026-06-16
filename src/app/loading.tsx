import { Splash } from "@/components/layout/Splash";

// 루트 loading: 앱 전체 Suspense fallback. 모든 공개 페이지가 ISR 로 prerender
// 되어 평소 이동은 즉시 끝나므로, 동적·미프리페치 등 "정말 느린" 이동에서만
// 전체화면 브랜드 스플래시가 나타난다.
export default function Loading() {
  return <Splash />;
}
