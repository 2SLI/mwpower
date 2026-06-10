import { useState } from 'react'
import { BANK_ACCOUNT, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, findGuestOrder, formatOrderDate, formatOrderPrice, normalizePhoneForOrder } from '../features/orderService'

export function OrderSearchView({ isActive }) {
  const [orderNumber, setOrderNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setOrder(null)
    setError('')

    if (!orderNumber.trim() || !phone.trim()) {
      setError('주문번호와 연락처를 입력해주세요.')
      return
    }

    setIsLoading(true)
    try {
      const result = await findGuestOrder(orderNumber.trim(), phone)
      if (!result) {
        setError('일치하는 주문을 찾을 수 없습니다.')
        return
      }
      setOrder(result)
    } catch {
      setError('주문 조회 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className={`${isActive ? '' : 'is-hidden'} bg-[#f3f5f8] px-4 py-10 text-slate-800`} id="order-search-page">
      <div className="mx-auto grid max-w-[860px] gap-5">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="m-0 text-[12px] font-black uppercase tracking-[0.08em] text-[#d53232]">Order Search</p>
          <h1 className="m-0 mt-2 text-[32px] font-black tracking-[-0.02em] text-slate-950">비회원 주문 조회</h1>
          <p className="m-0 mt-2 text-sm font-bold text-slate-500">주문번호와 연락처로 주문 상태를 확인할 수 있습니다.</p>
        </div>

        <form className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm sm:grid-cols-[1fr_1fr_auto]" onSubmit={handleSubmit}>
          <label className="grid gap-1.5 text-sm font-bold text-slate-700">
            주문번호
            <input value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="20260518-4821" className="h-11 rounded-xl bg-slate-50 px-3 text-sm outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-[#f0b7bd]" />
          </label>
          <label className="grid gap-1.5 text-sm font-bold text-slate-700">
            연락처
            <input value={phone} onChange={(event) => setPhone(normalizePhoneForOrder(event.target.value))} placeholder="010-0000-0000" className="h-11 rounded-xl bg-slate-50 px-3 text-sm outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-[#f0b7bd]" />
          </label>
          <button type="submit" disabled={isLoading} className="self-end rounded-xl bg-[#d53232] px-5 py-3 text-sm font-black text-white disabled:bg-slate-300">
            {isLoading ? '조회 중...' : '조회하기'}
          </button>
        </form>

        {error ? <p className="m-0 rounded-2xl bg-white p-4 text-sm font-bold text-[#b42323] shadow-sm">{error}</p> : null}

        {order ? (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="m-0 text-xl font-black text-slate-950">{order.orderNumber}</h2>
                <p className="m-0 mt-1 text-sm font-bold text-slate-500">{formatOrderDate(order.createdAt, order.createdAtClient || '-')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#fff7e6] px-3 py-1.5 text-sm font-black text-[#8a5a00]">
                  {PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus || '-'}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-black text-slate-700">
                  {ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus || '-'}
                </span>
              </div>
            </div>

            <dl className="mt-5 grid gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="font-bold text-slate-500">상품명</dt>
                <dd className="m-0 text-right font-black text-slate-950">{order.productName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-bold text-slate-500">수량</dt>
                <dd className="m-0 font-black text-slate-950">{Number(order.quantity || 0).toLocaleString('ko-KR')}개</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-bold text-slate-500">금액</dt>
                <dd className="m-0 font-black text-[#0aa04f]">{formatOrderPrice(order.totalPrice)}</dd>
              </div>
              <div className="grid gap-1 border-t border-slate-100 pt-3">
                <dt className="font-bold text-slate-500">입금계좌</dt>
                <dd className="m-0 font-bold leading-6 text-slate-800">
                  {order.nicepay?.vbank || order.paymentVbank
                    ? `${(order.nicepay?.vbank || order.paymentVbank).vbankName} ${(order.nicepay?.vbank || order.paymentVbank).vbankNumber}`
                    : `${BANK_ACCOUNT.bank} ${BANK_ACCOUNT.accountNumber} / ${BANK_ACCOUNT.holder}`}
                </dd>
              </div>
              <div className="grid gap-1 border-t border-slate-100 pt-3">
                <dt className="font-bold text-slate-500">배송정보</dt>
                <dd className="m-0 font-bold leading-6 text-slate-800">
                  [{order.postalCode}] {order.address} {order.detailAddress}
                </dd>
                {order.deliveryMemo ? <dd className="m-0 text-sm font-semibold leading-6 text-slate-500">요청사항: {order.deliveryMemo}</dd> : null}
              </div>
            </dl>
          </section>
        ) : null}
      </div>
    </section>
  )
}
