// Hero section with intent cards.
// onPick is passed down from the client wrapper (HomeIntentSchedule) on the home page.

import { IntentCard } from "@/components/ui/IntentCard";

const intents = [
  {
    index: "01",
    title: "재취업 준비",
    desc: "목공 기술을 배워 새로운 일을 준비하고 싶어요",
  },
  {
    index: "02",
    title: "창업·부업",
    desc: "작은 공방이나 부업을 시작해보고 싶어요",
  },
  {
    index: "03",
    title: "내 집 직접 수리",
    desc: "집수리와 인테리어를 직접 해보고 싶어요",
  },
  {
    index: "04",
    title: "자격증 취득",
    desc: "목공·건축 자격증을 준비하고 싶어요",
  },
];

interface HeroIntentProps {
  onPick?: (title: string) => void;
}

export function HeroIntent({ onPick }: HeroIntentProps) {
  return (
    <section className="relative overflow-hidden" style={{ background: "#FAF8F4" }}>
      <div
        className="wrap relative z-[1] text-center"
        style={{
          paddingTop: "clamp(56px, 7vw, 96px)",
          paddingBottom: "clamp(48px, 6vw, 88px)",
        }}
      >
        <p className="text-[14px] font-bold text-muted tracking-[0.4px] mb-4">
          국비지원 목공·집수리·인테리어 직업훈련
        </p>
        <h1
          className="hero-head font-display font-bold text-ink leading-[1.28] tracking-[-1px] mx-auto mb-4 break-keep max-w-[760px]"
        >
          어떤 목적으로
          <br />
          배우시려고 하나요?
        </h1>
        <p className="text-[18px] text-body leading-[1.7] mx-auto mb-8 break-keep max-w-[560px]">
          목적에 맞는 과정을 골라보세요. 내일배움카드로 수강료 부담을 덜 수 있습니다.
        </p>
        <div className="grid g-intent text-left">
          {intents.map((it, i) => (
            <IntentCard
              key={i}
              {...it}
              onClick={onPick ? () => onPick(it.title) : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
