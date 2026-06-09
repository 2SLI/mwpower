import { productCards } from '../homeData'

export function ProductFocusSection({ onNavigate }) {
  return (
    <section className="w-full border-t border-slate-200 bg-slate-200/55 py-10 md:py-14" aria-label="Product">
      <div className="mx-auto w-full max-w-[1540px] px-5 md:px-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-[clamp(1.55rem,2.1vw,2.35rem)] font-bold text-slate-900">
            <span className="text-[#e5332a]">Product</span> Focus
          </h2>
          <a
            href="#"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('products')
            }}
            className="inline-flex h-10 items-center rounded-full border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            View More
          </a>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {productCards.map((item) => (
            <article key={item.name} className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <p className="text-xs font-semibold text-slate-500">{item.type}</p>
              <h3 className="mt-1 text-[1.05rem] font-bold text-slate-800">{item.name}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-500">{item.desc}</p>
            </article>
          ))}
        </div>

        <article className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid lg:grid-cols-[1fr_1.1fr]">
          <div className="grid min-h-[200px] place-items-center bg-[linear-gradient(135deg,#f1f5f9_0%,#dbe5ef_100%)] px-6 py-8 text-center">
            <div>
              <p className="text-xs font-bold tracking-[0.12em] text-[#d7322a]">CATEGORY FIRST</p>
              <h3 className="mt-3 text-[clamp(1.25rem,1.6vw,1.7rem)] font-bold leading-tight text-slate-900">MWPOWER</h3>
            </div>
          </div>
          <div className="p-6 lg:p-8">
            <p className="text-xs font-bold tracking-[0.11em] text-[#d7322a]">PRODUCT INFORMATION</p>
            <h3 className="mt-3 text-[clamp(1.4rem,1.8vw,2rem)] font-bold leading-tight text-slate-900">
              라인 특성에 맞는 전원 제품군을
              <br />
              카테고리 기반으로 빠르게 탐색하세요.
            </h3>
            <a
              href="#"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('products')
              }}
              className="mt-6 inline-flex h-11 items-center rounded-full bg-[#e5332a] px-5 text-sm font-bold text-white transition hover:bg-[#c72b23]"
            >
              제품 카테고리 보기
            </a>
          </div>
        </article>
      </div>
    </section>
  )
}
