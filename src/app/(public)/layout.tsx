import { SiteShell } from "@/components/layout/SiteShell";
import { getActivePopup, type PopupConfig } from "@/lib/queries/popup";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let popup: PopupConfig | null;
  try {
    popup = await getActivePopup();
  } catch {
    popup = null;
  }
  return <SiteShell popup={popup}>{children}</SiteShell>;
}
