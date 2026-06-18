import { Logo } from "@/components/layout/Logo";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "관리자 로그인 · 성요셉목수학교" };

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-canvas-soft p-6">
      <div
        className="relative w-full max-w-[430px] bg-white rounded-xl border border-hairline overflow-hidden"
        style={{ padding: "44px 40px 40px", boxShadow: "0 12px 32px rgba(28,26,24,.10)" }}
      >
        <div
          aria-hidden
          className="absolute pointer-events-none rounded-full"
          style={{ width: 280, height: 280, top: -140, right: -100, filter: "blur(60px)", opacity: 0.5, background: "var(--color-gradient-sky)" }}
        />
        <div className="relative flex flex-col gap-3">
          <Logo className="h-10 w-auto self-start" />
          <span className="self-start text-[13px] font-semibold text-primary bg-primary-soft rounded-full px-3 py-1">운영 관리 시스템</span>
          <h1 className="text-[28px] font-bold text-ink">관리자 로그인</h1>
          <p className="text-[15px] text-muted">학원 운영 현황과 신청·상담을 관리합니다.</p>
          <div className="mt-2"><LoginForm /></div>
        </div>
      </div>
    </main>
  );
}
