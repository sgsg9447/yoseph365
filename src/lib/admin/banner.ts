export type BannerMode = "template" | "image" | "html";
export type BannerTemplate = "price" | "bignum" | "center" | "phone" | "qa";
export type BannerTint = "peach" | "sky" | "lavender" | "mint" | "rose" | "sand" | "blue" | "slate";

export interface Banner {
  id: string;
  active: boolean;
  mode: BannerMode;
  template: BannerTemplate;
  tint: BannerTint;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  rows: string;        // price textarea raw
  big: string;
  bigCaption: string;
  bullets: string;     // phone textarea raw
  phone: string;
  question: string;
  answer: string;
  imgDesktop: string;
  imgMobile: string;
  alt: string;
  link: string;
  html: string;
  htmlLabel: string;
}

/** "항목 | 가격" 줄들을 [label, price][]로 파싱 */
export function parseRows(raw: string): [string, string][] {
  return raw.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const [label, ...rest] = l.split("|");
    return [label.trim(), rest.join("|").trim()] as [string, string];
  });
}

/** 줄 단위 배열(빈 줄 제거) */
export function parseLines(raw: string): string[] {
  return raw.split("\n").map((l) => l.trim()).filter(Boolean);
}

let seq = 0;
export function makeDefaultBanner(): Banner {
  seq += 1;
  return {
    id: `b-${Date.now()}-${seq}`,
    active: true, mode: "template", template: "center", tint: "sky",
    eyebrow: "", title: "새 배너", body: "", cta: "",
    rows: "", big: "", bigCaption: "", bullets: "", phone: "",
    question: "", answer: "", imgDesktop: "", imgMobile: "",
    alt: "", link: "", html: "", htmlLabel: "새 배너",
  };
}

export const BANNER_TINTS: Record<BannerTint, string> = {
  peach: "#f6f2eb", sky: "#eaf1fb", lavender: "#f1eef8", mint: "#e9f5ef",
  rose: "#faeef1", sand: "#f4f1ec", blue: "#eaf0fe", slate: "#eef1f5",
};

export const DEMO_BANNERS: Banner[] = [
  { ...makeDefaultBanner(), template: "center", tint: "peach", title: "수강료 0원", body: "경기도 전액지원 과정", htmlLabel: "수강료 0원" },
  { ...makeDefaultBanner(), template: "center", tint: "sky", title: "신규 과정 모집", body: "7월 개강 과정 안내", htmlLabel: "신규 과정 모집" },
  { ...makeDefaultBanner(), template: "bignum", tint: "lavender", big: "120명", bigCaption: "누적 수료생", title: "", htmlLabel: "누적 수료생 120명" },
];
