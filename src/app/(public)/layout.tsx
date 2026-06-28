import { SiteShell } from "@/components/layout/SiteShell";
import { getActivePopup } from "@/lib/queries/popup";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const popup = await getActivePopup();
  return <SiteShell popup={popup}>{children}</SiteShell>;
}
