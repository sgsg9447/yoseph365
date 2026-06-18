"use client";

import { useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { FileText, X } from "@/components/icons";
import {
  type Banner,
  type BannerMode,
  type BannerTemplate,
  type BannerTint,
  makeDefaultBanner,
  parseRows,
  parseLines,
  BANNER_TINTS,
} from "@/lib/admin/banner";

const STRIPE_BG =
  "repeating-linear-gradient(45deg,#eef1f4 0,#eef1f4 6px,#f7f9fb 6px,#f7f9fb 12px)";

const TEMPLATE_LABELS: { key: BannerTemplate; label: string }[] = [
  { key: "price", label: "가격표형" },
  { key: "bignum", label: "큰 숫자 강조형" },
  { key: "center", label: "중앙 메시지형" },
  { key: "phone", label: "전화 CTA형" },
  { key: "qa", label: "Q&A형" },
];

const TINT_KEYS = Object.keys(BANNER_TINTS) as BannerTint[];

// ── CTA pill (template preview) ─────────────────────────────────────────────
function CtaPill({ cta }: { cta: string }) {
  if (!cta.trim()) return null;
  return (
    <span className="inline-flex bg-primary text-white rounded-full px-4 h-9 items-center text-[14px] font-semibold mt-3 self-start">
      {cta}
    </span>
  );
}

function Eyebrow({ eyebrow }: { eyebrow: string }) {
  if (!eyebrow.trim()) return null;
  return <span className="text-[12px] font-semibold text-primary">{eyebrow}</span>;
}

// ── Template preview rendering (pure) ───────────────────────────────────────
function renderTemplate(b: Banner) {
  switch (b.template) {
    case "center":
      return (
        <div className="flex flex-col items-center text-center gap-1">
          <Eyebrow eyebrow={b.eyebrow} />
          {b.title && <h3 className="text-[26px] font-bold text-ink">{b.title}</h3>}
          {b.body && <p className="text-[15px] text-body">{b.body}</p>}
          {b.cta.trim() && (
            <span className="inline-flex bg-primary text-white rounded-full px-4 h-9 items-center text-[14px] font-semibold mt-3">
              {b.cta}
            </span>
          )}
        </div>
      );
    case "price":
      return (
        <div className="flex flex-col gap-2">
          <Eyebrow eyebrow={b.eyebrow} />
          {b.title && <h3 className="text-[20px] font-bold text-ink">{b.title}</h3>}
          <div className="flex flex-col gap-1">
            {parseRows(b.rows).map(([label, price], i) => (
              <div key={i} className="flex justify-between text-[15px] text-body">
                <span>{label}</span>
                <span className="font-semibold text-ink">{price}</span>
              </div>
            ))}
          </div>
          <CtaPill cta={b.cta} />
        </div>
      );
    case "bignum":
      return (
        <div className="flex flex-col gap-2">
          <Eyebrow eyebrow={b.eyebrow} />
          <div className="flex items-baseline gap-3">
            {b.big && <span className="text-[44px] font-bold text-primary leading-none">{b.big}</span>}
            {b.bigCaption && <span className="text-[15px] text-muted">{b.bigCaption}</span>}
          </div>
          {b.body && <p className="text-[14px] text-body">{b.body}</p>}
          <CtaPill cta={b.cta} />
        </div>
      );
    case "phone":
      return (
        <div className="flex flex-col gap-2">
          <Eyebrow eyebrow={b.eyebrow} />
          {b.title && <h3 className="text-[20px] font-bold text-ink">{b.title}</h3>}
          {parseLines(b.bullets).length > 0 && (
            <ul className="list-disc pl-5 text-[14px] text-body">
              {parseLines(b.bullets).map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}
          {b.phone && (
            <p className="text-[18px] font-bold text-primary mt-2">전화 {b.phone}</p>
          )}
        </div>
      );
    case "qa":
      return (
        <div className="flex flex-col gap-1">
          <Eyebrow eyebrow={b.eyebrow} />
          {b.question && <p className="text-[16px] font-bold text-ink">Q. {b.question}</p>}
          {b.answer && <p className="text-[15px] text-body mt-1">A. {b.answer}</p>}
          <CtaPill cta={b.cta} />
        </div>
      );
  }
}

// ── Component ───────────────────────────────────────────────────────────────
export function BannerManager({ initial }: { initial: Banner[] }) {
  const [banners, setBanners] = useState<Banner[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = banners.find((b) => b.id === selectedId) ?? null;
  const activeCount = banners.filter((b) => b.active).length;

  function updB(id: string, patch: Partial<Banner>) {
    setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }
  function addBanner() {
    const b = makeDefaultBanner();
    setBanners([...banners, b]);
    setSelectedId(b.id);
  }
  function toggleActive(id: string) {
    const cur = banners.find((b) => b.id === id);
    if (cur) updB(id, { active: !cur.active });
  }
  function moveB(id: string, dir: -1 | 1) {
    setBanners((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      const next = idx + dir;
      if (idx < 0 || next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
  }
  function deleteBanner(id: string) {
    setBanners((prev) => prev.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  }
  function selectBanner(id: string) {
    setSelectedId(id);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-6 items-start">
      {/* EDITOR (left on desktop) */}
      <div className="order-2 lg:order-1">{renderEditor(selected, updB, deleteBanner, setSelectedId)}</div>

      {/* LIST (right, sticky) */}
      <div className="order-1 lg:order-2 lg:sticky lg:top-[88px]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[17px] font-bold text-ink">배너 슬라이드</h2>
            <p className="text-[13px] text-muted">{activeCount}개 노출 중</p>
          </div>
        </div>
        <Button fullWidth onClick={addBanner} className="mb-3">
          + 새 배너 추가
        </Button>
        <div className="flex flex-col gap-3">
          {banners.map((b, i) => (
            <BannerListCard
              key={b.id}
              b={b}
              index={i}
              selected={b.id === selectedId}
              onSelect={() => selectBanner(b.id)}
              onToggle={() => toggleActive(b.id)}
              onUp={() => moveB(b.id, -1)}
              onDown={() => moveB(b.id, 1)}
              onDelete={() => deleteBanner(b.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── List card ───────────────────────────────────────────────────────────────
function BannerListCard({
  b,
  index,
  selected,
  onSelect,
  onToggle,
  onUp,
  onDown,
  onDelete,
}: {
  b: Banner;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onUp: () => void;
  onDown: () => void;
  onDelete: () => void;
}) {
  const squareStyle =
    b.mode === "template"
      ? { background: BANNER_TINTS[b.tint] }
      : b.mode === "image"
        ? { background: STRIPE_BG }
        : { background: "#ffffff" };

  const primaryLine = b.mode === "html" ? b.htmlLabel : b.title || "(제목 없음)";
  const kindLabel =
    b.mode === "template" ? `템플릿 · ${b.template}` : b.mode === "image" ? "이미지" : "HTML";

  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  const mini =
    "w-8 h-8 rounded-lg inline-flex items-center justify-center text-muted hover:bg-hairline-soft";

  return (
    <Card
      padding={14}
      onClick={onSelect}
      className={[
        "cursor-pointer",
        selected ? "ring-2 ring-primary border-primary" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-center gap-3">
        <div
          className={[
            "w-10 h-10 rounded-[11px] flex items-center justify-center font-bold text-[14px] text-ink",
            b.mode === "html" ? "border border-hairline-strong" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={squareStyle}
        >
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-ink truncate">{primaryLine}</p>
          <p className="text-[12px] text-muted">{kindLabel}</p>
        </div>
        <button
          type="button"
          aria-label="노출 토글"
          onClick={stop(onToggle)}
          className={[
            "w-10 h-6 rounded-full relative transition shrink-0",
            b.active ? "bg-primary" : "bg-hairline-strong",
          ].join(" ")}
        >
          <span
            className={[
              "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform",
              b.active ? "translate-x-[18px]" : "translate-x-0.5",
            ].join(" ")}
          />
        </button>
      </div>
      <div className="flex gap-1 mt-2">
        <button type="button" className={mini} onClick={stop(onSelect)} aria-label="편집">
          <FileText size={15} />
        </button>
        <button type="button" className={mini} onClick={stop(onUp)} aria-label="위로">
          ↑
        </button>
        <button type="button" className={mini} onClick={stop(onDown)} aria-label="아래로">
          ↓
        </button>
        <button
          type="button"
          className={`${mini} hover:text-error`}
          onClick={stop(onDelete)}
          aria-label="삭제"
        >
          <X size={15} />
        </button>
      </div>
    </Card>
  );
}

// ── Editor ──────────────────────────────────────────────────────────────────
function renderEditor(
  selected: Banner | null,
  updB: (id: string, patch: Partial<Banner>) => void,
  deleteBanner: (id: string) => void,
  setSelectedId: (id: string | null) => void,
) {
  if (selected === null) {
    return (
      <div className="border-2 border-dashed border-hairline-strong rounded-lg py-20 text-center text-muted">
        편집할 배너를 선택하세요
      </div>
    );
  }
  const b = selected;
  const u = (patch: Partial<Banner>) => updB(b.id, patch);

  const modeOption = (mode: BannerMode, top: string, sub: string) => (
    <button
      type="button"
      onClick={() => u({ mode })}
      className={[
        "rounded-lg border p-3 text-center cursor-pointer transition",
        b.mode === mode
          ? "bg-primary-soft border-primary text-primary"
          : "border-hairline-strong text-body",
      ].join(" ")}
    >
      <span className="block font-semibold text-[14px]">{top}</span>
      <span className="block text-[11px] text-muted">{sub}</span>
    </button>
  );

  return (
    <div className="flex flex-col">
      {/* Mode switch */}
      <div className="grid grid-cols-3 gap-2">
        {modeOption("template", "템플릿 + 폼", "반응형 · SEO 유지")}
        {modeOption("image", "이미지 업로드", "완성된 포스터 1장")}
        {modeOption("html", "HTML 직접", "코드 붙여넣기")}
      </div>

      {/* Preview */}
      <div
        className="min-h-[236px] rounded-lg flex flex-col justify-center mt-4 border border-hairline overflow-hidden"
        style={{
          padding: "34px 36px",
          background:
            b.mode === "template"
              ? BANNER_TINTS[b.tint]
              : b.mode === "image"
                ? b.imgDesktop
                  ? "#ffffff"
                  : STRIPE_BG
                : "#ffffff",
        }}
      >
        {b.mode === "template" && renderTemplate(b)}
        {b.mode === "image" &&
          (b.imgDesktop ? (
            <span className="inline-flex self-start items-center gap-2 bg-primary-soft text-primary rounded-full px-3 h-8 text-[13px] font-semibold">
              데스크톱 이미지: {b.imgDesktop}
            </span>
          ) : (
            <p className="text-center text-muted text-[14px]">이미지를 업로드하세요</p>
          ))}
        {b.mode === "html" &&
          (b.html.trim() ? (
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(b.html) }} />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted">
              <FileText size={28} />
              <p className="text-[14px]">HTML 코드를 입력하세요</p>
            </div>
          ))}
      </div>

      {/* Form */}
      <Card padding={20} className="mt-4">
        {b.mode === "template" && renderTemplateForm(b, u)}
        {b.mode === "image" && renderImageForm(b, u)}
        {b.mode === "html" && renderHtmlForm(b, u)}

        <div className="mt-4 flex justify-between">
          <Button variant="outline" onClick={() => deleteBanner(b.id)}>
            삭제
          </Button>
          <Button onClick={() => setSelectedId(null)}>저장하기</Button>
        </div>
      </Card>
    </div>
  );
}

// ── Template form ─────────────────────────────────────────────────────────
function renderTemplateForm(b: Banner, u: (patch: Partial<Banner>) => void) {
  return (
    <div className="flex flex-col gap-4">
      {/* template pills */}
      <div className="flex flex-wrap gap-2">
        {TEMPLATE_LABELS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => u({ template: key })}
            className={[
              "rounded-full px-3 h-8 text-[13px] font-semibold transition",
              b.template === key
                ? "bg-primary text-white"
                : "border border-hairline-strong text-body",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* tint swatches */}
      <div className="flex gap-2">
        {TINT_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            aria-label={`배경 ${key}`}
            onClick={() => u({ tint: key })}
            className={[
              "w-8 h-8 rounded-[11px] transition",
              b.tint === key ? "ring-2 ring-primary" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ background: BANNER_TINTS[key] }}
          />
        ))}
      </div>

      <Field label="윗줄 배지" value={b.eyebrow} onChange={(e) => u({ eyebrow: e.target.value })} />

      {b.template === "price" && (
        <>
          <Field label="제목" value={b.title} onChange={(e) => u({ title: e.target.value })} />
          <Field
            as="textarea"
            rows={4}
            label="가격 항목"
            hint="한 줄에 하나씩 · 형식: 항목 | 가격"
            value={b.rows}
            onChange={(e) => u({ rows: e.target.value })}
          />
        </>
      )}

      {b.template === "bignum" && (
        <>
          <div className="grid grid-cols-[1fr_1.4fr] gap-3">
            <Field label="큰 숫자" value={b.big} onChange={(e) => u({ big: e.target.value })} />
            <Field
              label="숫자 설명"
              value={b.bigCaption}
              onChange={(e) => u({ bigCaption: e.target.value })}
            />
          </div>
          <Field
            as="textarea"
            rows={2}
            label="본문"
            value={b.body}
            onChange={(e) => u({ body: e.target.value })}
          />
        </>
      )}

      {b.template === "center" && (
        <>
          <Field label="제목" value={b.title} onChange={(e) => u({ title: e.target.value })} />
          <Field
            as="textarea"
            rows={2}
            label="본문"
            value={b.body}
            onChange={(e) => u({ body: e.target.value })}
          />
        </>
      )}

      {b.template === "phone" && (
        <>
          <Field label="제목" value={b.title} onChange={(e) => u({ title: e.target.value })} />
          <Field
            as="textarea"
            rows={3}
            label="안내 리스트"
            hint="한 줄에 하나씩"
            value={b.bullets}
            onChange={(e) => u({ bullets: e.target.value })}
          />
          <Field label="전화번호" value={b.phone} onChange={(e) => u({ phone: e.target.value })} />
        </>
      )}

      {b.template === "qa" && (
        <>
          <Field
            label="질문(Q)"
            value={b.question}
            onChange={(e) => u({ question: e.target.value })}
          />
          <Field
            as="textarea"
            rows={2}
            label="답변(A)"
            value={b.answer}
            onChange={(e) => u({ answer: e.target.value })}
          />
        </>
      )}

      {b.template !== "phone" && (
        <Field label="버튼 문구" value={b.cta} onChange={(e) => u({ cta: e.target.value })} />
      )}
    </div>
  );
}

// ── Image form ─────────────────────────────────────────────────────────────
function renderImageForm(b: Banner, u: (patch: Partial<Banner>) => void) {
  const dropzone =
    "w-full border-2 border-dashed border-hairline-strong rounded-lg py-6 text-center text-[14px] text-muted hover:border-primary transition";

  const chip = (filename: string, onClear: () => void) => (
    <div className="flex items-center gap-2">
      <span className="inline-flex flex-1 items-center gap-2 bg-primary-soft text-primary rounded-lg px-3 h-11 text-[14px] font-semibold truncate">
        {filename}
      </span>
      <button
        type="button"
        aria-label="이미지 제거"
        onClick={onClear}
        className="w-9 h-11 inline-flex items-center justify-center rounded-lg border border-hairline-strong text-muted hover:text-error"
      >
        <X size={16} />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-muted bg-canvas-soft rounded-lg p-3">
        작은 화면에서도 글자가 잘 보이도록 모바일 이미지를 따로 준비하세요.
      </p>

      <div className="flex flex-col gap-2">
        <span className="text-[15px] font-semibold text-body-strong">데스크톱 이미지</span>
        {b.imgDesktop ? (
          chip(b.imgDesktop, () => u({ imgDesktop: "" }))
        ) : (
          <button type="button" className={dropzone} onClick={() => u({ imgDesktop: "desktop.jpg" })}>
            데스크톱 이미지 업로드 (권장 1600×440)
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[15px] font-semibold text-body-strong">모바일 이미지</span>
        {b.imgMobile ? (
          chip(b.imgMobile, () => u({ imgMobile: "" }))
        ) : (
          <button type="button" className={dropzone} onClick={() => u({ imgMobile: "mobile.jpg" })}>
            모바일 이미지 업로드 (권장 800×800)
          </button>
        )}
      </div>

      <Field label="대체 텍스트" value={b.alt} onChange={(e) => u({ alt: e.target.value })} />
      <Field label="연결 링크" value={b.link} onChange={(e) => u({ link: e.target.value })} />
    </div>
  );
}

// ── HTML form ──────────────────────────────────────────────────────────────
function renderHtmlForm(b: Banner, u: (patch: Partial<Banner>) => void) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-error bg-error-soft rounded-lg p-3">
        반응형·전화링크·SEO·접근성을 운영자가 직접 책임져야 합니다. 가능하면 템플릿 + 폼을
        권장합니다.
      </p>
      <Field
        label="관리용 이름"
        value={b.htmlLabel}
        onChange={(e) => u({ htmlLabel: e.target.value })}
      />
      <Field
        as="textarea"
        rows={10}
        label="HTML 코드"
        className="font-mono text-[13px]"
        value={b.html}
        onChange={(e) => u({ html: e.target.value })}
      />
    </div>
  );
}
