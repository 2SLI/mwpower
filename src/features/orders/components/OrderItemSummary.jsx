import { formatOrderPrice } from '../../orderService'

export function SingleOrderItemSummary({ product }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-xl font-black text-slate-950">주문 상품</h2>
          <p className="m-0 mt-2 text-[22px] font-black text-slate-900">{product.productName}</p>
          <p className="m-0 mt-1 text-sm font-bold text-slate-500">
            재고 {Number.isFinite(product.stockQuantity) ? `${product.stockQuantity.toLocaleString('ko-KR')}개` : '미등록'}
          </p>
        </div>
        <div className="rounded-xl bg-[#effaf3] px-4 py-3 text-right">
          <p className="m-0 text-xs font-black text-[#087a3d]">상품 금액</p>
          <p className="m-0 mt-1 text-lg font-black text-[#087a3d]">{formatOrderPrice(product.productPrice)}</p>
        </div>
      </div>

      {!product.inStock ? (
        <p className="m-0 mt-4 rounded-xl bg-[#fff1f2] px-4 py-3 text-sm font-bold text-[#b42323]">
          재고가 없는 상품은 주문할 수 없습니다. 견적목록으로 문의해주세요.
        </p>
      ) : null}
    </section>
  )
}

export function MultiOrderItemSummary({ items }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="m-0 text-xl font-black text-slate-950">주문 상품</h2>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <article key={item.id} className="grid gap-3 rounded-2xl bg-slate-50 p-3 sm:grid-cols-[72px_minmax(0,1fr)_auto]">
            <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-100">
              {item.thumbnailUrl ? (
                <img src={item.thumbnailUrl} alt={item.displayModel} className="aspect-square h-full w-full object-contain" loading="lazy" />
              ) : (
                <div className="grid aspect-square h-full w-full place-items-center text-[10px] font-black text-slate-400">NO IMAGE</div>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="m-0 break-all text-base font-black text-slate-950">{item.displayModel}</h3>
              {item.wattage ? <p className="m-0 mt-1 text-xs font-semibold text-slate-500">Wattage: {item.wattage}</p> : null}
            </div>
            <div className="self-center text-right">
              <strong className="block text-sm font-black text-slate-900">{Number(item.quantity).toLocaleString('ko-KR')}개</strong>
              {Number.isFinite(Number(item.stockQuantity)) ? (
                <span className={`mt-1 block text-[11px] font-bold ${Number(item.quantity) > Number(item.stockQuantity) ? 'text-[#b42323]' : 'text-slate-500'}`}>
                  재고 {Number(item.stockQuantity).toLocaleString('ko-KR')}개
                </span>
              ) : null}
              <span className="mt-1 block text-xs font-extrabold text-[#087a3d]">{formatOrderPrice(item.totalPrice)}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
