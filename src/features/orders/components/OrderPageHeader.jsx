export function OrderPageHeader({ eyebrow, title, description, tone = 'red' }) {
  const toneClass = tone === 'green' ? 'text-[#0aa04f]' : 'text-[#d53232]'

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className={`m-0 text-[12px] font-black uppercase tracking-[0.08em] ${toneClass}`}>{eyebrow}</p>
      <h1 className="m-0 mt-2 text-[30px] font-black tracking-[-0.02em] text-slate-950">{title}</h1>
      {description ? <p className="m-0 mt-2 text-sm font-semibold text-slate-500">{description}</p> : null}
    </div>
  )
}
