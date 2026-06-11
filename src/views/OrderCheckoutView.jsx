import { useEffect, useMemo, useState } from 'react'
import { createGuestOrderFromItems, normalizePhoneForOrder, resolveProductForOrder, validateOrderPayload } from '../features/orderService'
import { OrderCustomerForm } from '../features/orders/components/OrderCustomerForm'
import { OrderEmptyState } from '../features/orders/components/OrderEmptyState'
import { MultiOrderItemSummary } from '../features/orders/components/OrderItemSummary'
import { OrderPageHeader } from '../features/orders/components/OrderPageHeader'
import { OrderSummaryCard } from '../features/orders/components/OrderSummaryCard'
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
    if (!authUser?.uid) {
      setSubmitError('로그인 후 주문할 수 있습니다.')
      return
    }

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
      onClearItems?.()
      onOrderComplete?.(order.orderNumber)
    } catch (error) {
      setErrors(error.validationErrors ?? {})
      setSubmitError(error.message || '주문 접수 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className={`${isActive ? '' : 'is-hidden'} bg-[#f3f5f8] px-4 py-8 text-slate-800`} id="order-checkout-page">
      <div className="mx-auto grid w-full max-w-[1180px] gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-5">
          <OrderPageHeader
            eyebrow="Order Checkout"
            title="주문서 작성"
            description={authUser ? '주문 완료 후 내 주문내역에서 바로 확인할 수 있습니다.' : '로그인 후 주문할 수 있습니다.'}
          />

          {normalizedItems.length === 0 ? (
            <OrderEmptyState message="주문목록이 비어 있습니다." onAction={onNavigateProducts} />
          ) : (
            <form className="grid gap-5" onSubmit={handleSubmit}>
              <MultiOrderItemSummary items={pricedItems} />

              <OrderCustomerForm form={form} errors={errors} onChange={handleChange} />

              {overStockItems.length > 0 ? (
                <p className="m-0 rounded-xl bg-[#fff1f2] px-4 py-3 text-sm font-bold text-[#b42323]">
                  {overStockItems[0].displayModel}은 현재 재고 {Number(overStockItems[0].stockQuantity).toLocaleString('ko-KR')}개까지만 주문할 수 있습니다.
                </p>
              ) : null}
              {submitError ? <p className="m-0 rounded-xl bg-[#fff1f2] px-4 py-3 text-sm font-bold text-[#b42323]">{submitError}</p> : null}

              <button type="submit" disabled={isSubmitting || overStockItems.length > 0} className="h-13 rounded-2xl bg-[#d53232] px-5 py-4 text-base font-black text-white shadow-sm transition hover:bg-[#bd2929] disabled:cursor-not-allowed disabled:bg-slate-300">
                {isSubmitting ? '주문 접수 중...' : '무통장입금 주문하기'}
              </button>
            </form>
          )}
        </div>

        <OrderSummaryCard
          title="주문 요약"
          rows={[
            { label: '품목 수', value: `${summary.lineCount.toLocaleString('ko-KR')}개` },
            { label: '총 수량', value: `${summary.totalQuantity.toLocaleString('ko-KR')}개` },
          ]}
          totalPrice={orderTotalPrice}
        />
      </div>
    </section>
  )
}
