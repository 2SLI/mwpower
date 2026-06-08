import { formatInventoryText, formatProductPriceText, getInventoryTone } from '../../inventory/inventoryUtils'
import { normalizeLabel } from '../../productCatalogService'
import { hasPdfAsset } from '../productViewUtils'

export function ModelActionList({
  items = [],
  activeModel,
  isShopSite,
  inventoryContext,
  onSelectModel,
}) {
  if (items.length === 0) {
    return <p className="m-0 text-[14px] text-slate-500">등록된 모델이 없습니다.</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isCurrentModel = normalizeLabel(item.modelName) === normalizeLabel(activeModel)
        const inventoryTone = getInventoryTone(item.modelName, inventoryContext)
        const inventoryClass =
          inventoryTone === 'in-stock'
            ? isCurrentModel
              ? 'text-white'
              : 'text-emerald-700'
            : inventoryTone === 'out-of-stock'
              ? isCurrentModel
                ? 'text-white/75'
                : 'text-slate-400'
              : isCurrentModel
                ? 'text-white/75'
                : 'text-amber-700'

        return (
          <button
            key={item.modelName}
            type="button"
            className={`inline-flex min-h-9 max-w-full appearance-none items-center gap-1.5 rounded-full border px-3 py-1.5 text-left text-[13px] font-bold leading-5 shadow-none transition ${
              isCurrentModel
                ? 'border-[#c9252f] bg-[#c9252f] text-white'
                : 'border-slate-300 bg-white text-slate-800 hover:border-[#c9252f] hover:bg-[#fff5f6] hover:text-[#c9252f]'
            }`}
            onClick={() => onSelectModel?.(item)}
          >
            <span className="truncate">{item.modelName}</span>
            {isShopSite ? (
              <>
                <span className={`shrink-0 text-[10px] font-bold ${inventoryClass}`}>
                  {formatInventoryText(item.modelName, inventoryContext)}
                </span>
                <span className={`shrink-0 text-[10px] font-bold ${isCurrentModel ? 'text-white/85' : 'text-emerald-700'}`}>
                  {formatProductPriceText(item.modelName, inventoryContext)}
                </span>
              </>
            ) : null}
            {isCurrentModel ? <span className="shrink-0 text-[10px] font-bold opacity-90">선택</span> : null}
            {!hasPdfAsset(item.asset) ? <span className={`shrink-0 text-[10px] font-bold ${isCurrentModel ? 'text-white/80' : 'text-slate-400'}`}>PDF 준비중</span> : null}
          </button>
        )
      })}
    </div>
  )
}
