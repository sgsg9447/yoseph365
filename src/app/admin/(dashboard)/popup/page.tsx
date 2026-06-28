import { getAdminPopup } from "@/lib/queries/admin";
import { PopupManager } from "./PopupManager";

export default async function PopupPage() {
  const popup = await getAdminPopup();

  if (!popup) {
    return (
      <p className="text-muted text-[14px] mt-6 text-center">
        관리할 팝업이 없습니다. 데이터가 준비되면 다시 시도해 주세요.
      </p>
    );
  }

  return <PopupManager initial={popup} />;
}
