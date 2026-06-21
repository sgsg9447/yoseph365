"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Field, ReqLabel } from "@/components/ui/Field";
import { Lock } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { submitInquiryPost } from "@/lib/actions/submit";
import { formatPhoneInput } from "@/lib/formatters/input";

const CATEGORIES = ["국비지원", "과정문의", "기타"] as const;

export function InquiryPostForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("과정문의");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [email, setEmail] = useState("");
  const [isSecret, setIsSecret] = useState(false);
  const [password, setPassword] = useState("");
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sb = createClient();
    sb.from("course")
      .select("id, name")
      .eq("is_deleted", false)
      .order("sort_order")
      .then(({ data }) => setCourses(data ?? []));
  }, []);

  // courseId is fetched but not exposed in the form UI per design — reserved for future use
  void courses;
  void courseId;
  void setCourseId;

  const handleSubmit = async () => {
    if (pending) return;
    setError(null);
    setPending(true);
    const res = await submitInquiryPost({
      name, phone, category, courseId, title, content, email, isSecret, password,
    });
    setPending(false);
    if (res.ok) onDone();
    else setError(res.error);
  };

  return (
    <div className="flex flex-col gap-[14px]">
      <Field label="제목" placeholder="문의 제목을 입력해 주세요" required value={title}
        maxLength={200} onChange={(e) => setTitle(e.target.value)} />

      <div className="flex flex-col gap-[7px]">
        <ReqLabel>구분</ReqLabel>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" onClick={() => setCategory(c)}
              className="h-[38px] px-4 rounded-full text-[14px] font-semibold border transition-colors"
              style={{
                background: c === category ? "var(--color-primary)" : "var(--color-surface-card)",
                color: c === category ? "#fff" : "var(--color-body-strong)",
                borderColor: c === category ? "var(--color-primary)" : "var(--color-hairline-strong)",
              }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <Field label="문의 내용" as="textarea" required placeholder="궁금하신 점을 자유롭게 남겨주세요"
        value={content} maxLength={1000} onChange={(e) => setContent(e.target.value)} />

      <Field label="이름" placeholder="홍길동" required value={name}
        maxLength={50} onChange={(e) => setName(e.target.value)} />
      <Field label="연락처" type="tel" inputMode="numeric" placeholder="010-0000-0000" required
        value={phone} maxLength={13}
        onChange={(e) => setPhone(formatPhoneInput(e.target.value, (e.nativeEvent as InputEvent).inputType))} />
      <Field label="이메일" type="email" inputMode="email" placeholder="선택 입력"
        value={email} onChange={(e) => setEmail(e.target.value)} />

      {/* 비밀글 */}
      <div className="flex flex-col gap-[10px] p-4 bg-surface-strong border border-hairline rounded-button">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={isSecret} onChange={(e) => setIsSecret(e.target.checked)}
            className="w-[18px] h-[18px] accent-[var(--color-primary)]" />
          <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-body-strong">
            <Lock size={15} strokeWidth={2.2} /> 비밀글로 작성
          </span>
        </label>
        {isSecret && (
          <Field label="비밀번호 (숫자 4자리)" type="password" inputMode="numeric"
            placeholder="••••" required value={password} maxLength={4}
            onChange={(e) => setPassword(e.target.value.replace(/[^0-9]/g, ""))} />
        )}
        <p className="text-[13px] text-muted-soft m-0 leading-[1.5]">
          비밀글은 작성자만 비밀번호로 확인할 수 있고, 관리자가 답변합니다.
        </p>
      </div>

      {error && <p className="text-[13.5px] text-error leading-[1.5] m-0">{error}</p>}

      <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} disabled={pending}>
        {pending ? "등록 중…" : "문의 등록"}
      </Button>
      <p className="text-[13px] text-muted-soft text-center m-0 leading-[1.5]">
        연락처는 답변 안내 목적이며 게시판에 공개되지 않습니다.
      </p>
    </div>
  );
}
