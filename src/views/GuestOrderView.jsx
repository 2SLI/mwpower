import { useEffect, useMemo, useState } from 'react'
import { createGuestOrder, formatOrderPrice, normalizePhoneForOrder, resolveProductForOrder, validateOrderPayload } from '../features/orderService'
import { requestNicepayVbankPayment } from '../features/nicepayService'

const INITIAL_FORM = {
  customerName: '',
  phone: '',
  email: '',
  postalCode: '',
  address: '',
  detailAddress: '',
  deliveryMemo: '',
  quantity: 1,
}

function normalizeField(value = '') {
  return String(value ?? '').trim()
}

export function GuestOrderView({ isActive, productId, initialQuantity = 1, authUser = null, onNavigateProducts, onOrderComplete }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const product = useMemo(() => {
    try {
      return resolveProductForOrder(productId)
    } catch {
      return null
    }
  }, [productId])

  const quantity = Math.max(1, Math.floor(Number(form.quantity) || 1))
  const stockLimit = Number.isFinite(Number(product?.stockQuantity)) ? Math.max(0, Number(product.stockQuantity)) : null
  const canIncreaseQuantity = stockLimit == null || quantity < stockLimit
  const totalPrice = product ? product.productPrice * quantity : 0
  const normalizedInitialQuantity = Math.max(
    1,
    Math.min(stockLimit == null || stockLimit < 1 ? 1 : stockLimit, Math.floor(Number(initialQuantity) || 1))
  )

  useEffect(() => {
    if (!isActive) return
    setForm({
      ...INITIAL_FORM,
      customerName: authUser?.displayName || '',
      email: authUser?.email || '',
      quantity: normalizedInitialQuantity,
    })
    setErrors({})
    setSubmitError('')
  }, [isActive, productId, normalizedInitialQuantity, authUser?.uid])

  const handleChange = (key, value) => {
    const nextValue =
      key === 'phone'
        ? normalizePhoneForOrder(value)
        : key === 'quantity'
          ? Math.max(1, Math.min(stockLimit == null || stockLimit < 1 ? 99999 : stockLimit, Math.floor(Number(value) || 1)))
          : value
    setForm((prev) => ({ ...prev, [key]: nextValue }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }))
    if (submitError) setSubmitError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!product || isSubmitting) return

    const payload = {
      ...form,
      productId: product.productId,
      quantity,
      stockQuantity: product.stockQuantity,
      userId: authUser?.uid || '',
      userEmail: authUser?.email || '',
      userDisplayName: authUser?.displayName || form.customerName,
    }
    const validationErrors = validateOrderPayload(payload)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const order = await createGuestOrder(payload)
      await requestNicepayVbankPayment(order)
    } catch (error) {
      setErrors(error.validationErrors ?? {})
      setSubmitError(error.message || '주문 또는 결제 진행 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className={`${isActive ? '' : 'is-hidden'} bg-[#f3f5f8] px-4 py-8 text-slate-800`} id="guest-order-page">
      <div className="mx-auto grid w-full max-w-[1180px] gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-5">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="m-0 text-[12px] font-black uppercase tracking-[0.08em] text-[#d53232]">Guest Order</p>
            <h1 className="m-0 mt-2 text-[30px] font-black tracking-[-0.02em] text-slate-950">{authUser ? '회원 주문서' : '비회원 주문서'}</h1>
            <p className="m-0 mt-2 text-sm font-semibold text-slate-500">
              {authUser ? '주문 완료 후 내 주문내역에서 바로 확인할 수 있습니다.' : '로그인 없이도 주문할 수 있지만, 주문번호와 연락처로만 조회할 수 있습니다.'}
            </p>
          </div>

          {!product ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <p className="m-0 text-sm font-bold text-slate-500">상품 정보를 찾을 수 없습니다.</p>
              <button type="button" onClick={onNavigateProducts} className="mt-4 rounded-lg bg-[#d53232] px-4 py-2 text-sm font-black text-white">
                상품 페이지로 이동
              </button>
            </div>
          ) : (
            <form className="grid gap-5" onSubmit={handleSubmit}>
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

              <section className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="m-0 text-xl font-black text-slate-950">수량</h2>
                <div className="mt-4 flex max-w-[260px] items-center gap-2 rounded-xl bg-slate-50 p-1 ring-1 ring-slate-200">
                  <button type="button" onClick={() => handleChange('quantity', Math.max(1, quantity - 1))} className="h-10 w-10 rounded-lg bg-white text-lg font-black text-slate-700 shadow-sm">
                    -
                  </button>
                  <input value={form.quantity} min="1" max={stockLimit ?? undefined} onChange={(event) => handleChange('quantity', event.target.value.replace(/[^\d]/g, ''))} inputMode="numeric" className="h-10 min-w-0 flex-1 bg-transparent text-center text-lg font-black text-slate-900 outline-none" />
                  <button type="button" disabled={!canIncreaseQuantity} onClick={() => handleChange('quantity', quantity + 1)} className="h-10 w-10 rounded-lg bg-white text-lg font-black text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:text-slate-300">
                    +
                  </button>
                </div>
                {stockLimit != null ? <p className="m-0 mt-2 text-xs font-bold text-slate-500">최대 주문 가능 수량: {stockLimit.toLocaleString('ko-KR')}개</p> : null}
                {errors.quantity ? <p className="m-0 mt-2 text-xs font-bold text-[#b42323]">{errors.quantity}</p> : null}
              </section>

              {submitError ? <p className="m-0 rounded-xl bg-[#fff1f2] px-4 py-3 text-sm font-bold text-[#b42323]">{submitError}</p> : null}

              <button type="submit" disabled={!product.inStock || isSubmitting} className="h-13 rounded-2xl bg-[#d53232] px-5 py-4 text-base font-black text-white shadow-sm transition hover:bg-[#bd2929] disabled:cursor-not-allowed disabled:bg-slate-300">
                {isSubmitting ? '결제창 준비 중...' : '무통장입금 결제하기'}
              </button>
            </form>
          )}
        </div>

        {product ? (
          <aside className="self-start rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="m-0 text-xl font-black text-slate-950">결제 요약</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="font-bold text-slate-500">상품명</dt>
                <dd className="m-0 text-right font-black text-slate-900">{product.productName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-bold text-slate-500">수량</dt>
                <dd className="m-0 font-black text-slate-900">{quantity.toLocaleString('ko-KR')}개</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-slate-100 pt-3">
                <dt className="font-black text-slate-900">총 결제금액</dt>
                <dd className="m-0 text-xl font-black text-[#0aa04f]">{formatOrderPrice(totalPrice)}</dd>
              </div>
            </dl>
            <p className="m-0 mt-4 rounded-xl bg-[#fff7e6] px-4 py-3 text-sm font-bold leading-6 text-[#8a5a00]">
              나이스페이 가상계좌를 발급받아 입금합니다. 입금 확인 후 상품 준비가 시작됩니다.
            </p>
          </aside>
        ) : null}
      </div>
    </section>
  )
}
