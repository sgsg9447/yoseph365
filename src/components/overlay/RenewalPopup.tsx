"use client";

import { useRouter } from "next/navigation";
import { Logo } from "@/components/layout/Logo";
import { Hammer, Clipboard, Message, ChevronRight, X, Check } from "@/components/icons";
import { usePopupGate } from "./usePopupGate";
import type { PopupConfig } from "@/lib/queries/popup";

// 리뉴얼 안내 팝업 — 첫 진입 시 자동 노출. 내용은 코드 고정(일회성 안내).
// 노출/닫기/24h억제는 usePopupGate가 담당(shouldShowPopup 순수함수에 위임).
// 상담문의 바텀시트는 SiteShell이 openConsult로 주입(순환 import 회피).
export function RenewalPopup({
  config,
  openConsult,
}: {
  config: PopupConfig;
  openConsult: (mode: "consult") => void;
}) {
  const router = useRouter();
  const { open, close, hideForToday, setHideForToday } = usePopupGate(config.hideOnMobile);

  function act(run: () => void) {
    close();
    run();
  }

  if (!open) return null;

  return (
    <div
      onClick={close}
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-auto p-[22px] bg-[rgba(12,10,9,0.52)] backdrop-blur-[3px]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="renewal-popup-head"
        onClick={(e) => e.stopPropagation()}
        className="rp-card relative w-full max-w-[462px] bg-surface-card rounded-[24px] overflow-hidden shadow-pop"
      >
        {/* Close (X) */}
        <button
          type="button"
          onClick={close}
          aria-label="닫기"
          className="absolute top-[14px] right-[14px] w-9 h-9 grid place-items-center rounded-full bg-white/70 backdrop-blur-[4px] text-muted hover:bg-white hover:text-ink transition"
        >
          <X size={20} strokeWidth={2.1} />
        </button>

        {/* Hero */}
        <div
          className="relative overflow-hidden text-center px-[34px] pt-[46px] pb-[30px] max-[480px]:px-6 max-[480px]:pt-10 max-[480px]:pb-[26px]"
          style={{ background: "linear-gradient(180deg, #f5f8ff 0%, #ffffff 78%)" }}
        >
          {/* Pastel orbs (장식) */}
          <span
            aria-hidden
            className="rp-orb absolute rounded-full pointer-events-none"
            style={{ width: 200, height: 200, top: -64, left: -52, background: "rgba(188,214,238,0.6)", filter: "blur(48px)" }}
          />
          <span
            aria-hidden
            className="rp-orb absolute rounded-full pointer-events-none"
            style={{ width: 176, height: 176, top: -40, right: -56, background: "rgba(211,198,230,0.52)", filter: "blur(48px)" }}
          />
          <span
            aria-hidden
            className="rp-orb absolute rounded-full pointer-events-none"
            style={{ width: 168, height: 168, bottom: -78, left: "32%", background: "rgba(246,210,185,0.46)", filter: "blur(48px)" }}
          />

          <div className="relative">
            <Logo className="rp-rise h-[34px] w-auto block mx-auto" />
            <h1
              id="renewal-popup-head"
              className="rp-rise font-bold text-ink text-[38px] leading-[1.26] tracking-[-0.4px] mt-[22px] mb-3 [word-break:keep-all] max-[480px]:text-[31px] max-[480px]:tracking-[-0.3px]"
              style={{ animationDelay: "0.14s" }}
            >
              홈페이지가
              <br />
              <span className="text-primary">새로워졌습니다</span>
            </h1>
            <p
              className="rp-rise text-[15.5px] leading-[1.62] text-muted [word-break:keep-all]"
              style={{ animationDelay: "0.22s" }}
            >
              2026년 7월, 더 보기 편하게 새단장했어요.
              <br />
              자주 찾는 메뉴를 한곳에 모았습니다.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-[34px] pb-[26px] max-[480px]:px-[18px]">
          <div className="flex flex-col gap-[9px]">
            <ActionRow
              primary
              icon={<Hammer size={22} />}
              title="과정 보기"
              desc="어떤 과정이 있는지 확인하세요"
              delay="0.34s"
              onClick={() => act(() => router.push("/courses"))}
            />
            <ActionRow
              icon={<Clipboard size={22} />}
              title="수강신청"
              desc="온라인으로 간편하게 접수"
              delay="0.41s"
              onClick={() => act(() => router.push("/apply"))}
            />
            <ActionRow
              icon={<Message size={22} />}
              title="상담문의"
              desc="궁금한 점을 바로 물어보세요"
              delay="0.48s"
              onClick={() => act(() => openConsult("consult"))}
            />
          </div>

          {/* Bottom bar */}
          <div
            className="rp-rise flex items-center justify-between gap-3 mt-4 pt-[15px] border-t border-hairline"
            style={{ animationDelay: "0.55s" }}
          >
            <button
              type="button"
              onClick={() => setHideForToday((v) => !v)}
              className="flex items-center gap-2 text-[13.5px] text-muted"
            >
              <span
                className={[
                  "w-5 h-5 rounded-[6px] grid place-items-center border-[1.5px] transition",
                  hideForToday
                    ? "bg-primary border-primary text-white"
                    : "border-hairline-strong text-transparent",
                ].join(" ")}
              >
                <Check size={13} strokeWidth={3} />
              </span>
              오늘 하루 열지 않기
            </button>
            <button
              type="button"
              onClick={close}
              className="text-[13.5px] font-semibold text-muted hover:text-ink hover:underline underline-offset-2 transition"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Action row ───────────────────────────────────────────────────────────────
function ActionRow({
  icon,
  title,
  desc,
  onClick,
  delay,
  primary = false,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
  delay: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: delay }}
      className={[
        "rp-rise group flex items-center gap-[13px] w-full text-left px-[14px] py-3 rounded-[14px] border transition",
        primary
          ? "bg-primary border-primary hover:bg-primary-hover"
          : "bg-surface-card border-hairline hover:-translate-y-px hover:border-primary-border hover:bg-primary-softer hover:shadow-[0_6px_20px_rgba(28,26,24,.08)]",
      ].join(" ")}
    >
      <span
        className={[
          "shrink-0 w-11 h-11 rounded-[12px] grid place-items-center",
          primary ? "bg-white/[0.18] text-white" : "bg-primary-soft text-primary",
        ].join(" ")}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={[
            "block text-[16px] font-bold tracking-[-0.3px]",
            primary ? "text-white" : "text-ink",
          ].join(" ")}
        >
          {title}
        </span>
        <span className={["block text-[12.5px]", primary ? "text-white/85" : "text-muted"].join(" ")}>
          {desc}
        </span>
      </span>
      <ChevronRight size={20} className={primary ? "text-white/70" : "text-muted-soft"} />
    </button>
  );
}
