import { BANK_ACCOUNT } from '../../orderService'

export function BankAccountBox({ variant = 'compact' }) {
  if (variant === 'large') {
    return (
      <div className="mt-4 rounded-2xl bg-[#f8fafc] p-4">
        <p className="m-0 text-sm font-bold text-slate-500">은행: {BANK_ACCOUNT.bank}</p>
        <p className="m-0 mt-1 text-[26px] font-black text-slate-950">{BANK_ACCOUNT.accountNumber}</p>
        <p className="m-0 mt-1 text-sm font-bold text-slate-500">예금주: {BANK_ACCOUNT.holder}</p>
      </div>
    )
  }

  return (
    <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
      <p className="m-0 text-xs font-black text-slate-500">입금계좌</p>
      <p className="m-0 mt-1 text-sm font-black text-slate-950">{BANK_ACCOUNT.bank} {BANK_ACCOUNT.accountNumber}</p>
      <p className="m-0 mt-1 text-xs font-bold text-slate-500">예금주: {BANK_ACCOUNT.holder}</p>
    </div>
  )
}
