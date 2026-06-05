const featuredProductSeries = [
  {
    label: 'LRS Series',
    description: '표준 Enclosed 전원공급장치',
    image: '/catalog/meanwell/thumbnails/lrs.png',
    preset: { majorId: 'ac-dc', subcategory: 'Enclosed Type', leaf: 'LRS Series' },
  },
  {
    label: 'XDR-E Series',
    description: '경제형 DIN Rail 전원',
    image: '/catalog/meanwell/thumbnails/xdr.png',
    preset: { majorId: 'ac-dc', subcategory: 'DIN Rail', leaf: 'XDR-E Series' },
  },
  {
    label: 'MDR Series',
    description: '슬림 DIN Rail 전원',
    image: '/catalog/meanwell/thumbnails/mdr.png',
    preset: { majorId: 'ac-dc', subcategory: 'DIN Rail', leaf: 'MDR Series' },
  },
  {
    label: 'HDR Series',
    description: '건물 제어용 DIN Rail 전원',
    image: '/catalog/meanwell/thumbnails/hdr.png',
    preset: { majorId: 'ac-dc', subcategory: 'DIN Rail', leaf: 'HDR Series' },
  },
  {
    label: 'NDR Series',
    description: '산업용 DIN Rail 전원',
    image: '/catalog/meanwell/thumbnails/ndr.png',
    preset: { majorId: 'ac-dc', subcategory: 'DIN Rail', leaf: 'NDR Series' },
  },
  {
    label: 'EDR Series',
    description: '보급형 DIN Rail 전원',
    image: '/catalog/meanwell/thumbnails/edr.png',
    preset: { majorId: 'ac-dc', subcategory: 'DIN Rail', leaf: 'EDR Series' },
  },
  {
    label: 'WDR Series',
    description: '광범위 입력 DIN Rail 전원',
    image: '/catalog/meanwell/thumbnails/wdr.png',
    preset: { majorId: 'ac-dc', subcategory: 'DIN Rail', leaf: 'WDR Series' },
  },
  {
    label: 'DRP Series',
    description: '고출력 Rack Power',
    image: '/catalog/meanwell/thumbnails/drp.jpg',
    preset: { majorId: 'ac-dc', subcategory: 'Rack Power', leaf: 'DRP Series' },
  },
]

export function HomeProductCategorySection({ onNavigate, onOpenProductPreset, variant = 'default' }) {
  const isStoreVariant = variant === 'store'

  function openSeries(series) {
    if (series?.preset) {
      onOpenProductPreset?.(series.preset)
      return
    }
    onNavigate?.('products')
  }

  return (
    <section
      className={`w-full py-10 md:py-14 ${isStoreVariant ? 'bg-[#f5f5f7]' : 'border-t border-slate-100 bg-white'}`}
      aria-label="상품 카테고리"
    >
      <div className="mx-auto w-full max-w-[1540px] px-5 md:px-8">
        <header className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="m-0 text-[11px] font-bold uppercase tracking-[0.14em] text-[#d7322a]">Product Category</p>
            <h2 className="mt-2 text-[clamp(1.55rem,2.1vw,2.35rem)] font-bold text-slate-900">인기 상품 카테고리</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">자주 찾는 MEAN WELL 전원공급장치 시리즈를 바로 확인하세요.</p>
          </div>
          <button
            type="button"
            className="hidden h-10 items-center rounded-full border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 sm:inline-flex"
            onClick={() => onNavigate?.('products')}
          >
            전체 상품
          </button>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProductSeries.map((series) => (
            <button
              key={series.label}
              type="button"
              className="group grid min-h-[168px] grid-cols-[104px_minmax(0,1fr)] items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#e5332a] hover:shadow-md max-[520px]:grid-cols-[92px_minmax(0,1fr)]"
              onClick={() => openSeries(series)}
            >
              <span className="grid aspect-square w-full place-items-center rounded-xl bg-slate-100">
                <img src={series.image} alt="" className="max-h-[82px] max-w-[88px] object-contain" loading="lazy" />
              </span>
              <span className="min-w-0">
                <span className="block text-[17px] font-bold leading-tight text-slate-900 group-hover:text-[#e5332a]">{series.label}</span>
                <span className="mt-2 block text-[13px] font-semibold leading-5 text-slate-500">{series.description}</span>
                <span className="mt-4 inline-flex items-center text-[12px] font-bold text-[#e5332a]">
                  제품 보기
                  <i className="fa-solid fa-angle-right ml-1 text-[11px]" aria-hidden="true"></i>
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
