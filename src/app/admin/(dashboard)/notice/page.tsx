import { getAdminNotices } from "@/lib/queries/admin";
import { NoticeCompose } from "./NoticeCompose";

export default async function NoticePage() {
  const notices = await getAdminNotices();
  return <NoticeCompose initial={notices} />;
}
