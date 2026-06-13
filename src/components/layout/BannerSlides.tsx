// 홈 상단 캐러셀 배너 6종 — 핸드오프 "통일 배너 2톤 교차" 라이브 마크업 이식.
// 디자인 레퍼런스: design_handoff_banners/banners-preview.html (hi-fi, 고정 height 540px)
// - 화이트 톤(02·03·05) / 블루그레이 톤(01·04·06) 2톤 교차
// - 데스크톱(xl≥1100px): 모든 배너 고정 440px 높이, 2단 좌우 배치, 콘텐츠 세로 중앙
// - 모바일: 2단이 세로로 쌓이며 높이 자동(핸드오프 권장)
// 백엔드 연결 지점: 가격·과정 텍스트는 추후 CMS/Supabase로 분리 가능.

import Image from "next/image";
import { Award, CreditCard, Phone, Check } from "@/components/icons";
import { PHONE_FOOTER } from "@/lib/data/site";

// ── 공통 배경 (코너 워시 + 베이스 톤) ──────────────────────────────────
const WASH =
  "radial-gradient(135% 130% at 100% -15%, rgba(37,99,235,0.16), rgba(37,99,235,0.04) 48%, rgba(37,99,235,0) 72%)";
const TONE_WHITE = `${WASH}, #ffffff`;
const TONE_BLUEGRAY = `${WASH}, #eef2f8`;
const TONE_CENTER =
  "radial-gradient(125% 135% at 50% -20%, rgba(37,99,235,0.14), rgba(37,99,235,0.03) 50%, rgba(37,99,235,0) 75%), #ffffff";

// 모든 배너 동일 높이: 모바일 자동 → xl에서 440px 고정. 콘텐츠는 세로 중앙.
const FRAME = "relative flex items-center h-auto xl:h-[440px]";
// 내부 2단 컨테이너: 모바일 세로 스택 → xl에서 좌우 배치.
const ROW =
  "w-full flex flex-col xl:flex-row xl:items-center justify-between gap-[clamp(24px,4vw,48px)] px-[clamp(22px,5vw,64px)] py-[clamp(26px,4vw,32px)]";
// 좌측 텍스트 컬럼 — xl에서 남는 폭을 채움.
const LEFT = "w-full xl:flex-1 xl:min-w-0";

// ── 공통 레이아웃 조각 ─────────────────────────────────────────────────
function Frame({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <div className={FRAME} style={{ background: tone }}>
      <div className={ROW}>{children}</div>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-[7px] px-4 py-[9px] rounded-full bg-white border border-hairline text-[clamp(13px,1.6vw,16px)] font-bold text-primary">
      {children}
    </span>
  );
}

// ── 01 · 훈련비 안내 (블루그레이) ──────────────────────────────────────
function FeeBanner() {
  const rows: [string, string, string, boolean][] = [
    ["집수리과정", "평일", "780,170", true],
    ["목공과정", "주말", "455,540", false],
    ["필름과정", "주말", "355,540", false],
  ];
  return (
    <Frame tone={TONE_BLUEGRAY}>
      <div className={LEFT}>
        <div className="mb-[18px]">
          <Eyebrow>자기부담금 안내</Eyebrow>
        </div>
        <h2 className="font-display font-bold text-ink leading-[1.2] tracking-[-1.4px] text-[clamp(30px,5.2vw,54px)] mb-[18px] break-keep">
          훈련비,
          <br />
          안내해 드립니다
        </h2>
        <p className="text-[clamp(16px,1.9vw,20px)] font-medium text-body-strong leading-[1.6] break-keep">
          내일배움카드가 있다면 아래 자기부담금만으로 수강할 수 있습니다.
        </p>
      </div>

      <div className="w-full xl:flex-none xl:w-[440px] bg-white border border-hairline rounded-[20px] shadow-card px-[clamp(22px,3vw,30px)] py-[clamp(20px,2.5vw,26px)]">
        <div className="flex items-baseline justify-between gap-[10px] pb-4 border-b-[1.5px] border-hairline">
          <span className="text-[clamp(18px,2vw,21px)] font-bold text-ink tracking-[-0.3px]">
            자기부담금 훈련비
          </span>
          <span className="text-[14px] font-semibold text-muted whitespace-nowrap">
            내일배움카드 기준
          </span>
        </div>
        {rows.map(([name, day, price, accent], idx) => (
          <div
            key={name}
            className={[
              "flex items-center justify-between gap-3 py-[15px]",
              idx < rows.length - 1 ? "border-b border-hairline" : "",
            ].join(" ")}
          >
            <span className="flex items-baseline gap-2">
              <span className="text-[clamp(17px,1.9vw,20px)] font-bold text-ink tracking-[-0.3px]">
                {name}
              </span>
              <span className="text-[14px] font-semibold text-muted">{day}</span>
            </span>
            <span className="flex items-baseline gap-[2px]">
              <span
                className={[
                  "font-display font-bold leading-none tracking-[-0.8px] text-[clamp(24px,2.8vw,30px)]",
                  accent ? "text-primary" : "text-ink",
                ].join(" ")}
              >
                {price}
              </span>
              <span className={accent ? "text-[16px] font-bold text-primary" : "text-[16px] font-bold text-ink"}>
                원
              </span>
            </span>
          </div>
        ))}
        <p className="text-[14px] font-medium text-muted leading-[1.6] mt-4 break-keep">
          * 상기 자기부담금은 내일배움카드 보유자 기준이며, 개인별 차이가 있을 수 있습니다.
        </p>
      </div>
    </Frame>
  );
}

