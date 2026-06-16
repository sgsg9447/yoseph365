// (public) 라우트 로딩 fallback. SiteShell 의 Header/Footer/StickyBar 는
// 레이아웃에 유지되므로 여기엔 본문 스켈레톤만 둔다(헤더 중복 렌더 금지).
export default function Loading() {
  return (
    <div className="wrap band">
      <p className="sr-only" role="status" aria-live="polite">
        콘텐츠를 불러오는 중입니다.
      </p>
      <div aria-hidden="true">
        {/* 페이지 헤딩 스켈레톤 */}
        <div className="mb-11 flex flex-col items-center gap-[14px]">
          <div className="sk h-[14px] w-[120px] rounded-full" />
          <div className="sk h-[34px] w-[min(440px,80%)]" />
          <div className="sk h-4 w-[min(560px,90%)]" />
        </div>
        {/* 과정 카드 그리드 스켈레톤 */}
        <div className="grid g-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="sk-card">
              <div className="sk sk-thumb mb-4" />
              <div className="sk mb-3 h-[18px] w-[68%]" />
              <div className="sk mb-2 h-[13px] w-full" />
              <div className="sk h-[13px] w-[82%]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
