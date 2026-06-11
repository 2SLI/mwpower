import { formatOrderPrice } from '../../orderService'
import { OrderPaymentGuide } from './OrderPaymentGuide'

export function OrderSummaryCard({ title = '결제 요약', rows, totalPrice, showPaymentGuide = true }) {
  return (
    <aside className="self-start rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="m-0 text-xl font-black text-slate-950">{title}</h2>
      <dl className="mt-4 grid gap-3 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-4">
            <dt className="font-bold text-slate-500">{row.label}</dt>
            <dd className={`m-0 ${row.valueClassName || 'font-black text-slate-900'}`}>{row.value}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-4 border-t border-slate-100 pt-3">
          <dt className="font-black text-slate-900">총 결제금액</dt>
          <dd className="m-0 text-xl font-black text-[#0aa04f]">{formatOrderPrice(totalPrice)}</dd>
        </div>
      </dl>
      {showPaymentGuide ? <OrderPaymentGuide /> : null}
    </aside>
  )
}
