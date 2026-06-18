// src/app/admin/(dashboard)/layout.tsx
import type { ReactNode } from "react";
import { AdminShell } from "./AdminShell";
import { ADMIN_TABS } from "../nav";
import { getSidebarCounts } from "@/lib/queries/admin";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const counts = await getSidebarCounts();
  return (
    <AdminShell tabs={ADMIN_TABS} counts={counts}>
      {children}
    </AdminShell>
  );
}
