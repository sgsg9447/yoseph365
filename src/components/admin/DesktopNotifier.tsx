"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "@/components/icons";
import type { NotifItem, NotifType } from "@/lib/admin/notifications";

const POLL_MS = 30_000;
const LS_ENABLED = "admin-notify-enabled";
const LS_SOUND = "admin-notify-sound";

const PAGE: Record<NotifType, string> = {
  application: "/admin/enroll",
  inquiry: "/admin/consult",
};
const TITLE: Record<NotifType, string> = {
  application: "새 수강신청",
  inquiry: "새 상담문의",
};

type Status = "off" | "ok" | "error" | "denied" | "unsupported";

export function DesktopNotifier() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const [sound, setSound] = useState(true);
  const [status, setStatus] = useState<Status>("off");
  const [open, setOpen] = useState(false);
  const sinceRef = useRef<string | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const soundRef = useRef(true);

  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  // 마운트 후 브라우저 전용 상태(localStorage·Notification.permission)를 1회 복원.
  // SSR과 동일한 기본값으로 첫 렌더 후 갱신해 hydration 불일치를 피하는 의도된 패턴이라
  // set-state-in-effect 규칙을 이 효과에 한해 끈다.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!("Notification" in window)) {
      setStatus("unsupported");
      return;
    }
    setSound(localStorage.getItem(LS_SOUND) !== "0");
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    if (localStorage.getItem(LS_ENABLED) === "1" && Notification.permission === "granted") {
      setEnabled(true);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const playBeep = useCallback(() => {
    if (!soundRef.current) return;
    try {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = audioRef.current ?? new Ctx();
      audioRef.current = ctx;
      if (ctx.state === "suspended") void ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    } catch {
      // 오디오 차단 환경은 무시.
    }
  }, []);

  const fire = useCallback(
    (item: NotifItem) => {
      try {
        const n = new Notification(TITLE[item.type], {
          body: item.label,
          tag: `${item.type}-${item.id}`,
        });
        n.onclick = () => {
          window.focus();
          router.push(PAGE[item.type]);
          n.close();
        };
      } catch {
        // 알림 생성 실패는 무시.
      }
    },
    [router],
  );

  // 폴링 루프.
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function poll() {
      try {
        const q = sinceRef.current ? `?since=${encodeURIComponent(sinceRef.current)}` : "";
        const res = await fetch(`/api/admin/notifications${q}`, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { serverTime: string; items: NotifItem[] };
        if (cancelled) return;
        const isBaseline = sinceRef.current === null;
        sinceRef.current = data.serverTime;
        if (!isBaseline && data.items.length > 0) {
          data.items.forEach(fire);
          playBeep();
        }
        setStatus("ok");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    void poll();
    const timer = setInterval(() => void poll(), POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [enabled, fire, playBeep]);

  const enable = useCallback(async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    const perm =
      Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (perm !== "granted") {
      if (perm === "denied") setStatus("denied");
      return;
    }
    try {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = audioRef.current ?? new Ctx();
      audioRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();
    } catch {
      // 오디오 준비 실패는 무시(알림은 동작).
    }
    sinceRef.current = null;
    localStorage.setItem(LS_ENABLED, "1");
    setEnabled(true);
  }, []);

  const disable = useCallback(() => {
    localStorage.setItem(LS_ENABLED, "0");
    setEnabled(false);
    setStatus("off");
  }, []);

  const toggleSound = useCallback(() => {
    setSound((s) => {
      const next = !s;
      localStorage.setItem(LS_SOUND, next ? "1" : "0");
      return next;
    });
  }, []);

  // 점 표시는 정상(초록)·오류(빨강)만. denied는 점 없이 팝오버 문구로 안내.
  const dotClass = status === "ok" ? "bg-success" : status === "error" ? "bg-error" : "";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="데스크탑 알림 설정"
        className="relative p-2 rounded-lg text-body-strong hover:bg-hairline-soft transition-colors"
      >
        <Bell size={20} className={enabled ? "text-primary" : "text-muted"} />
        {dotClass && (
          <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${dotClass}`} />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 mt-2 w-[260px] bg-white border border-hairline rounded-xl shadow-lg p-3 z-40 text-[14px]">
            <p className="font-semibold text-ink mb-2">데스크탑 알림</p>

            {status === "unsupported" ? (
              <p className="text-muted text-[13px]">이 브라우저는 알림을 지원하지 않습니다.</p>
            ) : status === "denied" ? (
              <p className="text-muted text-[13px]">
                브라우저에서 알림이 차단되어 있습니다. 주소창의 자물쇠 → 알림 허용으로 변경해
                주세요.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="flex items-center justify-between">
                  <span className="text-body-strong">새 접수 알림</span>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => (e.target.checked ? void enable() : disable())}
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-body-strong">소리</span>
                  <input type="checkbox" checked={sound} onChange={toggleSound} />
                </label>
                <p className="text-muted text-[12px] mt-1">
                  {enabled
                    ? status === "error"
                      ? "연결 오류 — 자동 재시도 중입니다."
                      : "탭이 열려 있는 동안 새 수강신청·상담문의를 알려드립니다."
                    : "켜면 새 수강신청·상담문의를 데스크탑 알림으로 받습니다."}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
