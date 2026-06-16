"use client";

import { useSyncExternalStore } from "react";
import { Splash } from "./Splash";

// 첫 진입 스플래시: 루트 레이아웃에 SSR 로 깔리는 전체화면 오버레이.
// useSyncExternalStore 로 하이드레이션 여부를 판별 — 서버 스냅샷은 false(스플래시
// 출력), 클라이언트는 true(제거). Splash 의 splash-fade(0.25s 지연 등장) 덕에
// 빠른 첫 로딩에선 보이지 않고 느릴 때만 잠깐 나타난다.
// .initial-splash 의 CSS 안전 페이드아웃은 JS 미동작 시 영구 차단을 막는 대비책.
const subscribe = () => () => {};

export function InitialSplash() {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  if (hydrated) return null;

  return (
    <div className="initial-splash">
      <Splash />
    </div>
  );
}
