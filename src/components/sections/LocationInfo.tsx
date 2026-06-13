// LocationInfo — 오시는 길 섹션 (약도 + 주소·전화·상담시간)
// 참조: HANDOFF/ui_kits/website/sections.jsx:492-518

import { MapPin, Phone, Calendar } from "@/components/icons";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { PHONE_MAIN } from "@/lib/data/site";

const ADDRESS = "경기도 성남시 중원구 OO로 00, 3층 (목공실습동)";

const rows = [
  {
    icon: <MapPin size={20} />,
    label: "주소",
    value: ADDRESS,
  },
  {
    icon: <Phone size={20} />,
    label: "대표전화",
    value: PHONE_MAIN,
  },
  {
    icon: <Calendar size={20} />,
    label: "상담 시간",
    value: "평일 09:00 – 18:00 · 점심 12:00 – 13:00",
  },
];

export function LocationInfo() {
  return (
    <div className="grid g-2" style={{ alignItems: "start" }}>
      <PhotoSlot ratio="4 / 3" label="약도 · 오시는 길" radius={16} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((r, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
              padding: "18px 20px",
              background: "var(--color-surface-card)",
              border: "1px solid var(--color-hairline)",
              borderRadius: 14,
            }}
          >
            <span
              style={{
                flex: "0 0 auto",
                width: 40,
                height: 40,
                display: "grid",
                placeItems: "center",
                borderRadius: 10,
                background: "var(--color-primary-soft)",
                color: "var(--color-primary)",
              }}
            >
              {r.icon}
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--color-muted)",
                }}
              >
                {r.label}
              </span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--color-ink)",
                  lineHeight: 1.5,
                  wordBreak: "keep-all",
                }}
              >
                {r.value}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
