import { getAdminNotices } from "@/lib/queries/admin";
import { NoticeTable } from "./NoticeTable";

export default async function NoticePage() {
  const notices = await getAdminNotices();
  return <NoticeTable initial={notices} />;
}
