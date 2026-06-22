import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { KpiCard } from "./KpiCard";

describe("KpiCard", () => {
  it("href가 있으면 카드를 해당 링크로 감싼다", () => {
    render(
      <KpiCard label="오늘 과정 조회" value="9회" icon={<span />} href="/admin/clicks" />,
    );
    const link = screen.getByRole("link", { name: /오늘 과정 조회/ });
    expect(link).toHaveAttribute("href", "/admin/clicks");
  });

  it("href가 없으면 링크가 아니다", () => {
    render(<KpiCard label="상담 대기" value="0건" icon={<span />} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
