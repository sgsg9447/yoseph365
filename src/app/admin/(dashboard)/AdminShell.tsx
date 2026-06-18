// src/app/admin/(dashboard)/AdminShell.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { AdminTab } from "../nav";
import {
  Home,
  TrendingUp,
  Clipboard,
  Message,
  Hammer,
  Star,
  ImageIcon,
  FileText,
  Menu,
  X,
} from "@/components/icons";

interface AdminShellProps {
  tabs: AdminTab[];
  counts: { pending: number; newInquiries: number };
  children: ReactNode;
}

const TAB_ICONS: Record<string, ReactNode> = {
  overview: <Home size={18} />,
  clicks: <TrendingUp size={18} />,
  enroll: <Clipboard size={18} />,
  consult: <Message size={18} />,
  course: <Hammer size={18} />,
  banner: <Star size={18} />,
  photo: <ImageIcon size={18} />,
  notice: <FileText size={18} />,
};

function useActiveTab(tabs: AdminTab[]) {
  const pathname = usePathname();
  return (tab: AdminTab) => {
    if (tab.href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(tab.href);
  };
}

function formatKoreanDate(date: Date): string {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const dow = days[date.getDay()];
  return `${y}. ${m}. ${d} (${dow})`;
}

export function AdminShell({ tabs, counts, children }: AdminShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isActive = useActiveTab(tabs);

  const currentTab = tabs.find(isActive) ?? tabs[0];
  const today = formatKoreanDate(new Date());

  const sidebarContent = (
    <>
      {/* Logo */}
      <div style={{ margin: "6px 6px 28px" }}>
        <Image
          src="/logo/logo-primary.png"
          alt="성요셉목수학교"
          height={36}
          width={144}
          style={{ height: 36, width: "auto" }}
          priority
        />
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {tabs.map((tab) => {
          const active = isActive(tab);
          const count = tab.countKey ? counts[tab.countKey] : 0;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              onClick={() => setDrawerOpen(false)}
              className={[
                "flex items-center gap-3 w-full h-[46px] px-[14px] rounded-xl text-[15px] text-left transition-colors",
                active
                  ? "bg-primary-soft text-primary font-semibold"
                  : "text-body-strong font-medium hover:bg-hairline-soft",
              ].join(" ")}
            >
              {TAB_ICONS[tab.key]}
              <span className="flex-1 text-left">{tab.label}</span>
              {count > 0 && (
                <span className="ml-auto bg-primary text-white text-[12px] font-bold rounded-full min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <form method="post" action="/admin/logout">
        <button
          type="submit"
          className="flex items-center gap-3 w-full h-[46px] px-[14px] rounded-xl text-[15px] font-medium text-body-strong hover:bg-error-soft hover:text-error transition-colors"
        >
          로그아웃
        </button>
      </form>
    </>
  );

  return (
    <div className="flex min-h-screen bg-canvas-soft">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[252px] flex-shrink-0 flex-col sticky top-0 h-screen bg-white border-r border-hairline px-4 py-6">
        {sidebarContent}
      </aside>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={[
          "fixed top-0 left-0 h-screen w-[252px] flex-col bg-white border-r border-hairline px-4 py-6 z-40 transition-transform duration-200 flex lg:hidden",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="메뉴 닫기"
            className="p-1 text-muted hover:text-ink"
          >
            <X size={20} />
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between border-b border-hairline px-7 py-5"
          style={{ background: "rgba(252,252,251,.88)", backdropFilter: "saturate(180%) blur(8px)" }}
        >
          <div className="flex items-center gap-4">
            {/* Hamburger — mobile only */}
            <button
              className="lg:hidden p-1 text-body-strong hover:text-ink"
              onClick={() => setDrawerOpen(true)}
              aria-label="메뉴 열기"
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 className="text-[24px] font-bold tracking-[-0.4px] text-ink leading-tight">
                {currentTab.title}
              </h1>
              <p className="text-[14px] text-muted">{currentTab.desc}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Date — hidden below md */}
            <span className="hidden md:block text-[14px] text-muted">{today}</span>
            {/* Avatar pill */}
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-full bg-surface-strong text-ink font-bold inline-flex items-center justify-center text-[15px]">
                관
              </span>
              <span className="text-[14px] font-semibold text-body-strong">관리자</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-7 flex-1">{children}</main>
      </div>
    </div>
  );
}
