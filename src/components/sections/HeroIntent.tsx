// Server component — hero section with intent cards.
// onPick is passed down from a client wrapper (HomeInteractive) in the home page.

import { Users, TrendingUp, Home, Award } from "@/components/icons";
import { IntentCard } from "@/components/ui/IntentCard";

const intents = [
  {
    icon: <Users size={26} />,
    tint: "sky" as const,
    title: "재취업 준비",
    desc: "목공 기술로 새 일자리를 찾고 싶어요",
  },
  {
    icon: <TrendingUp size={26} />,
    tint: "rose" as const,
    title: "창업·부업",
    desc: "내 공방·가게를 차리고 싶어요",
  },
  {
    icon: <Home size={26} />,
    tint: "peach" as const,
    title: "내 집 직접 수리",
    desc: "우리 집을 직접 고치고 꾸미고 싶어요",
  },
  {
    icon: <Award size={26} />,
    tint: "lavender" as const,
    title: "자격증 취득",
    desc: "목공·건축 자격증을 따고 싶어요",
  },
];

interface HeroIntentProps {
  onPick?: (title: string) => void;
}

export function HeroIntent({ onPick }: HeroIntentProps) {
  return (
    <section className="relative overflow-hidden">
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
          목적에 맞는 과정을 골라보세요. 내일배움카드가 있다면 수강료는 0원입니다.
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
