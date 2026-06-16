import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ErrorPage from "./error";

describe("error 페이지 (일시 오류/500)", () => {
  // error.tsx 는 useEffect 로 console.error(error) 를 호출하므로 출력을 조용히 한다.
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => vi.restoreAllMocks());

  const renderError = (retry = vi.fn()) =>
    render(<ErrorPage error={new Error("boom")} unstable_retry={retry} />);

  it("오류 제목을 보여준다", () => {
    renderError();
    expect(
      screen.getByRole("heading", { name: /일시적인 오류가 발생했어요/ }),
    ).toBeInTheDocument();
  });

  it("홈으로 돌아가기 링크(href=/)를 제공한다", () => {
    renderError();
    expect(
      screen.getByRole("link", { name: /홈으로 돌아가기/ }),
    ).toHaveAttribute("href", "/");
  });

  it("새로고침 버튼을 누르면 unstable_retry 를 호출한다", async () => {
    const retry = vi.fn();
    renderError(retry);
    await userEvent.click(screen.getByRole("button", { name: /새로고침/ }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
