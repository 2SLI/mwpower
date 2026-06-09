import { HomeProductCategorySection } from '../../../components/HomeProductCategorySection'
import { popularSearches, storeCategoryCards } from '../homeData'

function StoreHighlightCards({ onNavigate, onOpenProductPreset }) {
  const storeHighlights = [
    {
      eyebrow: '빠른 출고',
      title: '재고 있는 모델부터 바로 확인.',
      text: '모델 상세에서 가격과 재고를 확인하고 장바구니에 담아 주문할 수 있습니다.',
      action: '재고 상품 보기',
      onClick: () => onNavigate('products'),
      tone: 'bg-white text-slate-950',
    },
    {
      eyebrow: '추천 시리즈',
      title: 'DIN Rail 전원은 XDR부터.',
      text: '제어반, 자동화 장비에 자주 쓰이는 경제형 DIN Rail 라인업입니다.',
      action: 'XDR 보기',
      onClick: () => onOpenProductPreset?.({ majorId: 'ac-dc', subcategory: 'DIN Rail', leaf: 'XDR-E Series' }),
      tone: 'bg-slate-950 text-white',
    },
    {
      eyebrow: '주문 관리',
      title: '회원 주문내역을 한 곳에서.',
      text: '로그인 후 주문한 내역과 진행 상태를 계정에서 바로 확인할 수 있습니다.',
      action: '내 주문 보기',
      onClick: () => onNavigate('my-orders'),
      tone: 'bg-[#f5f5f7] text-slate-950',
    },
  ]

  return (
    <section className="px-5 pb-16 pt-1 md:px-8 md:pb-20" aria-label="스토어 추천">
      <div className="mx-auto w-full max-w-[1480px]">
        <header className="mb-5 flex items-end justify-between gap-4">
          <h2 className="m-0 text-[clamp(1.55rem,2.2vw,2.35rem)] font-bold text-slate-950">
            최신 구매 경험.
            <span className="text-[#d53232]"> 더 빠르고 선명하게.</span>
          </h2>
        </header>

        <div className="grid gap-4 lg:grid-cols-3">
          {storeHighlights.map((item) => (
            <button
              key={item.title}
              type="button"
              className={`min-h-[300px] rounded-[28px] p-7 text-left shadow-[0_22px_56px_-44px_rgba(15,23,42,0.7)] transition hover:-translate-y-0.5 ${item.tone}`}
              onClick={item.onClick}
            >
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#d53232]">{item.eyebrow}</span>
              <strong className="mt-4 block max-w-[13ch] text-[clamp(1.45rem,1.9vw,2.15rem)] font-bold leading-[1.18]">{item.title}</strong>
              <span className="mt-4 block max-w-[28ch] text-sm font-semibold leading-6 opacity-70">{item.text}</span>
              <span className="mt-7 inline-flex h-10 items-center rounded-full bg-[#d53232] px-4 text-xs font-bold text-white">{item.action}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export function StoreHome({
  isActive,
  mobileSearchKeyword,
  setMobileSearchKeyword,
  mobileSearchShortcutList,
  orderItemCount,
  onSearchSubmit,
  onNavigate,
  onOpenProductPreset,
  onOpenProductSearch,
}) {
  return (
    <div id="shop-home-sections" className={`${isActive ? '' : 'is-hidden'} bg-[#f5f5f7] text-slate-950`}>
      <h1 className="sr-only">MWPOWER SHOP MEAN WELL 전원공급장치 온라인 쇼핑몰</h1>

      <section className="px-5 pb-8 pt-8 md:px-8 md:pb-12 md:pt-10" aria-label="스토어 메인">
        <div className="mx-auto w-full max-w-[1320px]">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-end">
            <div>
              <p className="m-0 text-[12px] font-bold uppercase tracking-[0.14em] text-[#d53232]">MWPOWER Store</p>
              <h2 className="m-0 mt-3 max-w-[760px] text-[clamp(1.8rem,3.1vw,3.25rem)] font-bold leading-[1.18] text-slate-950">
                <span className="text-[#d53232]">MWPOWER</span>는 정품 민웰 SMPS를 판매합니다.
              </h2>
              <p className="m-0 mt-4 max-w-[620px] text-[16px] font-semibold leading-7 text-slate-500">
                모델명으로 검색하고, 재고와 가격을 확인한 뒤 바로 주문하세요.
              </p>
            </div>

            <div className="rounded-[18px] bg-white p-5 shadow-[0_18px_45px_-40px_rgba(15,23,42,0.55)]">
              <p className="m-0 text-[13px] font-bold text-slate-950">구매 도움이 필요하신가요?</p>
              <p className="m-0 mt-1 text-sm font-semibold leading-6 text-slate-500">모델명을 검색하거나 인기 카테고리에서 바로 시작하세요.</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" className="h-10 rounded-full bg-slate-950 px-3 text-xs font-bold text-white" onClick={() => onNavigate('products')}>
                  전체 상품
                </button>
                <button type="button" className="h-10 rounded-full bg-slate-100 px-3 text-xs font-bold text-slate-800" onClick={() => onNavigate('order-list')}>
                  장바구니 {orderItemCount > 99 ? '99+' : orderItemCount}
                </button>
              </div>
            </div>
          </div>

          <form
            className="mt-8 flex min-h-[58px] max-w-[760px] items-center gap-3 rounded-full bg-white px-5 shadow-[0_18px_45px_-40px_rgba(15,23,42,0.6)]"
            role="search"
            aria-label="상품 검색"
            onSubmit={onSearchSubmit}
          >
            <i className="fa-solid fa-magnifying-glass text-lg text-slate-400" aria-hidden="true"></i>
            <input
              type="search"
              value={mobileSearchKeyword}
              onChange={(event) => setMobileSearchKeyword(event.target.value)}
              placeholder="상품명을 입력하십시오."
              className="min-w-0 flex-1 bg-transparent text-[16px] font-bold text-slate-900 placeholder:font-semibold placeholder:text-slate-400"
            />
            <button type="submit" className="h-10 rounded-full bg-[#d53232] px-5 text-sm font-bold text-white transition hover:bg-[#bd2929]">
              검색
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {(mobileSearchKeyword.trim() && mobileSearchShortcutList.length > 0 ? mobileSearchShortcutList : popularSearches).map((item) => {
              const label = typeof item === 'string' ? item : item.displayModel
              return (
                <button
                  key={typeof item === 'string' ? item : item.modelKey}
                  type="button"
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:text-[#d53232]"
                  onClick={() => {
                    if (typeof item === 'string') {
                      onOpenProductSearch?.(item)
                      return
                    }
                    onOpenProductPreset?.({
                      majorId: item.majorId,
                      subcategory: item.subcategory,
                      leaf: item.leaf,
                      groupName: item.groupName,
                      model: item.model,
                      optionModel: item.optionModel,
                    })
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="px-5 pb-8 md:px-8" aria-label="스토어 카테고리">
        <div className="mx-auto w-full max-w-[1480px]">
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {storeCategoryCards.map((item) => (
              <button
                key={item.label}
                type="button"
                className="grid w-[168px] shrink-0 justify-items-center gap-3 rounded-[22px] bg-white px-4 py-5 text-center shadow-[0_18px_45px_-40px_rgba(15,23,42,0.65)] transition hover:-translate-y-0.5"
                onClick={() => (item.preset ? onOpenProductPreset?.(item.preset) : onOpenProductSearch?.(item.search))}
              >
                <span className="grid h-24 w-24 place-items-center">
                  <img src={item.image} alt="" className="max-h-20 max-w-24 object-contain" loading="lazy" />
                </span>
                <span className="text-sm font-bold text-slate-900">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <HomeProductCategorySection onNavigate={onNavigate} onOpenProductPreset={onOpenProductPreset} variant="store" />
      <StoreHighlightCards onNavigate={onNavigate} onOpenProductPreset={onOpenProductPreset} />
    </div>
  )
}
