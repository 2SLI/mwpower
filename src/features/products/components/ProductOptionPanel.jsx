import {
  clampRequestedQuantityForModel,
  formatInventoryText,
  formatOptionLabelWithInventory,
  formatProductPrice,
  formatProductPriceText,
  getInventoryQuantity,
  getInventoryTone,
  getProductPrice,
} from '../../inventory/inventoryUtils'
import { normalizeRequestedQuoteQuantity } from '../productViewUtils'

export function ProductOptionPanel({
  isModelSelected = false,
  isShopSite,
  selectedCombinedOptionModels = [],
  selectedOptionModel,
  selectedModelCard,
  selectedQuoteQuantity,
  inventoryContext,
  routePayload,
  setSelectedOptionModel,
  setSelectedQuoteQuantity,
  markHistoryReplace,
  onStartGuestOrder,
  onAddLineItem,
  onScrollToPdfSection,
}) {
  const combinedDisabled = !isModelSelected || selectedCombinedOptionModels.length === 0
  const canAddSelectedModel = isModelSelected && selectedModelCard
  const requiresOptionSelection = canAddSelectedModel && selectedCombinedOptionModels.length > 0
  const isAddToQuoteDisabled = requiresOptionSelection && !selectedOptionModel
  const inventoryTargetModel = selectedOptionModel || selectedModelCard?.modelName || ''
  const inventoryText = inventoryTargetModel
    ? formatInventoryText(inventoryTargetModel, inventoryContext, { aggregate: !selectedOptionModel })
    : '재고 미등록'
  const priceText = inventoryTargetModel
    ? formatProductPriceText(inventoryTargetModel, inventoryContext, { aggregate: !selectedOptionModel })
    : '별도 안내'
  const exactUnitPrice = getProductPrice(inventoryTargetModel, inventoryContext)
  const orderQuantity = clampRequestedQuantityForModel(inventoryTargetModel, selectedQuoteQuantity, inventoryContext, normalizeRequestedQuoteQuantity)
  const stockLimit = getInventoryQuantity(inventoryTargetModel, inventoryContext)
  const canIncreaseQuantity = !Number.isFinite(stockLimit) || orderQuantity < stockLimit
  const totalPriceText = exactUnitPrice != null ? formatProductPrice(exactUnitPrice * orderQuantity) : priceText
  const inventoryTone = inventoryTargetModel ? getInventoryTone(inventoryTargetModel, inventoryContext) : 'unknown'
  const isOutOfStockForOrder = inventoryTone === 'out-of-stock'
  const isAddToOrderDisabled = isAddToQuoteDisabled || isOutOfStockForOrder
  const inventoryToneClass =
    inventoryTone === 'in-stock'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : inventoryTone === 'out-of-stock'
        ? 'border-slate-200 bg-slate-100 text-slate-500'
        : 'border-amber-200 bg-amber-50 text-amber-700'

  const selectedDisplayModel = selectedOptionModel || (requiresOptionSelection ? '옵션 모델을 선택해주세요' : selectedModelCard?.modelName)
  const addPayload = {
    ...routePayload,
    modelName: selectedModelCard?.modelName,
    optionModel: selectedOptionModel,
    asset: selectedModelCard?.asset,
    quantity: orderQuantity,
  }

  return (
    <aside className="self-start rounded-xl bg-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="m-0 text-[11px] font-bold uppercase tracking-[0.08em] text-[#d53232]">{isShopSite ? 'Purchase' : 'Quote'}</p>
          <p className="m-0 mt-1 text-[20px] font-bold text-slate-950">{isShopSite ? '구매 정보' : '견적 요청'}</p>
        </div>
        {canAddSelectedModel ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="inline-flex h-7 items-center justify-center rounded-full bg-[#d53232] px-3 text-[11px] font-bold uppercase tracking-[0.04em] text-white transition hover:bg-[#bd2929] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              onClick={onScrollToPdfSection}
              disabled={!selectedModelCard?.asset?.pdfUrl}
              aria-label="PDF 섹션으로 이동"
            >
              PDF
            </button>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700">{orderQuantity} EA</span>
          </div>
        ) : null}
      </div>

      <p className="m-0 mt-2 text-[12px] font-semibold leading-5 text-slate-500">
        {isShopSite ? '옵션과 수량을 선택한 뒤 바로 주문하거나 목록에 담을 수 있습니다.' : '옵션과 수량을 선택한 뒤 견적목록에 담아 문의할 수 있습니다.'}
      </p>

      <div className="mt-4 grid gap-3">
        <label className="grid gap-1.5">
          <span className="text-[13px] font-bold text-slate-800">추가 옵션</span>
          <select
            className="h-14 rounded-lg border border-slate-200 bg-white px-4 text-[15px] font-semibold text-slate-800 outline-none transition focus:border-[#d53232] focus:shadow-[0_0_0_3px_#f8d8dc] disabled:bg-slate-100 disabled:text-slate-400"
            value={selectedOptionModel}
            onChange={(event) => {
              markHistoryReplace?.()
              setSelectedOptionModel(String(event.target.value ?? ''))
            }}
            disabled={combinedDisabled}
          >
            <option value="">{!isModelSelected ? '모델 선택' : selectedCombinedOptionModels.length > 0 ? '옵션 모델 선택' : '데이터 없음'}</option>
            {selectedCombinedOptionModels.map((value) => (
              <option key={value} value={value}>
                {isShopSite ? formatOptionLabelWithInventory(value, inventoryContext) : value}
              </option>
            ))}
          </select>
        </label>

        {canAddSelectedModel ? (
          <SelectedModelActions
            isShopSite={isShopSite}
            selectedDisplayModel={selectedDisplayModel}
            isAddToQuoteDisabled={isAddToQuoteDisabled}
            isOutOfStockForOrder={isOutOfStockForOrder}
            isAddToOrderDisabled={isAddToOrderDisabled}
            inventoryToneClass={inventoryToneClass}
            inventoryText={inventoryText}
            priceText={priceText}
            orderQuantity={orderQuantity}
            stockLimit={stockLimit}
            totalPriceText={totalPriceText}
            canIncreaseQuantity={canIncreaseQuantity}
            inventoryTargetModel={inventoryTargetModel}
            inventoryContext={inventoryContext}
            setSelectedQuoteQuantity={setSelectedQuoteQuantity}
            onStartGuestOrder={() => onStartGuestOrder?.(selectedOptionModel || selectedModelCard.modelName, orderQuantity)}
            onAddOrder={() => onAddLineItem?.(addPayload, 'order')}
            onAddQuote={() => onAddLineItem?.(addPayload, 'quote')}
            onScrollToPdfSection={onScrollToPdfSection}
            hasPdf={Boolean(selectedModelCard?.asset?.pdfUrl)}
          />
        ) : (
          <div className="rounded-[20px] border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-center text-[13px] font-semibold leading-5 text-slate-500">
            모델 상세를 선택하면 목록 담기 설정이 활성화됩니다.
          </div>
        )}
      </div>
    </aside>
  )
}

