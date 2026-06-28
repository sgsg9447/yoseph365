"use client";

// 훈련사진 관리 — 메인 노출은 '선택 → 저장' 방식.
// 위: 홈 메인에 노출 중(선택 미리보기 + X + 저장하기). 선택 0개면 자동(최신 6장) 미리보기.
// 아래: 전체 그리드(카테고리 필터 + 메인 선택 토글 + 삭제). 선택 상태는 양쪽 동기화.

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  LEAF_CATEGORIES,
  LEAF_LABELS,
  FEATURED_MAX,
  toggleSelection,
  canSaveFeatured,
  type LeafCategory,
} from "@/lib/gallery/categories";
import type { AdminPhotoView } from "@/lib/queries/admin";
import { DeletePhotoButton } from "./DeletePhotoButton";
import { setFeaturedPhotos } from "./actions";

type Filter = "전체" | LeafCategory;

export function PhotoManager({ photos }: { photos: AdminPhotoView[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const byId = useMemo(() => new Map(photos.map((p) => [p.id, p])), [photos]);
  const savedIds = useMemo(
    () => photos.filter((p) => p.isFeatured).map((p) => p.id),
    [photos],
  );

  const [selectedRaw, setSelectedRaw] = useState<number[]>(savedIds);
  const [filter, setFilter] = useState<Filter>("전체");
  const [err, setErr] = useState<string | null>(null);

  // 삭제된 사진 id가 남아있을 수 있으니 현재 존재하는 것만 유효 선택으로 본다.
  const selected = useMemo(
    () => selectedRaw.filter((id) => byId.has(id)),
    [selectedRaw, byId],
  );
  const canSave = canSaveFeatured(selected.length);
  const autoItems = photos.slice(0, FEATURED_MAX);
  const selectedPhotos = selected
    .map((id) => byId.get(id))
    .filter((p): p is AdminPhotoView => Boolean(p));

  function onToggle(id: number) {
    setErr(null);
    const next = toggleSelection(selected, id, FEATURED_MAX);
    if (next === selected) {
      setErr(`메인 사진은 최대 ${FEATURED_MAX}장까지 선택할 수 있습니다.`);
      return;
    }
    setSelectedRaw(next);
  }

  function save() {
    setErr(null);
    start(async () => {
      const res = await setFeaturedPhotos({ ids: selected });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      router.refresh();
    });
  }

  const visible = filter === "전체" ? photos : photos.filter((p) => p.category === filter);

  return (
    <div>
      {/* 홈 메인에 노출 중 */}
      <section className="mt-8">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h2 className="text-[16px] font-bold text-body-strong">홈 메인에 노출 중</h2>
          <div className="flex items-center gap-3">
            <span className="text-muted text-[13px]">
              선택 {selected.length}/{FEATURED_MAX}
            </span>
            <button
              type="button"
              onClick={save}
              disabled={!canSave || pending}
              title={
                canSave
                  ? "저장하기"
                  : `메인 사진 ${FEATURED_MAX}장을 모두 선택하면 저장할 수 있습니다`
              }
              className="rounded-button h-9 px-4 text-[14px] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "var(--color-primary)", color: "#fff" }}
            >
              {pending ? "저장 중…" : "저장하기"}
            </button>
          </div>
        </div>
        <p className="text-muted text-[13px] mb-3">
          {selected.length === 0
            ? `아직 직접 고르지 않아 최신 ${FEATURED_MAX}장이 자동으로 올라갑니다. 아래에서 ${FEATURED_MAX}장을 골라 ‘저장하기’를 누르면 고정됩니다.`
            : selected.length < FEATURED_MAX
              ? `메인 사진은 ${FEATURED_MAX}장을 모두 채워야 저장할 수 있습니다. (현재 ${selected.length}장)`
              : `선택한 ${FEATURED_MAX}장이 홈 메인에 노출됩니다. ‘저장하기’를 눌러 반영하세요.`}
        </p>
        {err && <p className="text-error text-[13px] mb-2">{err}</p>}

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {(selected.length === 0 ? autoItems : selectedPhotos).map((p) => (
            <div
              key={p.id}
              className="relative aspect-[4/3] rounded-[12px] overflow-hidden border border-hairline"
            >
              {p.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image} alt={p.label} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-surface-strong" />
              )}
              {selected.length === 0 ? (
                <span className="absolute top-1 left-1 bg-black/55 text-white text-[11px] rounded px-1.5 py-0.5">
                  자동
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onToggle(p.id)}
                  aria-label="메인에서 내리기"
                  className="absolute top-1 right-1 w-6 h-6 grid place-items-center rounded-full bg-black/60 text-white text-[15px] leading-none"
                >
                  ×
                </button>
              )}
              <span className="absolute bottom-1 left-1 bg-black/55 text-white text-[11px] rounded px-1.5 py-0.5">
                {p.category ? LEAF_LABELS[p.category] : "미분류"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 전체 사진 관리 */}
      <section className="mt-8">
        <h2 className="text-[16px] font-bold text-body-strong mb-3">전체 사진 관리</h2>
        <div
          style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 14 }}
        >
          {(["전체", ...LEAF_CATEGORIES] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className="whitespace-nowrap font-semibold rounded-full"
              style={{
                height: 38,
                padding: "0 14px",
                fontSize: 13.5,
                border:
                  filter === f
                    ? "1px solid var(--color-ink)"
                    : "1px solid var(--color-hairline-strong)",
                background: filter === f ? "var(--color-ink)" : "transparent",
                color: filter === f ? "#fff" : "var(--color-ink)",
                cursor: "pointer",
              }}
            >
              {f === "전체" ? "전체" : LEAF_LABELS[f]}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="text-muted text-[14px] text-center mt-6">해당 카테고리 사진이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {visible.map((photo) => {
              const sel = selected.includes(photo.id);
              return (
                <div
                  key={photo.id}
                  className="relative aspect-[4/3] rounded-[14px] overflow-hidden"
                >
                  {photo.image !== null ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo.image} alt={photo.label} className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full"
                      style={{
                        background:
                          "repeating-linear-gradient(45deg, #eef1f4 0, #eef1f4 10px, #f7f9fb 10px, #f7f9fb 20px)",
                      }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => onToggle(photo.id)}
                    aria-pressed={sel}
                    className="absolute top-2 left-2 rounded-md px-2 py-1 text-[12px] font-bold"
                    style={{
                      background: sel ? "var(--color-primary)" : "rgba(0,0,0,0.55)",
                      color: "#fff",
                    }}
                  >
                    {sel ? "메인 ✓" : "메인 선택"}
                  </button>
                  <span className="absolute bottom-2 left-2 bg-black/55 text-white text-[12px] font-medium rounded-md px-2 py-1">
                    {photo.category ? LEAF_LABELS[photo.category] : "미분류"}
                  </span>
                  <DeletePhotoButton id={photo.id} />
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
