import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { getQuoteItemSummary, normalizeQuoteItems } from '../features/quoteCart'
import { lockBodyScroll } from '../utils/bodyScrollLock'

export function OrderListView({ isOpen, items, onClose, onNavigateProducts, onUpdateQuantity, onRemoveItem, onClearItems }) {
  const normalizedItems = useMemo(() => normalizeQuoteItems(items), [items])
  const summary = useMemo(() => getQuoteItemSummary(normalizedItems), [normalizedItems])

  useEffect(() => {
    if (!isOpen) return undefined
    return lockBodyScroll()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return undefined

    const handleEscape = (event) => {
      if (event.key !== 'Escape') return
      onClose?.()
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[1200] bg-[#f3f4f6]">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-list-modal-title"
        className="flex h-dvh flex-col overflow-hidden bg-[#f3f4f6]"
      >
        <header className="shrink-0 bg-white">
          <div className="mx-auto grid h-[72px] max-w-[1180px] grid-cols-[1fr_auto_1fr] items-center px-5 max-[640px]:h-[58px] max-[640px]:px-3">
            <button type="button" className="justify-self-start rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-200 max-[640px]:px-3" onClick={() => onNavigateProducts?.()}>
              계속 담기
            </button>
            <h1 id="order-list-modal-title" className="m-0 text-[22px] font-black text-slate-950 max-[640px]:text-lg">
              주문목록
            </h1>
            <button type="button" className="grid h-10 w-10 place-items-center justify-self-end rounded-full bg-slate-100 text-xl font-black text-slate-700 transition hover:bg-slate-200 max-[640px]:h-9 max-[640px]:w-9" onClick={() => onClose?.()} aria-label="주문목록 닫기">
              ×
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto grid max-w-[1180px] gap-6 px-5 py-9 lg:grid-cols-[minmax(0,1fr)_340px] max-[980px]:py-5 max-[640px]:px-3 max-[640px]:py-3">
            <div className="grid content-start gap-5">
              <section className="rounded-[18px] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70 max-[640px]:rounded-2xl max-[640px]:p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="m-0 text-[11px] font-black uppercase tracking-[0.12em] text-[#d53232]">Order Info</p>
                    <h2 className="m-0 mt-2 text-[21px] font-black text-slate-900">민웰파워 주문목록</h2>
                    <p className="m-0 mt-3 text-sm font-semibold leading-6 text-slate-500">
                      주문할 품목과 수량을 확인하세요. 실제 주문 진행은 담당자 상담을 통해 확정됩니다.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
                    재고 확인 대상
                  </span>
                </div>
              </section>

              <section className="rounded-[18px] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70 max-[640px]:rounded-2xl max-[640px]:p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="m-0 text-[11px] font-black uppercase tracking-[0.12em] text-[#d53232]">MWPOWER</p>
                    <h2 className="m-0 mt-2 text-[21px] font-black text-slate-900">담긴 상품</h2>
                  </div>
                  {normalizedItems.length > 0 ? (
                    <button type="button" className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-200" onClick={() => onClearItems?.()}>
                      목록 비우기
                    </button>
                  ) : null}
                </div>

                {normalizedItems.length === 0 ? (
                  <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 px-4 py-12 text-center ring-1 ring-dashed ring-slate-300">
                    <strong className="text-lg font-black text-slate-900">아직 담긴 품목이 없습니다.</strong>
                    <p className="m-0 text-sm leading-6 text-slate-500">제품 상세에서 수량을 정한 뒤 주문목록에 담아주세요.</p>
                    <div>
                      <button type="button" className="inline-flex h-11 items-center rounded-full bg-[#d53232] px-5 text-sm font-extrabold text-white transition hover:bg-[#bd2929]" onClick={() => onNavigateProducts?.()}>
                        제품 페이지로 이동
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-4">
                    {normalizedItems.map((item) => (
                      <article key={item.id} className="rounded-2xl bg-white pb-4 ring-1 ring-slate-200/80">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                          <div>
                            <p className="m-0 text-sm font-black text-slate-900">민웰파워</p>
                            <p className="m-0 mt-1 text-xs font-semibold text-emerald-600">재고 및 납기 확인 후 안내</p>
                          </div>
                          <button type="button" className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-500 transition hover:bg-rose-50 hover:text-[#b4262e]" onClick={() => onRemoveItem?.(item.id)}>
                            삭제
                          </button>
                        </div>

                        <div className="grid gap-4 px-4 py-4 md:grid-cols-[86px_minmax(0,1fr)] max-[640px]:grid-cols-[78px_minmax(0,1fr)]">
                          <div className="overflow-hidden rounded-xl bg-slate-50 p-1 ring-1 ring-slate-100">
                            {item.thumbnailUrl ? (
                              <img src={item.thumbnailUrl} alt={item.displayModel} className="aspect-square h-full w-full object-contain" loading="lazy" />
                            ) : (
                              <div className="grid aspect-square h-full w-full place-items-center text-[10px] font-black text-slate-400">NO IMAGE</div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <h3 className="m-0 break-all text-[17px] font-black leading-6 text-slate-900">{item.displayModel}</h3>
                            {item.optionModel && item.optionModel !== item.baseModel ? <p className="m-0 mt-1 text-xs font-semibold text-slate-500">기본 모델: {item.baseModel}</p> : null}
                            {item.wattage ? <p className="m-0 mt-1 text-xs font-semibold text-slate-500">Wattage: {item.wattage}</p> : null}
                          </div>
                        </div>

                        <div className="mx-4 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                          <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                            <span className="rounded-md bg-white px-2 py-1 text-xs text-slate-500 ring-1 ring-slate-200">수량</span>
                            <input type="number" min="1" inputMode="numeric" value={item.quantity} onChange={(event) => onUpdateQuantity?.(item.id, event.target.value)} className="h-9 w-20 rounded-lg border-0 bg-white px-2 text-center text-sm font-black text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-[#d53232]/20" />
                          </label>
                          <strong className="text-sm font-black text-slate-900">{Number(item.quantity).toLocaleString('ko-KR')}개</strong>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="grid content-start gap-4">
              <div className="rounded-[18px] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="m-0 text-xl font-black text-slate-900">주문 요약</h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">확인중</span>
                </div>

                <dl className="mt-5 grid gap-3 text-sm font-bold">
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">품목 수</dt>
                    <dd className="m-0 text-slate-900">{summary.lineCount.toLocaleString('ko-KR')}개</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">총 수량</dt>
                    <dd className="m-0 text-slate-900">{summary.totalQuantity.toLocaleString('ko-KR')}개</dd>
                  </div>
                </dl>

                <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-4">
                  <p className="m-0 text-sm font-black text-emerald-700">담당자 확인 후 재고와 납기를 안내합니다.</p>
                  <p className="m-0 mt-1 text-xs font-semibold leading-5 text-emerald-700/80">수량 변경은 이 화면에서 바로 반영됩니다.</p>
                </div>

                <button type="button" className="mt-5 h-12 w-full rounded-full bg-[#d53232] text-sm font-black text-white transition hover:bg-[#bd2929]" onClick={() => onNavigateProducts?.()}>
                  제품 더 담기
                </button>
              </div>

              <div className="rounded-[18px] bg-slate-900 px-5 py-4 text-white">
                <p className="m-0 text-sm font-black">상담문의 010-6358-3144</p>
                <p className="m-0 mt-1 text-xs font-semibold leading-5 text-white/65">긴급 납기나 대량 발주는 전화로 문의해주세요.</p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>,
    document.body
  )
}