function SelectedModelActions(props) {
  return (
    <>
      <QuantityControl {...props} />
      {props.isShopSite ? <ShopSelectionSummary {...props} /> : <QuoteSelectionSummary {...props} />}
      {props.isShopSite ? <ShopButtons {...props} /> : null}
      <PdfAndQuoteButtons {...props} />
    </>
  )
}

function QuantityControl({ orderQuantity, stockLimit, canIncreaseQuantity, inventoryTargetModel, inventoryContext, setSelectedQuoteQuantity }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[13px] font-bold text-slate-800">수량</span>
      <div className="grid w-[170px] grid-cols-[44px_minmax(0,1fr)_44px] items-center rounded-lg border border-slate-200 bg-white">
        <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-l-lg border-r border-slate-200 text-lg font-bold text-slate-500 transition hover:bg-slate-50" onClick={() => setSelectedQuoteQuantity((prev) => Math.max(1, clampRequestedQuantityForModel(inventoryTargetModel, prev, inventoryContext, normalizeRequestedQuoteQuantity) - 1))} aria-label="수량 감소">-</button>
        <input type="number" min="1" inputMode="numeric" max={Number.isFinite(stockLimit) ? stockLimit : undefined} value={orderQuantity} onChange={(event) => setSelectedQuoteQuantity(clampRequestedQuantityForModel(inventoryTargetModel, event.target.value, inventoryContext, normalizeRequestedQuoteQuantity))} className="h-11 min-w-0 border-0 bg-transparent px-2 text-center text-[16px] font-bold text-slate-900 outline-none" />
        <button type="button" disabled={!canIncreaseQuantity} className="inline-flex h-11 w-11 items-center justify-center rounded-r-lg border-l border-slate-200 text-lg font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300" onClick={() => setSelectedQuoteQuantity((prev) => clampRequestedQuantityForModel(inventoryTargetModel, normalizeRequestedQuoteQuantity(prev, 1) + 1, inventoryContext, normalizeRequestedQuoteQuantity))} aria-label="수량 증가">+</button>
      </div>
    </label>
  )
}

