export function NewProductsSection({ show }) {
  return (
    <>
      <div className={`product-new-head mt-14 flex items-center justify-between max-[980px]:mt-10 ${show ? '' : 'is-hidden'}`}>
        <h2 className="m-0 text-[clamp(28px,2vw,36px)] font-bold leading-tight text-slate-900 max-[980px]:text-[28px] max-[640px]:text-[23px]">New Products</h2>
        <a href="#" className="text-sm font-bold text-[#bf2222]">View all</a>
      </div>

      <div className={`new-products mt-4 grid gap-3 ${show ? '' : 'is-hidden'}`}>
        <article className="grid grid-cols-[130px_1fr] gap-5 rounded-2xl border border-slate-300 bg-white px-4 py-4 max-[640px]:grid-cols-1">
          <div className="grid h-[96px] w-full place-items-center rounded-lg bg-slate-100 text-[#c12b2b]"><i className="fa-solid fa-microchip text-2xl" aria-hidden="true"></i></div>
          <div>
            <span className="inline-block rounded-full bg-[#d31f1f] px-2 py-[3px] text-[11px] font-bold text-white">NEW</span>
            <h3 className="mb-1 mt-2 text-[22px] font-bold text-slate-900 max-[640px]:text-[20px]">DX1 Controller</h3>
            <p className="m-0 text-[14px] text-slate-500">카테고리 탐색 기준으로 새로 등록될 제품군의 자리입니다.</p>
          </div>
        </article>
      </div>
    </>
  )
}
