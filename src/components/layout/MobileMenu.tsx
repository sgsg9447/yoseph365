"use client";

import Link from "next/link";
import { X, ChevronRight } from "@/components/icons";
import { Logo } from "./Logo";
import { NAV_FUNDING } from "@/lib/data/site";

interface MobileMenuProps {
  active?: string;
  onClose: () => void;
}

export function MobileMenu({ active, onClose }: MobileMenuProps) {
  const itemCls = (href: string) =>
    [
      "flex items-center justify-between py-[15px] text-[17px] font-semibold no-underline border-b border-hairline",
      active === href ? "text-primary" : "text-ink",
    ].join(" ");

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] bg-[rgba(12,10,9,0.45)]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-card rounded-[0_0_22px_22px] px-[22px] pt-3 pb-6 shadow-pop max-h-[88vh] overflow-y-auto"
        style={{ animation: "menuDown .22s cubic-bezier(0.2,0,0,1)" }}
      >
        {/* Top row */}
        <div className="h-[54px] flex items-center justify-between">
          <Logo className="h-8 w-auto" />
          <button
            onClick={onClose}
            aria-label="메뉴 닫기"
            className="w-[38px] h-[38px] grid place-items-center rounded-full bg-surface-strong border-none text-body cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col">
          <Link href="/about" className={itemCls("/about")} onClick={onClose}>
            학원소개 <ChevronRight size={17} className="text-muted-soft" />
          </Link>
          <Link href="/courses" className={itemCls("/courses")} onClick={onClose}>
            과정 안내 <ChevronRight size={17} className="text-muted-soft" />
          </Link>

          {/* 국비지원 expandable sub-menu */}
          <div className="border-b border-hairline py-[15px] flex flex-col">
            <span
              className={[
                "text-[17px] font-semibold",
                active === "/funding" ? "text-primary" : "text-ink",
              ].join(" ")}
            >
              국비지원
            </span>
            <div className="flex flex-col mt-2 border-l-2 border-hairline pl-[14px]">
              {NAV_FUNDING.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="py-[10px] text-[15.5px] font-medium text-body no-underline"
                  onClick={onClose}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>

          <Link href="/photos" className={itemCls("/photos")} onClick={onClose}>
            훈련 사진 <ChevronRight size={17} className="text-muted-soft" />
          </Link>
          <Link
            href="/inquiry"
            className={[itemCls("/inquiry"), "border-b-0"].join(" ")}
            onClick={onClose}
          >
            상담문의 <ChevronRight size={17} className="text-muted-soft" />
          </Link>
        </nav>

        {/* Apply CTA */}
        <Link
          href="/apply"
          className="flex items-center justify-center h-[54px] mt-[18px] bg-primary text-white rounded-button text-[16.5px] font-bold no-underline"
          onClick={onClose}
        >
          수강신청하기
        </Link>
      </div>
    </div>
  );
}
