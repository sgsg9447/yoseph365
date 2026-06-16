import { SectionHeading } from "@/components/ui/SectionHeading";

interface VideoData {
  id: string;
  start?: number; // 시작 지점(초)
  tag: string;
  title: string;
  who: string;
}

const VIDEOS: VideoData[] = [
  {
    id: "uGrSNu4DV6s",
    tag: "뉴스 보도",
    title: "은퇴세대 집수리 기술 인기…사회 공헌 활동까지",
    who: "헬로tv뉴스",
  },
  {
    id: "XtVzSxRDYmk",
    start: 3,
    tag: "인터뷰",
    title: "목수학교는 어떤 곳일까? — 유튜브 목수김동혁",
    who: "유튜브 · 목수김동혁",
  },
];

function VideoCard({ id, start, tag, title, who }: VideoData) {
  const src = `https://www.youtube.com/embed/${id}?rel=0${start ? `&start=${start}` : ""}`;
  return (
    <div className="flex flex-col gap-[14px]">
      <div
        className="relative bg-black border border-hairline overflow-hidden"
        style={{ aspectRatio: "16 / 9", borderRadius: 18 }}
      >
        <iframe
          src={src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          className="absolute inset-0 w-full h-full border-none"
        />
      </div>
      <div className="flex flex-col gap-1 px-[4px]">
        <span className="text-[13px] font-bold text-primary tracking-[0.2px]">{tag}</span>
        <span className="text-[17px] font-bold text-ink tracking-[-0.3px] leading-[1.4] break-keep">
          {title}
        </span>
        <span className="text-[13.5px] text-muted">{who}</span>
      </div>
    </div>
  );
}

export function Videos() {
  return (
    <section
      data-screen-label="영상으로 보기"
      style={{
        background: "var(--color-canvas-soft)",
        borderTop: "1px solid var(--color-hairline)",
      }}
    >
      <div className="wrap band">
        <SectionHeading
          align="center"
          eyebrow="영상으로 보기"
          title={<>영상으로 먼저 만나보세요</>}
        />
        <div className="grid g-2" style={{ marginTop: 36, gap: 22 }}>
          {VIDEOS.map((v) => (
            <VideoCard key={v.id} {...v} />
          ))}
        </div>
      </div>
    </section>
  );
}