// ── 02 · 이수자평가 A등급 (화이트) ─────────────────────────────────────
function GradeBanner() {
  return (
    <Frame tone={TONE_WHITE}>
      <div className={LEFT}>
        <div className="mb-5">
          <Eyebrow>
            <Award size={16} strokeWidth={2} />
            고용노동부 2025년 이수자평가
          </Eyebrow>
        </div>
        <h2 className="font-display font-bold text-ink leading-[1.14] tracking-[-2px] text-[clamp(34px,6.2vw,68px)] mb-5 break-keep">
          A등급,
          <br />
          받았습니다
        </h2>
        <p className="text-[clamp(16px,1.9vw,20px)] font-medium text-body-strong leading-[1.6] mb-2 break-keep">
          전국 직업훈련기관을 평가하는 이수자평가에서{" "}
          <b className="text-primary">최고 등급</b>입니다.
        </p>
        <p className="text-[clamp(15px,1.7vw,18px)] font-medium text-body leading-[1.6] break-keep">
          함께해 주신 수료생 여러분 덕분입니다.
        </p>
      </div>

      <div className="w-full xl:w-auto xl:flex-none flex justify-center xl:justify-end xl:pr-[clamp(0px,6vw,96px)]">
        <div className="relative grid place-items-center w-[clamp(150px,18vw,210px)] aspect-square">
          <div
            className="absolute inset-0 rounded-full bg-primary"
            style={{ boxShadow: "0 18px 40px rgba(37,99,235,0.28)" }}
          />
          <span className="relative font-display font-bold text-white leading-none tracking-[-5px] text-[clamp(80px,11vw,118px)]">
            A
          </span>
        </div>
      </div>
    </Frame>
  );
}

// ── 03 · 브랜드 메시지 (화이트, 중앙 정렬) ─────────────────────────────
function PensionBanner() {
  return (
    <div
      className="relative flex items-center justify-center h-auto xl:h-[440px]"
      style={{ background: TONE_CENTER }}
    >
      <div className="text-center px-[clamp(22px,5vw,64px)] py-[clamp(28px,5vw,40px)] max-w-[760px]">
        <p className="inline-flex items-center gap-[14px] text-[clamp(16px,2.2vw,22px)] font-bold tracking-[0.5px] text-primary mb-6 break-keep">
          <span className="w-7 h-[1.5px] bg-primary opacity-45" />
          기술이 곧 연금이다
          <span className="w-7 h-[1.5px] bg-primary opacity-45" />
        </p>
        <h2 className="font-display font-bold text-ink leading-[1.2] tracking-[-2px] text-[clamp(34px,6.8vw,74px)] mb-[22px] break-keep">
          도전하는 그대는
          <br />
          아름답다.
        </h2>
        <p className="text-[clamp(17px,2.1vw,23px)] font-medium text-body leading-[1.6] break-keep">
          성요셉목수학교가 그 도전을 함께합니다.
        </p>
      </div>
    </div>
  );
}

