export function OrderEmptyState({ message, actionLabel = '상품 페이지로 이동', onAction }) {
  return (
    <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
      <p className="m-0 text-sm font-bold text-slate-500">{message}</p>
      <button type="button" onClick={onAction} className="mt-4 rounded-lg bg-[#d53232] px-4 py-2 text-sm font-black text-white">
        {actionLabel}
      </button>
    </div>
  )
}
