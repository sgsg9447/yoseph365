import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { IntentCard } from "./IntentCard";

describe("IntentCard", () => {
  it("제목과 설명을 보여주고 클릭하면 onClick을 호출한다", async () => {
    const onClick = vi.fn();
    render(
      <IntentCard
        title="재취업 준비"
        desc="목공 기술로 새 일자리를 찾고 싶어요"
        onClick={onClick}
      />,
    );

    expect(screen.getByText("재취업 준비")).toBeInTheDocument();
    expect(
      screen.getByText("목공 기술로 새 일자리를 찾고 싶어요"),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByText("재취업 준비"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("장식용 아이콘 타일(파스텔 박스) 없이 텍스트 중심으로 렌더한다", () => {
    const { container } = render(
      <IntentCard title="자격증 취득" desc="목공·건축 자격증을 따고 싶어요" />,
    );

    // 52x52 파스텔 아이콘 타일(rounded-[14px])을 더 이상 렌더하지 않는다
    expect(container.querySelector(".rounded-\\[14px\\]")).toBeNull();
  });
});