function ShopSelectionSummary({ selectedDisplayModel, isAddToQuoteDisabled, isOutOfStockForOrder, inventoryToneClass, inventoryText, priceText, orderQuantity, stockLimit, totalPriceText }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50">
      <div className="p-4">
        <p className="m-0 break-all text-[15px] font-bold leading-6 text-slate-900">{selectedDisplayModel}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${inventoryToneClass}`}>{inventoryText}</span>
          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">{priceText}</span>
        </div>
        <p className={`m-0 mt-2 text-[12px] font-semibold ${isAddToQuoteDisabled ? 'text-[#b4262e]' : 'text-slate-500'}`}>
          {isAddToQuoteDisabled ? '옵션 모델을 선택해야 목록에 담을 수 있습니다.' : isOutOfStockForOrder ? '재고가 없는 품목은 주문목록에 담을 수 없고 견적목록으로 문의할 수 있습니다.' : `${orderQuantity}개 기준으로 선택한 목록에 추가됩니다.`}
        </p>
        {Number.isFinite(stockLimit) ? <p className="m-0 mt-1 text-[12px] font-semibold text-slate-500">최대 주문 가능 수량: {stockLimit.toLocaleString('ko-KR')}개</p> : null}
      </div>
      <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-4">
        <span className="text-sm font-bold text-slate-900">총 {orderQuantity.toLocaleString('ko-KR')}개</span>
        <span className="text-sm font-bold text-slate-500">총 금액 <strong className="ml-2 text-[20px] font-extrabold text-[#d6001c]">{totalPriceText}</strong></span>
      </div>
    </div>
  )
}

function QuoteSelectionSummary({ selectedDisplayModel, isAddToQuoteDisabled, orderQuantity }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="m-0 break-all text-[15px] font-bold leading-6 text-slate-900">{selectedDisplayModel}</p>
      <p className={`m-0 mt-2 text-[12px] font-semibold ${isAddToQuoteDisabled ? 'text-[#b4262e]' : 'text-slate-500'}`}>
        {isAddToQuoteDisabled ? '옵션 모델을 선택해야 견적목록에 담을 수 있습니다.' : `${orderQuantity}개 기준으로 견적목록에 추가됩니다.`}
      </p>
    </div>
  )
}

function ShopButtons({ isAddToOrderDisabled, onStartGuestOrder, onAddOrder }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <button type="button" disabled={isAddToOrderDisabled} className={`inline-flex h-[52px] w-full items-center justify-center rounded-xl px-4 text-[15px] font-bold text-white transition ${isAddToOrderDisabled ? 'cursor-not-allowed bg-slate-300 text-slate-100' : 'bg-[#d53232] hover:bg-[#bd2929]'}`} onClick={onStartGuestOrder}>구매하기</button>
      <button type="button" disabled={isAddToOrderDisabled} className={`inline-flex h-[52px] w-full items-center justify-center rounded-xl border px-4 text-[15px] font-bold transition ${isAddToOrderDisabled ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300' : 'border-slate-300 bg-white text-slate-900 hover:border-[#d53232] hover:text-[#d53232]'}`} onClick={onAddOrder}>장바구니</button>
    </div>
  )
}

function PdfAndQuoteButtons({ isShopSite, isAddToQuoteDisabled, hasPdf, onAddQuote, onScrollToPdfSection }) {
  return (
    <div className={`grid gap-2 ${isShopSite ? '' : 'sm:grid-cols-2'}`}>
      {!isShopSite ? <button type="button" disabled={isAddToQuoteDisabled} className={`inline-flex h-11 w-full items-center justify-center rounded-xl border px-4 text-sm font-bold transition ${isAddToQuoteDisabled ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300' : 'border-transparent bg-slate-100 text-slate-800 hover:bg-rose-50 hover:text-[#d53232]'}`} onClick={onAddQuote}>견적목록에 담기</button> : null}
      <button type="button" className={`inline-flex h-11 w-full items-center justify-center rounded-xl border px-4 text-sm font-bold transition ${!hasPdf ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300' : 'border-[#d53232] bg-[#d53232] text-white shadow-[0_10px_20px_rgba(213,50,50,0.16)] hover:border-[#bd2929] hover:bg-[#bd2929]'}`} onClick={onScrollToPdfSection} disabled={!hasPdf}>PDF 보기</button>
    </div>
  )
}
