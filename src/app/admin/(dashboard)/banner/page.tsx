import { BannerManager } from "./BannerManager";
import { DEMO_BANNERS } from "@/lib/admin/banner";

export default function BannerPage() {
  return <BannerManager initial={DEMO_BANNERS} />;
}
