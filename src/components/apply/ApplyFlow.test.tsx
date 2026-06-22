import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { ApplyFlow } from "@/components/apply/ApplyFlow";
import { APPLY_FORM_URL, APPLY_FORM_FILENAME } from "@/lib/data/site";
import type { ApplyInfoView } from "@/lib/queries/types";

const applyInfo: ApplyInfoView = {
  qualifications: ["내일배움카드 보유자"],
  applyMethod: [],
  recruitPeriod: null,
  trainingPeriod: "26.07.11 ~ 26.09.13",
  trainingTime: ["토 09:00 ~ 17:40"],
  capacity: null,
  cost: "1,022,960원",
  costNotes: ["최대자비부담금 455,540원"],
  steps: ["학원 전화", "가등록", "고용24 결제", "등록 완료"],
  exclusions: ["상용직 취업상태인 자"],
};

describe("ApplyFlow", () => {
  it("모집중일 때 '확인했어요'를 누르면 신청서 단계로 간다", async () => {
    render(<ApplyFlow course="주말 건축목공과정" applyInfo={applyInfo} recruitStatus="모집중" />);
    const nav = screen.getByRole("navigation", { name: "신청 진행 단계" });
    expect(within(nav).getByText("모집안내")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /신청서 작성하기/ }));
    expect(screen.getByText(/성명/)).toBeInTheDocument();
  });
  it("동의 전에는 제출이 완료로 넘어가지 않는다", async () => {
    render(<ApplyFlow course="주말 건축목공과정" applyInfo={applyInfo} recruitStatus="모집중" />);
    await userEvent.click(screen.getByRole("button", { name: /신청서 작성하기/ }));
    await userEvent.click(screen.getByRole("button", { name: /신청서 제출하기/ }));
    expect(screen.queryByText(/접수가 완료/)).not.toBeInTheDocument();
  });
  it("모집중이 아니면 신청서 작성 버튼이 없다", () => {
    render(<ApplyFlow course="주말 건축목공과정" applyInfo={applyInfo} recruitStatus="마감" />);
    expect(screen.queryByRole("button", { name: /신청서 작성하기/ })).not.toBeInTheDocument();
    expect(screen.getByText(/현재 모집 중이 아닙니다/)).toBeInTheDocument();
  });
  it("지원방법(신청서 접수)이 있으면 신청서 다운로드 링크를 보여준다", () => {
    render(
      <ApplyFlow
        course="평일 건축목공과정"
        applyInfo={{
          ...applyInfo,
          applyMethod: ["이메일로 접수", "신청서는 아래에서 다운받아 주시기 바랍니다."],
        }}
        recruitStatus="모집중"
      />,
    );
    const link = screen.getByRole("link", { name: /신청서 다운로드/ });
    expect(link).toHaveAttribute("href", APPLY_FORM_URL);
    expect(link).toHaveAttribute("download", APPLY_FORM_FILENAME);
  });
  it("지원방법이 없으면 신청서 다운로드 링크가 없다", () => {
    render(<ApplyFlow course="주말 건축목공과정" applyInfo={applyInfo} recruitStatus="모집중" />);
    expect(screen.queryByRole("link", { name: /신청서 다운로드/ })).not.toBeInTheDocument();
  });
});
