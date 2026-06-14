"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "@/components/icons";
import { MobileMenu } from "./MobileMenu";
import { Logo } from "./Logo";
import { NAV_FUNDING } from "@/lib/data/site";

interface HeaderProps {
  /** Current route, e.g. "/about", "/courses" */
  active?: string;
}

export function Header({ active }: HeaderProps) {
  const [drop, setDrop] = useState(false);
  const [menu, setMenu] = useState(false);

  const linkCls = (href: string) =>
    [
      "text-[15px] no-underline",
      active === href
        ? "font-bold text-primary"
        : "font-medium text-body-strong",
    ].join(" ");

  return (
    <header
      className="sticky top-0 z-30 border-b border-hairline"
      style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "saturate(180%) blur(10px)",
      }}
    >
      <div className="wrap flex items-center justify-between h-[66px]">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center">
          <Logo className="h-9 w-auto block" />
        </Link>

        {/* Desktop nav */}
        <nav className="nav-menu items-center gap-7">
          <Link href="/about" className={linkCls("/about")}>학원소개</Link>
          <Link href="/courses" className={linkCls("/courses")}>과정 안내</Link>

          {/* 국비지원 dropdown */}
          <span
            className="relative inline-flex"
            onMouseEnter={() => setDrop(true)}
            onMouseLeave={() => setDrop(false)}
          >
            <Link
              href="/funding"
              className={[linkCls("/funding"), "inline-flex items-center gap-[3px]"].join(" ")}
            >
              국비지원
              <ChevronRight
                size={13}
                className={[
                  "text-muted transition-transform duration-[180ms]",
                  drop ? "rotate-[270deg]" : "rotate-90",
                ].join(" ")}
              />
            </Link>
            {drop && (
              <span className="absolute top-full left-1/2 -translate-x-1/2 pt-3 z-50">
                <span className="flex flex-col min-w-[218px] bg-surface-card border border-hairline rounded-[14px] shadow-pop p-[6px]">
                  {NAV_FUNDING.map((s) => (
                    <Link
                      key={s.href}
                      href={s.href}
                      className="drop-link px-[14px] py-[11px] rounded-[9px] text-[14.5px] font-semibold text-body-strong no-underline whitespace-nowrap"
                    >
                      {s.label}
                    </Link>
                  ))}
                </span>
              </span>
            )}
          </span>

          <Link href="/photos" className={linkCls("/photos")}>훈련 사진</Link>
          <Link href="/notice" className={linkCls("/notice")}>공지사항</Link>
          <Link href="/inquiry" className={linkCls("/inquiry")}>상담문의</Link>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-[10px]">
          <Link
            href="/apply"
            className="inline-flex items-center gap-[7px] h-[42px] px-5 bg-primary text-white rounded-[10px] text-[15px] font-semibold no-underline font-[inherit]"
          >
            수강신청
          </Link>
          <span className="only-mobile">
            <button
              onClick={() => setMenu(true)}
              aria-label="메뉴 열기"
              className="h-[42px] px-[14px] grid place-items-center rounded-[10px] bg-transparent border border-hairline-strong text-ink cursor-pointer font-[inherit] text-[15px] font-bold"
            >
              메뉴
            </button>
          </span>
        </div>
      </div>

      {menu && <MobileMenu active={active} onClose={() => setMenu(false)} />}
    </header>
  );
}
