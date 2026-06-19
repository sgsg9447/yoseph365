import { getAdminNotices } from "@/lib/queries/admin";
import { NoticeBoard } from "./NoticeBoard";

export default async function NoticePage() {
  const notices = await getAdminNotices();
  return <NoticeBoard initial={notices} />;
}
