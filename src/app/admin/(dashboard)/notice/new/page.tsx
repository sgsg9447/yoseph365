import { NoticeForm } from "../NoticeForm";

export default function NewNoticePage() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[18px] font-bold text-ink">새 공지 작성</h2>
      <NoticeForm mode="create" />
    </div>
  );
}
