import { render, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { FundingClient } from "./FundingClient";

function activeScreen(container: HTMLElement): string | null | undefined {
  return container
    .querySelector("[data-screen-label]")
    ?.getAttribute("data-screen-label");
}

describe("FundingClient 헤더 해시 내비게이션", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/funding");
  });

  it("같은 페이지에서 헤더 드롭다운(pushState)으로 해시가 바뀌면 해당 탭으로 전환된다", async () => {
    const { container } = render(<FundingClient initialTab="nbcard" />);
    expect(activeScreen(container)).toBe("국민내일배움카드 안내");

    // 헤더의 <Link href="/funding#sanjae"> 클릭 = Next App Router의 same-page pushState.
    // pushState는 hashchange를 발생시키지 않으므로 탭이 그대로 머무는 버그를 재현한다.
    await act(async () => {
      window.history.pushState(null, "", "/funding#sanjae");
    });

    expect(activeScreen(container)).toBe("산재노동자 직업훈련");
  });
});
