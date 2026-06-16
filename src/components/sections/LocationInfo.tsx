// LocationInfo — 오시는 길 섹션 (약도 + 주소·전화·상담시간)
// 참조: HANDOFF/ui_kits/website/sections.jsx:492-518

import { MapPin, Phone, Calendar } from "@/components/icons";
import { PHONE_MAIN, ADDRESS, CONSULT_HOURS } from "@/lib/data/site";

function ContactValue({ value }: { value: string }) {
  if (value !== CONSULT_HOURS) return value;

  return (
    <>
      <span className="block sm:inline">평일 9:30~18:00,</span>{" "}
      <span className="block sm:inline">점심시간 12:00~13:00</span>
    </>
  );
}

const rows = [
  {
    icon: <MapPin size={20} />,
    value: ADDRESS,
  },
  {
    icon: <Phone size={20} />,
    value: PHONE_MAIN,
  },
  {
    icon: <Calendar size={20} />,
    value: CONSULT_HOURS,
  },
];

const MAP_SRC = `https://maps.google.com/maps?q=${encodeURIComponent(ADDRESS)}&z=16&hl=ko&output=embed`;

export function LocationInfo() {
  return (
    <div className="grid g-2" style={{ alignItems: "center" }}>
      <iframe
        title="성요셉목수학교 약도"
        src={MAP_SRC}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        style={{
          width: "100%",
          aspectRatio: "4 / 3",
          border: "1px solid var(--color-hairline)",
          borderRadius: 16,
          display: "block",
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((r, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
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
            <span style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--color-ink)",
                  lineHeight: 1.5,
                  wordBreak: "keep-all",
                }}
              >
                <ContactValue value={r.value} />
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
