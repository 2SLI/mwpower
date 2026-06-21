export function OrderCustomerForm({ form, errors = {}, onChange }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-xl font-black text-slate-950">배송 정보</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">* 필수 입력</span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <p className="m-0 rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold leading-6 text-slate-700 ring-1 ring-slate-200 sm:col-span-2">
          택배사 안내: 경동 6,000원(영업소 기입) / 로젠 3,000원
        </p>
        <label className="grid gap-1.5 text-sm font-bold text-slate-700">
          주문자명 *
          <input value={form.customerName} onChange={(event) => onChange('customerName', event.target.value)} className="h-11 rounded-xl bg-slate-50 px-3 text-sm outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-[#f0b7bd]" />
          {errors.customerName ? <span className="text-xs font-bold text-[#b42323]">{errors.customerName}</span> : null}
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-700">
          연락처 *
          <input value={form.phone} onChange={(event) => onChange('phone', event.target.value)} inputMode="tel" placeholder="010-0000-0000" className="h-11 rounded-xl bg-slate-50 px-3 text-sm outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-[#f0b7bd]" />
          {errors.phone ? <span className="text-xs font-bold text-[#b42323]">{errors.phone}</span> : null}
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
          이메일 선택
          <input value={form.email} onChange={(event) => onChange('email', event.target.value)} type="email" placeholder="name@example.com" className="h-11 rounded-xl bg-slate-50 px-3 text-sm outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-[#f0b7bd]" />
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
          주소 *
          <input value={form.address} onChange={(event) => onChange('address', event.target.value)} className="h-11 rounded-xl bg-slate-50 px-3 text-sm outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-[#f0b7bd]" />
          {errors.address ? <span className="text-xs font-bold text-[#b42323]">{errors.address}</span> : null}
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
          상세주소 *
          <input value={form.detailAddress} onChange={(event) => onChange('detailAddress', event.target.value)} className="h-11 rounded-xl bg-slate-50 px-3 text-sm outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-[#f0b7bd]" />
          {errors.detailAddress ? <span className="text-xs font-bold text-[#b42323]">{errors.detailAddress}</span> : null}
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
          배송 요청사항
          <textarea value={form.deliveryMemo} onChange={(event) => onChange('deliveryMemo', event.target.value)} rows={4} className="resize-y rounded-xl bg-slate-50 px-3 py-3 text-sm outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-[#f0b7bd]" />
        </label>
      </div>
    </section>
  )
}
