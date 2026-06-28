"use client";

import { createContext, useContext, useState } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { StickyBar } from "./StickyBar";
import { ConsultSheet } from "@/components/overlay/ConsultSheet";
import { RenewalPopup } from "@/components/overlay/RenewalPopup";
import { ImagePopup } from "@/components/overlay/ImagePopup";
import type { PopupConfig } from "@/lib/queries/popup";
import { usePathname } from "next/navigation";

// ── ConsultContext ─────────────────────────────────────────────────────────────

type SheetMode = "consult" | "inquiry";

interface ConsultContextValue {
  openConsult: (mode: SheetMode) => void;
}

const ConsultContext = createContext<ConsultContextValue>({
  openConsult: () => {},
});

export function useConsult(): ConsultContextValue {
  return useContext(ConsultContext);
}

// ── SiteShell ─────────────────────────────────────────────────────────────────

interface SiteShellProps {
  children: React.ReactNode;
  popup?: PopupConfig | null;
}

export function SiteShell({ children, popup = null }: SiteShellProps) {
  const [sheetMode, setSheetMode] = useState<SheetMode | null>(null);
  const pathname = usePathname();

  const openConsult = (mode: SheetMode) => setSheetMode(mode);
  const closeSheet = () => setSheetMode(null);

  return (
    <ConsultContext.Provider value={{ openConsult }}>
      <Header active={pathname} />
      <main>{children}</main>
      <Footer />
      <StickyBar onConsult={() => openConsult("consult")} />
      {sheetMode && (
        <ConsultSheet open mode={sheetMode} onClose={closeSheet} />
      )}
      {popup &&
        (popup.kind === "image" ? (
          <ImagePopup config={popup} />
        ) : (
          <RenewalPopup config={popup} openConsult={openConsult} />
        ))}
    </ConsultContext.Provider>
  );
}
