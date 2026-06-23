import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import GlobalError from "./global-error";

describe("global-error 페이지", () => {
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => vi.restoreAllMocks());

  const renderGlobalError = (retry = vi.fn()) =>
    render(<GlobalError error={new Error("boom")} unstable_retry={retry} />);

  it("root layout 밖 오류도 한국어 오류 화면으로 보여준다", () => {
    renderGlobalError();
    expect(
      screen.getByRole("heading", { name: /일시적인 오류가 발생했어요/ }),
    ).toBeInTheDocument();
  });

  it("홈 링크와 새로고침 버튼을 제공한다", async () => {
    const retry = vi.fn();
    renderGlobalError(retry);

    expect(screen.getByRole("link", { name: /홈으로 돌아가기/ })).toHaveAttribute(
      "href",
      "/",
    );
    await userEvent.click(screen.getByRole("button", { name: /새로고침/ }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
