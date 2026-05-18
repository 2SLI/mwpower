import { useEffect, useState } from 'react'
import { BANK_ACCOUNT, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, formatOrderDate, formatOrderPrice, getOrderByOrderNumber } from '../features/orderService'

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
        <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
          <p className="m-0 text-[12px] font-black uppercase tracking-[0.08em] text-[#0aa04f]">Order Complete</p>
          <h1 className="m-0 mt-2 text-[32px] font-black tracking-[-0.02em] text-slate-950">주문이 접수되었습니다</h1>
          <p className="m-0 mt-2 text-sm font-bold text-slate-500">입금 확인 후 상품 준비가 시작됩니다.</p>
        </div>

        {isLoading ? <p className="m-0 rounded-2xl bg-white p-5 text-center text-sm font-bold text-slate-500 shadow-sm">주문 정보를 불러오는 중입니다...</p> : null}
        {error ? <p className="m-0 rounded-2xl bg-white p-5 text-center text-sm font-bold text-[#b42323] shadow-sm">{error}</p> : null}

        {order ? (
          <>
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
              <h2 className="m-0 text-xl font-black text-slate-950">입금 계좌 정보</h2>
              <div className="mt-4 rounded-2xl bg-[#f8fafc] p-4">
                <p className="m-0 text-sm font-bold text-slate-500">은행: {BANK_ACCOUNT.bank}</p>
                <p className="m-0 mt-1 text-[26px] font-black text-slate-950">{BANK_ACCOUNT.accountNumber}</p>
                <p className="m-0 mt-1 text-sm font-bold text-slate-500">예금주: {BANK_ACCOUNT.holder}</p>
              </div>
              <p className="m-0 mt-4 rounded-xl bg-[#fff7e6] px-4 py-3 text-sm font-bold leading-6 text-[#8a5a00]">입금 확인 후 상품 준비가 시작됩니다.</p>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="m-0 text-xl font-black text-slate-950">상태</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#fff7e6] px-3 py-1.5 text-sm font-black text-[#8a5a00]">
                  {PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus || '-'}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-black text-slate-700">
                  {ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus || '-'}
                </span>
              </div>
            </section>

            <button type="button" onClick={onNavigateOrderSearch} className="h-12 rounded-2xl bg-slate-900 px-4 text-sm font-black text-white">
              주문조회하기
            </button>
          </>
        ) : null}
      </div>
    </section>
  )
}
