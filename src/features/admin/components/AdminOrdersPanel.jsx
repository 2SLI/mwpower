import { useEffect, useMemo, useState } from 'react'
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, formatOrderDate, formatOrderPrice, loadAdminOrders, markOrderPaid, saveOrderAdminMemo, syncNicepayPayment } from '../../orderService'

function getAdminOrderNumberFromPath(pathname = '') {
  const text = String(pathname ?? '').trim()
  const prefix = '/admin/orders/'
  if (!text.startsWith(prefix)) return ''
  const raw = text.slice(prefix.length).split('/')[0] ?? ''
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

function getNicepayPayment(order = {}) {
  return order?.nicepay || {}
}

function getNicepayPaymentLabel(order = {}) {
  const status = getNicepayPayment(order).status || ''
  if (status === 'paid') return 'Nicepay 입금완료'
  if (status === 'ready') return 'Nicepay 입금대기'
  if (status === 'failed') return 'Nicepay 실패'
  if (status === 'cancelled' || status === 'partialCancelled') return 'Nicepay 취소'
  if (status === 'expired') return 'Nicepay 만료'
  return 'Nicepay 미조회'
}

function getNicepayStatusClass(order = {}) {
  const status = getNicepayPayment(order).status || ''
  if (status === 'paid') return 'bg-[#e9f9ef] text-[#087a3d]'
  if (status === 'ready') return 'bg-[#fff7e6] text-[#8a5a00]'
  if (status === 'failed' || status === 'cancelled' || status === 'partialCancelled' || status === 'expired') return 'bg-[#fff1f2] text-[#b42323]'
  return 'bg-slate-100 text-slate-600'
}

function getNicepayVbank(order = {}) {
  return getNicepayPayment(order).vbank || order.paymentVbank || null
}

function formatDateTime(value, fallback = '-') {
  if (!value) return fallback
  try {
    if (typeof value?.toDate === 'function') return value.toDate().toLocaleString('ko-KR')
    if (typeof value === 'string') {
      const date = new Date(value)
      if (!Number.isNaN(date.getTime())) return date.toLocaleString('ko-KR')
    }
  } catch {
    return fallback
  }
  return fallback
}

export function AdminOrdersPanel({ pathname }) {
  const [orders, setOrders] = useState([])
  const [activeOrderNumber, setActiveOrderNumber] = useState(() => getAdminOrderNumberFromPath(pathname))
  const [adminMemoDraft, setAdminMemoDraft] = useState('')
  const [syncingOrderNumber, setSyncingOrderNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const activeOrder = useMemo(
    () => orders.find((item) => item.orderNumber === activeOrderNumber || item.id === activeOrderNumber) ?? orders[0] ?? null,
    [activeOrderNumber, orders]
  )

  const refreshOrders = async () => {
    setIsLoading(true)
    setError('')
    try {
      const items = await loadAdminOrders()
      setOrders(items)
      const pathOrderNumber = getAdminOrderNumberFromPath(pathname)
      setActiveOrderNumber((prev) => {
        if (pathOrderNumber && items.some((item) => item.orderNumber === pathOrderNumber || item.id === pathOrderNumber)) return pathOrderNumber
        if (items.some((item) => item.orderNumber === prev || item.id === prev)) return prev
        return items[0]?.orderNumber ?? items[0]?.id ?? ''
      })
    } catch {
      setOrders([])
      setActiveOrderNumber('')
      setError('주문 목록을 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshOrders()
  }, [])

  useEffect(() => {
    const pathOrderNumber = getAdminOrderNumberFromPath(pathname)
    if (pathOrderNumber) setActiveOrderNumber(pathOrderNumber)
  }, [pathname])

  useEffect(() => {
    setAdminMemoDraft(activeOrder?.adminMemo ?? '')
  }, [activeOrder?.id, activeOrder?.adminMemo])

  const handleSelectOrder = (order) => {
    const orderNumber = order?.orderNumber || order?.id
    if (!orderNumber) return
    setActiveOrderNumber(orderNumber)
    if (typeof window !== 'undefined') {
      window.history.pushState({ view: 'admin-orders', orderNumber }, '', `/admin/orders/${encodeURIComponent(orderNumber)}`)
    }
  }

  const handleConfirmPaid = async (order) => {
    const orderNumber = order?.orderNumber || order?.id
    if (!orderNumber) return
    const confirmed = window.confirm(`${orderNumber} 주문을 입금확인 처리하시겠습니까?`)
    if (!confirmed) return

    try {
      await markOrderPaid(orderNumber)
      setNotice('입금확인 처리했습니다.')
      await refreshOrders()
    } catch {
      setError('입금확인 처리에 실패했습니다.')
    }
  }

  const handleSyncNicepay = async (order) => {
    const orderNumber = order?.orderNumber || order?.id
    if (!orderNumber) return

    setSyncingOrderNumber(orderNumber)
    setError('')
    setNotice('')
    try {
      const result = await syncNicepayPayment(orderNumber)
      const label = result?.status === 'paid' ? '입금완료' : getNicepayPaymentLabel({ nicepay: { status: result?.status } })
      setNotice(`${orderNumber} 주문의 Nicepay 상태를 확인했습니다. (${label})`)
      await refreshOrders()
    } catch (syncError) {
      setError(syncError.message || 'Nicepay 입금 상태 확인에 실패했습니다.')
    } finally {
      setSyncingOrderNumber('')
    }
  }

  const handleSaveMemo = async () => {
    const orderNumber = activeOrder?.orderNumber || activeOrder?.id
    if (!orderNumber) return
    try {
      await saveOrderAdminMemo(orderNumber, adminMemoDraft)
      setNotice('관리자 메모를 저장했습니다.')
      await refreshOrders()
    } catch {
      setError('관리자 메모 저장에 실패했습니다.')
    }
  }

  return (
    <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="m-0 text-xl font-black text-slate-900">주문 목록</h2>
          <p className="m-0 mt-1 text-sm font-semibold text-slate-500">비회원 무통장입금 주문을 확인하고 입금 상태를 처리합니다.</p>
        </div>
        <button type="button" onClick={refreshOrders} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200">
          새로고침
        </button>
      </div>

      {isLoading ? <p className="m-0 text-sm font-semibold text-slate-500">주문 데이터를 불러오는 중입니다...</p> : null}
      {error ? <p className="m-0 rounded-lg bg-[#fff1f2] px-3 py-2 text-sm font-semibold text-[#b42323]">{error}</p> : null}
      {notice ? <p className="m-0 rounded-lg bg-[#effaf3] px-3 py-2 text-sm font-semibold text-[#087a3d]">{notice}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.04em] text-slate-500">
            <tr>
              <th className="px-3 py-3">주문번호</th>
              <th className="px-3 py-3">주문일</th>
              <th className="px-3 py-3">주문자명</th>
              <th className="px-3 py-3">연락처</th>
              <th className="px-3 py-3">상품명</th>
              <th className="px-3 py-3">수량</th>
              <th className="px-3 py-3">총 금액</th>
              <th className="px-3 py-3">결제상태</th>
              <th className="px-3 py-3">Nicepay</th>
              <th className="px-3 py-3">주문상태</th>
              <th className="px-3 py-3">관리</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-3 py-8 text-center text-sm font-semibold text-slate-500">
                  표시할 주문이 없습니다.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const orderNumber = order.orderNumber || order.id
                const nicepay = getNicepayPayment(order)
                const isSyncing = syncingOrderNumber === orderNumber
                return (
                  <tr key={order.id || orderNumber} className="border-t border-slate-100 align-top">
                    <td className="px-3 py-3 font-black text-slate-900">{orderNumber}</td>
                    <td className="px-3 py-3 text-slate-600">{formatOrderDate(order.createdAt, order.createdAtClient || '-')}</td>
                    <td className="px-3 py-3 font-bold text-slate-800">{order.customerName || '-'}</td>
                    <td className="px-3 py-3 text-slate-600">{order.phone || '-'}</td>
                    <td className="px-3 py-3 font-bold text-slate-800">{order.productName || '-'}</td>
                    <td className="px-3 py-3 font-bold text-slate-800">{Number(order.quantity || 0).toLocaleString('ko-KR')}</td>
                    <td className="px-3 py-3 font-black text-[#0aa04f]">{formatOrderPrice(order.totalPrice)}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-[#fff7e6] px-2.5 py-1 text-xs font-black text-[#8a5a00]">
                        {PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="grid gap-1">
                        <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-black ${getNicepayStatusClass(order)}`}>
                          {getNicepayPaymentLabel(order)}
                        </span>
                        {nicepay.tid ? <span className="text-[11px] font-semibold text-slate-400">TID: {nicepay.tid}</span> : null}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">
                        {ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => handleSelectOrder(order)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-200">
                          상세
                        </button>
                        {nicepay.tid ? (
                          <button
                            type="button"
                            onClick={() => handleSyncNicepay(order)}
                            disabled={isSyncing}
                            className="rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            {isSyncing ? '확인중' : 'Nicepay 확인'}
                          </button>
                        ) : null}
                        {order.paymentStatus === 'waiting' ? (
                          <button type="button" onClick={() => handleConfirmPaid(order)} className="rounded-lg bg-[#d53232] px-3 py-1.5 text-xs font-black text-white hover:bg-[#bd2929]">
                            입금확인
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-slate-200 p-4">
        {!activeOrder ? (
          <p className="m-0 text-sm font-semibold text-slate-500">상세 확인할 주문을 선택해주세요.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="m-0 text-[11px] font-black uppercase tracking-[0.08em] text-[#d53232]">Order Detail</p>
                  <h3 className="m-0 mt-1 text-2xl font-black text-slate-950">{activeOrder.orderNumber || activeOrder.id}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getNicepayPayment(activeOrder).tid ? (
                    <button
                      type="button"
                      onClick={() => handleSyncNicepay(activeOrder)}
                      disabled={syncingOrderNumber === (activeOrder.orderNumber || activeOrder.id)}
                      className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {syncingOrderNumber === (activeOrder.orderNumber || activeOrder.id) ? 'Nicepay 확인중' : 'Nicepay 입금상태 확인'}
                    </button>
                  ) : null}
                  {activeOrder.paymentStatus === 'waiting' ? (
                    <button type="button" onClick={() => handleConfirmPaid(activeOrder)} className="rounded-lg bg-[#d53232] px-4 py-2 text-sm font-black text-white hover:bg-[#bd2929]">
                      수동 입금확인
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-2 rounded-xl bg-slate-50 p-3 text-sm">
                <p className="m-0"><strong>주문자:</strong> {activeOrder.customerName || '-'}</p>
                <p className="m-0"><strong>연락처:</strong> {activeOrder.phone || '-'}</p>
                <p className="m-0"><strong>이메일:</strong> {activeOrder.email || '-'}</p>
                <p className="m-0"><strong>상품명:</strong> {activeOrder.productName || '-'}</p>
                <p className="m-0"><strong>수량:</strong> {Number(activeOrder.quantity || 0).toLocaleString('ko-KR')}개</p>
                <p className="m-0"><strong>총 금액:</strong> {formatOrderPrice(activeOrder.totalPrice)}</p>
                <p className="m-0"><strong>입금일:</strong> {formatOrderDate(activeOrder.paidAt, '-')}</p>
              </div>

              <div className="grid gap-2 rounded-xl bg-slate-50 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="m-0 font-black text-slate-800">Nicepay 결제 정보</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black ${getNicepayStatusClass(activeOrder)}`}>
                    {getNicepayPaymentLabel(activeOrder)}
                  </span>
                </div>
                <p className="m-0"><strong>거래번호:</strong> {getNicepayPayment(activeOrder).tid || '-'}</p>
                <p className="m-0"><strong>결제수단:</strong> {getNicepayPayment(activeOrder).payMethod === 'vbank' ? '가상계좌' : getNicepayPayment(activeOrder).payMethod || '-'}</p>
                <p className="m-0"><strong>Nicepay 상태:</strong> {getNicepayPayment(activeOrder).status || '-'}</p>
                <p className="m-0"><strong>마지막 조회:</strong> {formatDateTime(getNicepayPayment(activeOrder).lastSyncedAt, '-')}</p>
                {getNicepayVbank(activeOrder) ? (
                  <div className="mt-1 rounded-lg bg-white p-3 ring-1 ring-slate-200">
                    <p className="m-0 font-black text-slate-800">가상계좌</p>
                    <p className="m-0 mt-1"><strong>은행:</strong> {getNicepayVbank(activeOrder).vbankName || '-'}</p>
                    <p className="m-0"><strong>계좌번호:</strong> {getNicepayVbank(activeOrder).vbankNumber || '-'}</p>
                    <p className="m-0"><strong>예금주:</strong> {getNicepayVbank(activeOrder).vbankHolder || '-'}</p>
                    <p className="m-0"><strong>입금기한:</strong> {formatDateTime(getNicepayVbank(activeOrder).vbankExpDate, '-')}</p>
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-sm leading-6">
                <p className="m-0 font-black text-slate-800">배송 정보</p>
                <p className="m-0 mt-1">[{activeOrder.postalCode || '-'}] {activeOrder.address || '-'} {activeOrder.detailAddress || ''}</p>
                <p className="m-0 mt-1 text-slate-500">요청사항: {activeOrder.deliveryMemo || '-'}</p>
              </div>
            </div>

            <div className="grid content-start gap-3">
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                관리자 메모
                <textarea
                  value={adminMemoDraft}
                  onChange={(event) => setAdminMemoDraft(event.target.value)}
                  rows={9}
                  className="resize-y rounded-xl bg-slate-50 px-3 py-3 text-sm outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-[#f0b7bd]"
                  placeholder="주문 처리 메모"
                />
              </label>
              <button type="button" onClick={handleSaveMemo} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800">
                메모 저장
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
