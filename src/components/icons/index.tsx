// 23 Lucide-style inline SVG icons.
// Each icon: ({ size, strokeWidth, className }) — stroke="currentColor", aria-hidden.

export interface IconProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

const svgProps = (size: number, strokeWidth: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
  "aria-hidden": true as const,
});

export function Phone({ size = 24, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth, className)}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.28h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export function Users({ size = 24, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth, className)}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function Home({ size = 24, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth, className)}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

export function Award({ size = 24, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth, className)}>
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}

export function Wallet({ size = 24, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth, className)}>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}

export function CreditCard({ size = 24, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth, className)}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}

export function CheckCircle({ size = 24, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth, className)}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export function Check({ size = 24, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth, className)}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function Clipboard({ size = 24, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth, className)}>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}

export function MapPin({ size = 24, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth, className)}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function ChevronRight({ size = 24, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth, className)}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function Calendar({ size = 24, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth, className)}>
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

export function ImageIcon({ size = 24, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth, className)}>
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

export function Quote({ size = 24, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth, className)}>
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
    </svg>
  );
}

export function X({ size = 24, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth, className)}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function Hammer({ size = 24, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth, className)}>
      <path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9" />
      <path d="M17.64 15 22 10.64" />
      <path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 5.6a5.009 5.009 0 0 0-6.22.77L7.6 8.56c-.65.66-.89 1.62-.64 2.52l.29 1.05c.27.96-.02 1.98-.71 2.66l-.38.38" />
    </svg>
  );
}

export function Armchair({ size = 24, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth, className)}>
      <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
      <path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z" />
      <path d="M5 18v2" />
      <path d="M19 18v2" />
    </svg>
  );
}

export function TrendingUp({ size = 24, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth, className)}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

export function Star({ size = 24, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth, className)}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function Clock({ size = 24, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth, className)}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function FileText({ size = 24, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth, className)}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}

export function Message({ size = 24, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth, className)}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}

export function Menu({ size = 24, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth, className)}>
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

export function Reload({ size = 24, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth, className)}>
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

export function Lock({ size = 24, strokeWidth = 1.9, className }: IconProps) {
  return (
    <svg {...svgProps(size, strokeWidth, className)}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
