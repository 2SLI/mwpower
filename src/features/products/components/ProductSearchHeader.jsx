export function ProductSearchHeader({ view, actions }) {
  const showStatus = (view.isShopSite ? view.orderItemCount > 0 || view.quoteItemCount > 0 : view.quoteItemCount > 0) || view.quoteFeedback

  return (
    <>
      <div className="rounded-xl border border-slate-300 bg-white px-5 py-5 max-[640px]:px-3.5">
        <h1 className="mb-0 mt-0 text-[clamp(28px,2vw,36px)] font-bold leading-tight text-slate-800 max-[980px]:text-[28px] max-[640px]:text-[23px]">
          Product Information
        </h1>
        <p className="mb-0 mt-2 text-[14px] text-slate-500">{view.pageDescription}</p>
      </div>

      <div className="product-search mb-2.5 mt-4 flex h-[54px] max-w-[720px] items-center gap-2.5 rounded-[999px] border border-slate-300 bg-white px-4 focus-within:border-[#c83a3a] focus-within:shadow-[0_0_0_2px_#f3d8d8] max-[640px]:h-[46px] max-[640px]:max-w-none max-[640px]:px-3" role="search" aria-label="Product search">
        <label className="sr-only" htmlFor="product-search-input">Search products</label>
        <i className="fa-solid fa-magnifying-glass text-sm text-slate-500" aria-hidden="true"></i>
        <input
          id="product-search-input"
          className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-slate-700 outline-none placeholder:text-slate-400 max-[640px]:text-base"
          type="text"
          placeholder="상품명/시리즈/그룹 검색 (예: LED, MEDICAL)"
          autoComplete="off"
          spellCheck="false"
          value={view.search}
          onChange={(event) => actions.onSearchChange(event.target.value)}
        />
        <button type="button" className={`h-[34px] rounded-full bg-slate-200 px-3.5 text-xs font-bold text-slate-700 max-[640px]:h-[30px] max-[640px]:px-3 ${view.hasSearchInput ? '' : 'is-hidden'}`} onClick={() => actions.onSearchChange('')}>
          Clear
        </button>
      </div>

      {showStatus ? (
        <div className="mb-4 rounded-2xl border border-[#efc8cd] bg-[linear-gradient(135deg,#fff7f7_0%,#fff1f2_100%)] px-4 py-3.5 shadow-[0_10px_24px_rgba(185,37,45,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="m-0 text-[11px] font-bold uppercase tracking-[0.08em] text-[#b4262e]">{view.isShopSite ? 'Order List' : 'Quote List'}</p>
              <p className="m-0 mt-1 text-sm font-bold text-slate-900">
                {view.isShopSite ? `현재 주문목록 ${view.orderItemCount}개 / 견적목록 ${view.quoteItemCount}개 수량이 담겨 있습니다.` : `현재 견적목록 ${view.quoteItemCount}개 수량이 담겨 있습니다.`}
              </p>
              <p className="m-0 mt-1 text-[13px] font-semibold text-slate-600">
                {view.quoteFeedback || '모델 상세에서 수량을 정해 담고, 우측 견적 아이콘에서 바로 견적요청서를 확인할 수 있습니다.'}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {view.hasSearchInput && view.modelShortcutList.length > 0 ? (
        <div className="mb-3 rounded-xl border border-[#efc9cf] bg-[#fff8f9] px-3.5 py-3">
          <p className="mb-2 mt-0 text-[12px] font-bold uppercase tracking-[0.06em] text-[#b22b37]">바로가기</p>
          <div className="flex flex-wrap gap-2">
            {view.modelShortcutList.map((shortcut) => (
              <button key={`${shortcut.modelKey}-${shortcut.displayModel}`} type="button" className="rounded-full border border-[#d9a0a8] bg-white px-3 py-1.5 text-[12px] font-bold uppercase text-[#b52c37] transition hover:border-[#c9252f] hover:bg-[#fff3f4] hover:text-[#c9252f]" onClick={() => actions.onShortcutModelClick(shortcut)}>
                {shortcut.displayModel}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mb-8 min-h-[18px] text-[13px] text-slate-500 max-[980px]:mb-6" aria-live="polite">{view.searchMetaText}</p>

      {view.showMajorTitle ? (
        <h2 className="mb-4 mt-0 text-[clamp(28px,2vw,36px)] font-bold leading-tight text-slate-900 max-[980px]:text-[28px] max-[640px]:text-[23px]">{view.majorTitle}</h2>
      ) : null}
    </>
  )
}
