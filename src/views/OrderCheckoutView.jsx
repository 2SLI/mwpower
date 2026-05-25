import { useEffect, useMemo, useState } from 'react'
import { createGuestOrderFromItems, formatOrderPrice, normalizePhoneForOrder, resolveProductForOrder, validateOrderPayload } from '../features/orderService'
import { requestNicepayVbankPayment } from '../features/nicepayService'
import { getQuoteItemSummary, normalizeQuoteItems } from '../features/quoteCart'

const INITIAL_FORM = {
  customerName: '',
  phone: '',
  email: '',
  postalCode: '',
  address: '',
  detailAddress: '',
  deliveryMemo: '',
}

export function OrderCheckoutView({ isActive, items, authUser = null, onNavigateProducts, onOrderComplete, onClearItems }) {
  const normalizedItems = useMemo(() => normalizeQuoteItems(items), [items])
  const summary = useMemo(() => getQuoteItemSummary(normalizedItems), [normalizedItems])
  const pricedItems = useMemo(
    () =>
      normalizedItems.map((item) => {
        try {
          const product = resolveProductForOrder(item.optionModel || item.displayModel || item.baseModel)
          const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1))
          return {
            ...item,
            productPrice: product.productPrice,
            stockQuantity: product.stockQuantity,
            totalPrice: product.productPrice * quantity,
          }
        } catch {
          return {
            ...item,
            productPrice: 0,
            totalPrice: 0,
          }
        }
      }),
    [normalizedItems]
  )
  const orderTotalPrice = pricedItems.reduce((sum, item) => sum + item.totalPrice, 0)
  const overStockItems = pricedItems.filter((item) => Number.isFinite(Number(item.stockQuantity)) && Number(item.quantity) > Number(item.stockQuantity))
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isActive || !authUser) return
    setForm((prev) => ({
      ...prev,
      customerName: prev.customerName || authUser.displayName || '',
      email: prev.email || authUser.email || '',
    }))
  }, [isActive, authUser?.uid])

  const handleChange = (key, value) => {
    const nextValue = key === 'phone' ? normalizePhoneForOrder(value) : value
    setForm((prev) => ({ ...prev, [key]: nextValue }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }))
    if (submitError) setSubmitError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    if (overStockItems.length > 0) {
      setSubmitError(
        `${overStockItems[0].displayModel}은 현재 재고 ${Number(overStockItems[0].stockQuantity).toLocaleString('ko-KR')}개까지만 주문할 수 있습니다.`
      )
      return
    }

    const validationErrors = validateOrderPayload({ ...form, quantity: summary.totalQuantity })
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const order = await createGuestOrderFromItems({
        ...form,
        items: normalizedItems,
        userId: authUser?.uid || '',
        userEmail: authUser?.email || '',
        userDisplayName: authUser?.displayName || form.customerName,
      })
      await requestNicepayVbankPayment(order)
      onClearItems?.()
    } catch (error) {
      setErrors(error.validationErrors ?? {})
      setSubmitError(error.message || '주문 또는 결제 진행 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className={`${isActive ? '' : 'is-hidden'} bg-[#f3f5f8] px-4 py-8 text-slate-800`} id="order-checkout-page">
      <div className="mx-auto grid w-full max-w-[1180px] gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-5">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="m-0 text-[12px] font-black uppercase tracking-[0.08em] text-[#d53232]">Order Checkout</p>
            <h1 className="m-0 mt-2 text-[30px] font-black tracking-[-0.02em] text-slate-950">주문서 작성</h1>
            <p className="m-0 mt-2 text-sm font-semibold text-slate-500">
              {authUser ? '주문 완료 후 내 주문내역에서 바로 확인할 수 있습니다.' : '주문목록에 담긴 품목을 한 번에 주문합니다.'}
            </p>
          </div>

          {normalizedItems.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <p className="m-0 text-sm font-bold text-slate-500">주문목록이 비어 있습니다.</p>
              <button type="button" onClick={onNavigateProducts} className="mt-4 rounded-lg bg-[#d53232] px-4 py-2 text-sm font-black text-white">
                상품 페이지로 이동
              </button>
            </div>
          ) : (
            <form className="grid gap-5" onSubmit={handleSubmit}>
              <section className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="m-0 text-xl font-black text-slate-950">주문 상품</h2>
                <div className="mt-4 grid gap-3">
                  {pricedItems.map((item) => (
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

              <section className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="m-0 text-xl font-black text-slate-950">배송 정보</h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">* 필수 입력</span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    주문자명 *
                    <input value={form.customerName} onChange={(event) => handleChange('customerName', event.target.value)} className="h-11 rounded-xl bg-slate-50 px-3 text-sm outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-[#f0b7bd]" />
                    {errors.customerName ? <span className="text-xs font-bold text-[#b42323]">{errors.customerName}</span> : null}
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    연락처 *
                    <input value={form.phone} onChange={(event) => handleChange('phone', event.target.value)} inputMode="tel" placeholder="010-0000-0000" className="h-11 rounded-xl bg-slate-50 px-3 text-sm outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-[#f0b7bd]" />
                    {errors.phone ? <span className="text-xs font-bold text-[#b42323]">{errors.phone}</span> : null}
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                    이메일 선택
                    <input value={form.email} onChange={(event) => handleChange('email', event.target.value)} type="email" placeholder="name@example.com" className="h-11 rounded-xl bg-slate-50 px-3 text-sm outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-[#f0b7bd]" />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    우편번호 *
                    <input value={form.postalCode} onChange={(event) => handleChange('postalCode', event.target.value)} className="h-11 rounded-xl bg-slate-50 px-3 text-sm outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-[#f0b7bd]" />
                    {errors.postalCode ? <span className="text-xs font-bold text-[#b42323]">{errors.postalCode}</span> : null}
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    주소 *
                    <input value={form.address} onChange={(event) => handleChange('address', event.target.value)} className="h-11 rounded-xl bg-slate-50 px-3 text-sm outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-[#f0b7bd]" />
                    {errors.address ? <span className="text-xs font-bold text-[#b42323]">{errors.address}</span> : null}
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                    상세주소 *
                    <input value={form.detailAddress} onChange={(event) => handleChange('detailAddress', event.target.value)} className="h-11 rounded-xl bg-slate-50 px-3 text-sm outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-[#f0b7bd]" />
                    {errors.detailAddress ? <span className="text-xs font-bold text-[#b42323]">{errors.detailAddress}</span> : null}
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                    배송 요청사항
                    <textarea value={form.deliveryMemo} onChange={(event) => handleChange('deliveryMemo', event.target.value)} rows={4} className="resize-y rounded-xl bg-slate-50 px-3 py-3 text-sm outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-[#f0b7bd]" />
                  </label>
                </div>
              </section>

              {overStockItems.length > 0 ? (
                <p className="m-0 rounded-xl bg-[#fff1f2] px-4 py-3 text-sm font-bold text-[#b42323]">
                  {overStockItems[0].displayModel}은 현재 재고 {Number(overStockItems[0].stockQuantity).toLocaleString('ko-KR')}개까지만 주문할 수 있습니다.
                </p>
              ) : null}
              {submitError ? <p className="m-0 rounded-xl bg-[#fff1f2] px-4 py-3 text-sm font-bold text-[#b42323]">{submitError}</p> : null}

              <button type="submit" disabled={isSubmitting || overStockItems.length > 0} className="h-13 rounded-2xl bg-[#d53232] px-5 py-4 text-base font-black text-white shadow-sm transition hover:bg-[#bd2929] disabled:cursor-not-allowed disabled:bg-slate-300">
                {isSubmitting ? '결제창 준비 중...' : '무통장입금 결제하기'}
              </button>
            </form>
          )}
        </div>

        <aside className="self-start rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="m-0 text-xl font-black text-slate-950">주문 요약</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="font-bold text-slate-500">품목 수</dt>
              <dd className="m-0 font-black text-slate-900">{summary.lineCount.toLocaleString('ko-KR')}개</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-bold text-slate-500">총 수량</dt>
              <dd className="m-0 font-black text-slate-900">{summary.totalQuantity.toLocaleString('ko-KR')}개</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-slate-100 pt-3">
              <dt className="font-black text-slate-900">총 결제금액</dt>
              <dd className="m-0 text-xl font-black text-[#0aa04f]">{formatOrderPrice(orderTotalPrice)}</dd>
            </div>
          </dl>
          <p className="m-0 mt-4 rounded-xl bg-[#fff7e6] px-4 py-3 text-sm font-bold leading-6 text-[#8a5a00]">
            나이스페이 가상계좌를 발급받아 입금합니다. 입금 확인 후 상품 준비가 시작됩니다.
          </p>
        </aside>
      </div>
    </section>
  )
}