// ── 04 · 국비과정 모집 (블루그레이) ────────────────────────────────────
function CoursesBanner() {
  const rows: [string, string][] = [
    ["평일 집수리과정", "목공 · 전기 · 타일 · 단열 · 설비 · 욕실기구설치"],
    ["주말 인테리어목공과정", "공구사용법 · 벽체 · 천장 · 창호 · 바닥설치 · 보양정리"],
    ["주말 인테리어목공과정", "바탕처리 · 단순구조작업 · 응용구조작업"],
  ];
  return (
    <Frame tone={TONE_BLUEGRAY}>
      <div className={LEFT}>
        <div className="flex flex-wrap gap-2 mb-5">
          <Eyebrow>국비지원 훈련생 환영</Eyebrow>
          <Eyebrow>
            <CreditCard size={15} strokeWidth={2.2} />
            내일배움카드 수강
          </Eyebrow>
        </div>
        <h2 className="font-display font-bold text-ink leading-[1.16] tracking-[-1.6px] text-[clamp(32px,5.6vw,60px)] mb-7 break-keep">
          새로운 도전을
          <br />
          응원합니다
        </h2>
        <a
          href={`tel:${PHONE_FOOTER}`}
          className="inline-flex items-center gap-[14px] no-underline group"
        >
          <span className="w-[52px] h-[52px] grid place-items-center rounded-full bg-primary text-white flex-none transition-colors group-hover:bg-primary-hover group-active:scale-[0.98]">
            <Phone size={23} strokeWidth={2.2} />
          </span>
          <span className="font-display font-bold text-ink tracking-[-0.4px] text-[clamp(22px,3vw,32px)] whitespace-nowrap">
            {PHONE_FOOTER}
          </span>
        </a>
      </div>

      <div className="w-full xl:flex-none xl:w-[480px] bg-white border border-hairline rounded-[20px] shadow-card px-[clamp(20px,3vw,28px)] py-1">
        {rows.map(([name, desc], idx) => (
          <div
            key={`${name}-${idx}`}
            className={[
              "flex items-center gap-4 py-[22px]",
              idx < rows.length - 1 ? "border-b border-hairline" : "",
            ].join(" ")}
          >
            <span className="flex-none text-[14px] font-bold text-primary tracking-[0.5px]">
              국비
            </span>
            <span className="flex flex-col gap-1 min-w-0">
              <span className="text-[clamp(18px,2.1vw,22px)] font-bold text-ink tracking-[-0.3px]">
                {name}
              </span>
              <span className="text-[clamp(14px,1.6vw,16px)] font-medium text-body leading-[1.5] break-keep">
                {desc}
              </span>
            </span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

// ── 05 · 취업인증 이벤트 (화이트) ──────────────────────────────────────
function StarbucksBanner() {
  return (
    <Frame tone={TONE_WHITE}>
      <div className={LEFT}>
        <div className="mb-5">
          <Eyebrow>수료생 이벤트</Eyebrow>
        </div>
        <h2 className="font-display font-bold text-ink leading-[1.16] tracking-[-1.6px] text-[clamp(32px,5.6vw,60px)] mb-[18px] break-keep">
          취업인증 하면
          <br />
          스타벅스 커피 증정
        </h2>
        <p className="text-[clamp(16px,1.9vw,20px)] font-medium text-body-strong leading-[1.6] break-keep">
          수료 후 취업을 인증해 주시면 감사의 마음으로 커피 쿠폰을 보내드립니다.
        </p>
      </div>

      <div className="w-full xl:w-auto xl:flex-none flex justify-center xl:justify-end xl:pr-[clamp(0px,6vw,96px)]">
        <div className="relative w-[clamp(150px,20vw,230px)] aspect-square rounded-full bg-white border border-hairline shadow-card overflow-hidden">
          <Image
            src="/banners/starbucks.png"
            alt="스타벅스"
            fill
            sizes="230px"
            className="object-cover"
          />
        </div>
      </div>
    </Frame>
  );
}

// ── 06 · QnA 과정 차이 (블루그레이) ────────────────────────────────────
function FaqBanner() {
  return (
    <Frame tone={TONE_BLUEGRAY}>
      <div className={LEFT}>
        <div className="mb-[18px]">
          <Eyebrow>자주 묻는 질문</Eyebrow>
        </div>
        <div className="flex items-start gap-3 mb-[22px]">
          <span className="flex-none font-display font-bold leading-none text-primary tracking-[-1px] text-[clamp(28px,4vw,38px)]">
            Q.
          </span>
          <h2 className="font-display font-bold text-ink leading-[1.3] tracking-[-0.8px] text-[clamp(22px,3.6vw,36px)] mt-[2px] break-keep">
            두 과정, <span className="text-primary">차이점</span>이 어떤건가요?
          </h2>
        </div>
        <div className="flex flex-col gap-[10px] max-w-[450px]">
          <div className="flex items-center gap-3">
            <span className="flex-none w-[54px] text-center text-[14px] font-bold text-muted">
              목공
            </span>
            <span className="text-[clamp(15px,1.7vw,17px)] font-medium text-body-strong leading-[1.5] break-keep">
              건축목공(인테리어목수) 입문과정
            </span>
          </div>
          <div className="h-px bg-hairline" />
          <div className="flex items-center gap-3">
            <span className="flex-none w-[54px] text-center text-[14px] font-bold text-primary">
              집수리
            </span>
            <span className="text-[clamp(15px,1.7vw,17px)] font-medium text-body-strong leading-[1.5] break-keep">
              (친환경 건축시공) 주택리모델링(집수리) 기능양성과정
            </span>
          </div>
        </div>
      </div>

      <div className="w-full xl:flex-none xl:w-[480px] bg-white border border-hairline rounded-[20px] shadow-card px-[clamp(22px,3vw,32px)] py-6 flex flex-col justify-center gap-4">
        <div className="flex items-start gap-3">
          <span className="flex-none font-display font-bold leading-none text-primary tracking-[-1px] text-[clamp(28px,4vw,36px)]">
            A.
          </span>
          <p className="font-display font-bold text-ink leading-[1.45] tracking-[-0.5px] text-[clamp(18px,2.2vw,23px)] mt-[2px] break-keep">
            집수리과정은 목공과정을
            <br />
            <span className="text-primary">전부 포함하고, 그 이상</span>을 배웁니다
          </p>
        </div>
        <div className="flex items-center gap-3 bg-primary-softer border border-primary-border rounded-[14px] px-[18px] py-4">
          <span className="flex-none w-[30px] h-[30px] grid place-items-center rounded-full bg-primary text-white">
            <Check size={16} strokeWidth={3} />
          </span>
          <p className="text-[clamp(15px,1.7vw,17px)] font-semibold text-body-strong leading-[1.5] break-keep">
            <b className="text-ink font-bold">목공과정 전체</b>{" "}
            <span className="text-muted font-bold">＋</span>{" "}
            <b className="text-primary font-bold">
              타일·벽체단열·전기공사·온수·설비·욕실기구설치
            </b>
          </p>
        </div>
      </div>
    </Frame>
  );
}

// ── 슬라이드 목록 (캐러셀 순서) ────────────────────────────────────────
export interface BannerSlide {
  key: string;
  label: string; // dot/접근성 라벨
  Comp: () => React.ReactElement;
}

export const BANNER_SLIDES: BannerSlide[] = [
  { key: "fee", label: "내일배움카드 자기부담금 훈련비 안내", Comp: FeeBanner },
  { key: "grade", label: "고용노동부 2025년 이수자평가 A등급", Comp: GradeBanner },
  { key: "pension", label: "기술이 곧 연금이다 — 도전하는 그대는 아름답다", Comp: PensionBanner },
  { key: "courses", label: "국비지원 훈련생 환영 — 평일·주말 과정 안내", Comp: CoursesBanner },
  { key: "starbucks", label: "수료생 이벤트 — 취업인증 시 스타벅스 커피 증정", Comp: StarbucksBanner },
  { key: "faq", label: "자주 묻는 질문 — 집수리과정과 목공과정 차이점", Comp: FaqBanner },
];
