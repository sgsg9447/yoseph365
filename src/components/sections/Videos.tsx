"use client";

import { useState } from "react";
import Image from "next/image";
import { SectionHeading } from "@/components/ui/SectionHeading";

interface VideoData {
  id: string;
  thumb: string;
  tag: string;
  title: string;
  who: string;
}

const VIDEOS: VideoData[] = [
  {
    id: "XtVzSxRDYmk",
    thumb: "/videos/video-interview.png",
    tag: "수강생 인터뷰",
    title: "목수학교는 어떤 곳일까? — 수강생 인터뷰",
    who: "유튜브 · 목수김동혁",
  },
  {
    id: "uGrSNu4DV6s",
    thumb: "/videos/video-news.png",
    tag: "뉴스 보도",
    title: "은퇴세대 집수리 기술 인기…사회 공헌 활동까지",
    who: "헬로tv뉴스",
  },
];

function VideoCard({ id, thumb, tag, title, who }: VideoData) {
  const [play, setPlay] = useState(false);

  return (
    <div className="flex flex-col gap-[14px]">
      <div
        className="relative bg-black border border-hairline overflow-hidden"
        style={{ aspectRatio: "16 / 9", borderRadius: 18 }}
      >
        {play ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlay(true)}
            aria-label={`${title} 재생`}
            className="absolute inset-0 w-full h-full p-0 border-none bg-transparent cursor-pointer"
          >
            <Image
              src={thumb}
              alt={title}
              fill
              className="object-cover"
            />
            <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_55%,rgba(0,0,0,0.35)_100%)]" />
            <span
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[66px] h-[66px] rounded-full grid place-items-center"
              style={{
                background: "rgba(255,255,255,0.94)",
                boxShadow: "0 10px 28px rgba(0,0,0,0.3)",
              }}
            >
              <span
                className="ml-[5px]"
                style={{
                  width: 0,
                  height: 0,
                  borderTop: "12px solid transparent",
                  borderBottom: "12px solid transparent",
                  borderLeft: "19px solid var(--color-ink)",
                }}
              />
            </span>
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1 px-[4px]">
        <span className="text-[13px] font-bold text-primary tracking-[0.2px]">
          {tag}
        </span>
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
          sub="수강생 인터뷰와 뉴스에 소개된 훈련 현장을 영상으로 확인하세요."
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
