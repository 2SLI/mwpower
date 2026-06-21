import { useEffect, useState } from 'react'
import { formatOrderDate, formatOrderPrice, getOrderByOrderNumber } from '../features/orderService'
import { OrderPageHeader } from '../features/orders/components/OrderPageHeader'
import { OrderPaymentGuide } from '../features/orders/components/OrderPaymentGuide'
import { OrderStatusBadges } from '../features/orders/components/OrderStatusBadges'

export function OrderCompleteView({ isActive, orderNumber, onNavigateOrderSearch }) {
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isActive || !orderNumber) return
    setIsLoading(true)
    setError('')
    getOrderByOrderNumber(orderNumber)
      .then((result) => {
        setOrder(result)
        if (!result) setError('주문 정보를 찾을 수 없습니다.')
      })
      .catch(() => setError('주문 정보를 불러오지 못했습니다.'))
      .finally(() => setIsLoading(false))
  }, [isActive, orderNumber])

  return (
    <section className={`${isActive ? '' : 'is-hidden'} bg-[#f3f5f8] px-4 py-10 text-slate-800`} id="order-complete-page">
      <div className="mx-auto grid max-w-[780px] gap-5">
        <div className="text-center">
          <OrderPageHeader eyebrow="Order Complete" title="주문이 접수되었습니다" description="입금 확인 후 상품 준비가 시작됩니다." tone="green" />
        </div>

        {isLoading ? <p className="m-0 rounded-2xl bg-white p-5 text-center text-sm font-bold text-slate-500 shadow-sm">주문 정보를 불러오는 중입니다...</p> : null}
        {error ? <p className="m-0 rounded-2xl bg-white p-5 text-center text-sm font-bold text-[#b42323] shadow-sm">{error}</p> : null}

        {order ? (
          <>
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="m-0 text-xl font-black text-slate-950">입금 계좌 정보</h2>
              <OrderPaymentGuide accountVariant="large">주문번호와 주문자명으로 입금해주세요. 입금 확인 후 상품 준비가 시작됩니다.</OrderPaymentGuide>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="m-0 text-xl font-black text-slate-950">주문 정보</h2>
              <dl className="mt-4 grid gap-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="font-bold text-slate-500">주문번호</dt>
                  <dd className="m-0 font-black text-slate-950">{order.orderNumber}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-bold text-slate-500">주문일</dt>
                  <dd className="m-0 text-right font-bold text-slate-700">{formatOrderDate(order.createdAt, order.createdAtClient || '-')}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-bold text-slate-500">상품명</dt>
                  <dd className="m-0 text-right font-black text-slate-950">{order.productName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-bold text-slate-500">수량</dt>
                  <dd className="m-0 font-black text-slate-950">{Number(order.quantity || 0).toLocaleString('ko-KR')}개</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-slate-100 pt-3">
                  <dt className="font-black text-slate-950">총 결제금액</dt>
                  <dd className="m-0 text-xl font-black text-[#0aa04f]">{formatOrderPrice(order.totalPrice)}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="m-0 text-xl font-black text-slate-950">상태</h2>
              <OrderStatusBadges paymentStatus={order.paymentStatus} orderStatus={order.orderStatus} />
            </section>

            <button type="button" onClick={onNavigateOrderSearch} className="h-12 rounded-2xl bg-slate-900 px-4 text-sm font-black text-white">
              마이페이지 보기
            </button>
          </>
        ) : null}
      </div>
    </section>
  )
}
