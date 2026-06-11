import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '../../orderService'

export function OrderStatusBadges({ paymentStatus, orderStatus }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <span className="rounded-full bg-[#fff7e6] px-3 py-1.5 text-sm font-black text-[#8a5a00]">
        {PAYMENT_STATUS_LABELS[paymentStatus] || paymentStatus || '-'}
      </span>
      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-black text-slate-700">
        {ORDER_STATUS_LABELS[orderStatus] || orderStatus || '-'}
      </span>
    </div>
  )
}
