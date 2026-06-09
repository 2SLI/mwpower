export function MobileSolutionShowcase({
  mobileSearchKeyword,
  setMobileSearchKeyword,
  mobileSearchShortcutList,
  mobileSolutionCards,
  mobileSolutionIndex,
  mobileSolutionTrackRef,
  onSearchSubmit,
  onNavigateSolution,
  onOpenProductSearch,
  scrollToSolution,
}) {
  return (
    <section className="relative hidden bg-slate-950 max-[640px]:block" aria-label="모바일 솔루션 메뉴">
      <form className="bg-[#fff7f8] px-3 pb-4 pt-3" role="search" aria-label="상품 검색" onSubmit={onSearchSubmit}>
        <label className="flex h-11 items-center gap-2.5 rounded-full bg-white px-4 text-slate-500 shadow-[0_10px_24px_rgba(15,23,42,0.1)] ring-1 ring-slate-100">
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7"></circle>
            <line x1="16.5" y1="16.5" x2="21" y2="21"></line>
          </svg>
          <input
            type="search"
            value={mobileSearchKeyword}
            onChange={(event) => setMobileSearchKeyword(event.target.value)}
            aria-label="상품명/시리즈/그룹 검색"
            className="min-w-0 flex-1 border-0 bg-transparent text-[16px] font-bold text-slate-800 outline-none placeholder:text-transparent"
          />
          <button type="submit" className="sr-only">
            검색
          </button>
        </label>
        {mobileSearchShortcutList.length > 0 ? (
          <div className="mt-2.5">
            <p className="m-0 text-[13px] font-bold text-[#b4262e]">바로가기</p>
            <div className="mt-1.5 flex flex-wrap justify-center gap-1.5 pb-0.5">
              {mobileSearchShortcutList.map((shortcut) => (
                <button
                  key={shortcut.modelKey}
                  type="button"
                  className="shrink-0 rounded-full border border-[#d79aa2] bg-white px-2.5 py-1 text-[11px] font-bold uppercase leading-4 text-[#b4262e] shadow-[0_4px_10px_rgba(15,23,42,0.04)]"
                  onClick={() => onOpenProductSearch?.(shortcut.displayModel)}
                >
                  {shortcut.displayModel}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </form>

      <div ref={mobileSolutionTrackRef} className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {mobileSolutionCards.map((item) => (
          <a
            href="#"
            key={`mobile-solution-${item.alt}-${item.mobileTitle}`}
            className="relative block h-[calc(100dvh-218px)] min-h-[368px] w-full shrink-0 snap-start overflow-hidden"
            onClick={(event) => {
              event.preventDefault()
              onNavigateSolution(item)
            }}
          >
            <img className="absolute inset-0 h-full w-full object-cover" src={item.image} alt={item.alt} />
            <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.26)_0%,rgba(15,23,42,0.84)_66%,rgba(2,6,23,0.95)_100%)]"></span>

            <div className="absolute left-1/2 top-1/2 z-10 w-[min(calc(100%-3rem),22rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/20 bg-black/28 p-4 backdrop-blur-sm">
              <p className="m-0 text-[10px] font-bold tracking-[0.12em] text-rose-200">MWPOWER</p>
              <h3 className="m-0 mt-1.5 text-[clamp(17px,5vw,21px)] font-bold leading-[1.2] text-white">{item.mobileTitle}</h3>
              {item.mobileSubtitle ? <p className="m-0 mt-1.5 text-[13px] font-semibold leading-5 text-slate-100">{item.mobileSubtitle}</p> : null}
            </div>
          </a>
        ))}
      </div>

      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {mobileSolutionCards.map((item, index) => (
          <button
            key={`mobile-solution-dot-${item.alt}-${index}`}
            type="button"
            aria-label={`${index + 1}번 메뉴로 이동`}
            className={`h-2.5 w-2.5 rounded-full border-0 p-0 ${mobileSolutionIndex === index ? 'bg-white' : 'bg-white/45'}`}
            onClick={() => scrollToSolution(index)}
          ></button>
        ))}
      </div>
    </section>
  )
}
