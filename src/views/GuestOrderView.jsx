import { useEffect, useMemo, useState } from 'react'
import { createGuestOrder, normalizePhoneForOrder, resolveProductForOrder, validateOrderPayload } from '../features/orderService'
import { OrderCustomerForm } from '../features/orders/components/OrderCustomerForm'
import { OrderEmptyState } from '../features/orders/components/OrderEmptyState'
import { SingleOrderItemSummary } from '../features/orders/components/OrderItemSummary'
import { OrderPageHeader } from '../features/orders/components/OrderPageHeader'
import { OrderSummaryCard } from '../features/orders/components/OrderSummaryCard'

const INITIAL_FORM = {
  customerName: '',
  phone: '',
  email: '',
  address: '',
  detailAddress: '',
  deliveryMemo: '',
  quantity: 1,
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
    if (!authUser?.uid) {
      setSubmitError('로그인 후 주문할 수 있습니다.')
      return
    }

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
      onOrderComplete?.(order.orderNumber)
    } catch (error) {
      setErrors(error.validationErrors ?? {})
      setSubmitError(error.message || '주문 접수 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className={`${isActive ? '' : 'is-hidden'} bg-[#f3f5f8] px-4 py-8 text-slate-800`} id="guest-order-page">
      <div className="mx-auto grid w-full max-w-[1180px] gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-5">
          <OrderPageHeader
            eyebrow="Member Order"
            title="회원 주문서"
            description={authUser ? '주문 완료 후 마이페이지에서 바로 확인할 수 있습니다.' : '로그인 후 주문할 수 있습니다.'}
          />

          {!product ? (
            <OrderEmptyState message="상품 정보를 찾을 수 없습니다." onAction={onNavigateProducts} />
          ) : (
            <form className="grid gap-5" onSubmit={handleSubmit}>
              <SingleOrderItemSummary product={product} />

              <OrderCustomerForm form={form} errors={errors} onChange={handleChange} />

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
                {isSubmitting ? '주문 접수 중...' : '무통장입금 주문하기'}
              </button>
            </form>
          )}
        </div>

        {product ? (
          <OrderSummaryCard
            rows={[
              { label: '상품명', value: product.productName, valueClassName: 'text-right font-black text-slate-900' },
              { label: '수량', value: `${quantity.toLocaleString('ko-KR')}개` },
            ]}
            totalPrice={totalPrice}
          />
        ) : null}
      </div>
    </section>
  )
}
