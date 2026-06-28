"use client";

import { useState } from "react";
import { LEAF_CATEGORIES, LEAF_LABELS, type LeafCategory } from "@/lib/gallery/categories";
import type { AdminPhotoView } from "@/lib/queries/admin";
import { DeletePhotoButton } from "./DeletePhotoButton";
import { FeaturedToggle } from "./FeaturedToggle";

type Filter = "전체" | LeafCategory;

export function PhotoGrid({ photos }: { photos: AdminPhotoView[] }) {
  const [filter, setFilter] = useState<Filter>("전체");
  const visible = filter === "전체" ? photos : photos.filter((p) => p.category === filter);

  return (
    <div className="mt-6">
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 14 }}>
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
              border: filter === f ? "1px solid var(--color-ink)" : "1px solid var(--color-hairline-strong)",
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
          {visible.map((photo) => (
            <div key={photo.id} className="relative aspect-[4/3] rounded-[14px] overflow-hidden">
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
              <FeaturedToggle id={photo.id} on={photo.isFeatured} />
              <span className="absolute bottom-2 left-2 bg-black/55 text-white text-[12px] font-medium rounded-md px-2 py-1">
                {photo.category ? LEAF_LABELS[photo.category] : "미분류"}
              </span>
              <DeletePhotoButton id={photo.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
