"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setErr(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setLoading(false);
    if (error) {
      setErr("아이디 또는 비밀번호가 올바르지 않습니다.");
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <div
      onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
      className="flex flex-col gap-4"
    >
      <Field
        label="아이디(이메일)" type="email" value={email}
        onChange={(e) => setEmail(e.target.value)} autoComplete="username"
      />
      <Field
        label="비밀번호" type="password" value={pw}
        onChange={(e) => setPw(e.target.value)} autoComplete="current-password"
      />
      {err && <p className="text-[14px] text-error">{err}</p>}
      <Button fullWidth size="lg" onClick={submit} disabled={loading}>
        {loading ? "로그인 중…" : "로그인"}
      </Button>
    </div>
  );
}
