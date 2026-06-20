import { notFound } from "next/navigation";
import { getAdminNotice } from "@/lib/queries/admin";
import { NoticeForm } from "../../NoticeForm";

export default async function EditNoticePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0) notFound();

  const notice = await getAdminNotice(numId);
  if (!notice) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[18px] font-bold text-ink">공지 수정</h2>
      <NoticeForm
        mode="edit"
        initial={{
          id: notice.id,
          title: notice.title,
          body: notice.body,
          pinned: notice.pinned,
        }}
      />
    </div>
  );
}
