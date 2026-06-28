"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Hammer, Clipboard, Message } from "@/components/icons";
import type { AdminPopupView } from "@/lib/queries/admin";
import { updatePopupSettings } from "./actions";

export function PopupManager({ initial }: { initial: AdminPopupView }) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(initial.isActive);
  const [hideOnMobile, setHideOnMobile] = useState(initial.hideOnMobile);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const dirty = isActive !== initial.isActive || hideOnMobile !== initial.hideOnMobile;

  async function save() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    const res = await updatePopupSettings({ id: initial.id, isActive, hideOnMobile });
    setBusy(false);
    if (!res.ok) {
      setMsg({ ok: false, text: res.error });
      return;
    }
    setMsg({ ok: true, text: "저장되었습니다." });
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 items-start max-w-[920px]">
      {/* 설정 */}
      <Card padding={20} className="order-2 lg:order-1">
        <h2 className="text-[17px] font-bold text-ink">노출 설정</h2>
        <p className="text-[13px] text-muted mt-1">
          팝업 내용(리뉴얼 안내·과정보기·수강신청·상담문의)은 고정입니다. 노출 여부만 관리해요.
        </p>

        <div className="mt-5 flex flex-col gap-3">
          <ToggleRow
            label="사이트에 노출"
            desc="켜면 방문자에게 팝업이 보입니다."
            checked={isActive}
            onChange={() => setIsActive((v) => !v)}
          />
          <ToggleRow
            label="모바일에서는 숨기기"
            desc="휴대폰 화면(가로 480px 이하)에서는 팝업을 띄우지 않습니다."
            checked={hideOnMobile}
            onChange={() => setHideOnMobile((v) => !v)}
          />
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Button onClick={save} disabled={busy || !dirty}>
            {busy ? "저장 중…" : "저장하기"}
          </Button>
          {msg && (
            <span className={`text-[13px] ${msg.ok ? "text-success" : "text-error"}`}>
              {msg.text}
            </span>
          )}
        </div>

        <p className="text-[13px] text-muted mt-5 bg-canvas-soft rounded-lg p-3">
          현재 상태:{" "}
          <strong className={isActive ? "text-success" : "text-muted"}>
            {isActive ? "노출 중" : "내려둠"}
          </strong>
          {isActive && hideOnMobile && " · 모바일 숨김"}
        </p>
      </Card>

      {/* 미리보기 */}
      <div className="order-1 lg:order-2">
        <h2 className="text-[17px] font-bold text-ink mb-3">미리보기</h2>
        <PopupPreview />
      </div>
    </div>
  );
}

// ── Toggle row ───────────────────────────────────────────────────────────────
function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-hairline p-3">
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-body-strong">{label}</p>
        <p className="text-[12.5px] text-muted mt-0.5">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={[
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors mt-0.5",
          checked ? "bg-primary" : "bg-hairline-strong",
        ].join(" ")}
      >
        <span
          aria-hidden
          className={[
            "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

// ── Static preview (실제 팝업 축약본) ─────────────────────────────────────────
function PopupPreview() {
  const rows = [
    { icon: <Hammer size={18} />, title: "과정 보기", desc: "어떤 과정이 있는지 확인하세요", primary: true },
    { icon: <Clipboard size={18} />, title: "수강신청", desc: "온라인으로 간편하게 접수" },
    { icon: <Message size={18} />, title: "상담문의", desc: "궁금한 점을 바로 물어보세요" },
  ];
  return (
    <div
      className="rounded-[18px] border border-hairline overflow-hidden bg-surface-card"
      style={{ boxShadow: "0 12px 32px rgba(28,26,24,0.10)" }}
    >
      <div
        className="text-center px-6 pt-7 pb-5"
        style={{ background: "linear-gradient(180deg, #f5f8ff 0%, #ffffff 78%)" }}
      >
        <p className="text-[22px] font-bold text-ink leading-tight">
          홈페이지가 <span className="text-primary">새로워졌습니다</span>
        </p>
        <p className="text-[12.5px] text-muted mt-1.5">
          자주 찾는 메뉴를 한곳에 모았습니다.
        </p>
      </div>
      <div className="px-5 pb-5 flex flex-col gap-2">
        {rows.map((r) => (
          <div
            key={r.title}
            className={[
              "flex items-center gap-2.5 rounded-[12px] border px-3 py-2",
              r.primary ? "bg-primary border-primary" : "bg-surface-card border-hairline",
            ].join(" ")}
          >
            <span
              className={[
                "w-9 h-9 rounded-[10px] grid place-items-center shrink-0",
                r.primary ? "bg-white/[0.18] text-white" : "bg-primary-soft text-primary",
              ].join(" ")}
            >
              {r.icon}
            </span>
            <span className="min-w-0">
              <span className={`block text-[14px] font-bold ${r.primary ? "text-white" : "text-ink"}`}>
                {r.title}
              </span>
              <span className={`block text-[11.5px] ${r.primary ? "text-white/85" : "text-muted"}`}>
                {r.desc}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
