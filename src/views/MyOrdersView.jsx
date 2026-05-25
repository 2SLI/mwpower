import { useEffect, useState } from 'react'
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, formatOrderDate, formatOrderPrice, loadUserOrders } from '../features/orderService'

export function MyOrdersView({ isActive, authUser = null, onNavigateLogin, onNavigateOrderSearch }) {
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const refreshOrders = async () => {
    if (!authUser?.uid) return
    setIsLoading(true)
    setError('')
    try {
      setOrders(await loadUserOrders(authUser.uid))
    } catch {
      setOrders([])
      setError('주문내역을 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isActive) return
    if (!authUser?.uid) {
      setOrders([])
      return
    }
    refreshOrders()
  }, [isActive, authUser?.uid])

  return (
    <section className={`${isActive ? '' : 'is-hidden'} bg-[#f3f5f8] px-4 py-10 text-slate-800`} id="my-orders-page">
      <div className="mx-auto grid max-w-[960px] gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-3xl bg-white p-6 shadow-sm">
          <div>
            <p className="m-0 text-[12px] font-black uppercase tracking-[0.08em] text-[#d53232]">My Orders</p>
            <h1 className="m-0 mt-2 text-[32px] font-black tracking-[-0.02em] text-slate-950">내 주문내역</h1>
            <p className="m-0 mt-2 text-sm font-bold text-slate-500">로그인 후 주문한 내역을 주문번호 입력 없이 확인합니다.</p>
          </div>
          {authUser ? (
            <button type="button" onClick={refreshOrders} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-200">
              새로고침
            </button>
          ) : null}
        </div>

        {!authUser ? (
          <div className="grid gap-3 rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="m-0 text-sm font-bold text-slate-500">로그인이 필요합니다.</p>
            <button type="button" onClick={onNavigateLogin} className="mx-auto h-12 rounded-xl bg-[#d53232] px-6 text-sm font-black text-white">
              로그인하러 가기
            </button>
            <button type="button" onClick={onNavigateOrderSearch} className="mx-auto text-sm font-black text-slate-500 underline">
              비회원 주문 조회
            </button>
          </div>
        ) : (
          <>
            {isLoading ? <p className="m-0 rounded-2xl bg-white p-4 text-sm font-bold text-slate-500 shadow-sm">주문내역을 불러오는 중입니다...</p> : null}
            {error ? <p className="m-0 rounded-2xl bg-white p-4 text-sm font-bold text-[#b42323] shadow-sm">{error}</p> : null}

            {orders.length === 0 && !isLoading ? (
              <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
                <p className="m-0 text-sm font-bold text-slate-500">아직 로그인 계정으로 주문한 내역이 없습니다.</p>
                <button type="button" onClick={onNavigateOrderSearch} className="mt-4 text-sm font-black text-slate-500 underline">
                  기존 비회원 주문 조회하기
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                {orders.map((order) => (
                  <article key={order.id || order.orderNumber} className="rounded-2xl bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="m-0 text-xl font-black text-slate-950">{order.orderNumber || order.id}</h2>
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
                        <dd className="m-0 text-right font-black text-slate-950">{order.productName || '-'}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="font-bold text-slate-500">수량</dt>
                        <dd className="m-0 font-black text-slate-950">{Number(order.quantity || 0).toLocaleString('ko-KR')}개</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="font-bold text-slate-500">금액</dt>
                        <dd className="m-0 font-black text-[#0aa04f]">{formatOrderPrice(order.totalPrice)}</dd>
                      </div>
                      {order.nicepay?.vbank || order.paymentVbank ? (
                        <div className="grid gap-1 border-t border-slate-100 pt-3">
                          <dt className="font-bold text-slate-500">입금계좌</dt>
                          <dd className="m-0 font-bold leading-6 text-slate-800">
                            {(order.nicepay?.vbank || order.paymentVbank).vbankName} {(order.nicepay?.vbank || order.paymentVbank).vbankNumber}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
