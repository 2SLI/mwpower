import { getInventoryTone } from '../../inventory/inventoryUtils'
import { QuoteItemFactory } from '../QuoteItemFactory'

export function useProductOrderActions({
  isShopSite,
  inventoryContext,
  routeContext,
  selectedModelCard,
  selectedOptionModel,
  selectedQuoteQuantity,
  onAddOrderItem,
  onAddQuoteItem,
  onStartGuestOrder,
  onOpenStoreProductPreset: openStoreProductPreset,
  setQuoteFeedback,
  setSelectedQuoteQuantity,
}) {
  const onAddLineItem = (payload, target = 'order') => {
    const factory = new QuoteItemFactory({ inventoryContext, routeContext })
    const nextItem = factory.create(payload)
    if (!nextItem) return
    if (target === 'order' && getInventoryTone(nextItem.optionModel || nextItem.displayModel || nextItem.baseModel, inventoryContext) === 'out-of-stock') {
      setQuoteFeedback(`${nextItem.displayModel}은 현재 재고가 없어 주문목록에 담을 수 없습니다. 견적목록으로 문의해주세요.`)
      return
    }
    if (target === 'quote' || !isShopSite) {
      onAddQuoteItem?.(nextItem)
      setQuoteFeedback(`${nextItem.displayModel} ${nextItem.quantity}개가 견적목록에 추가되었습니다.`)
    } else {
      onAddOrderItem?.(nextItem)
      setQuoteFeedback(`${nextItem.displayModel} ${nextItem.quantity}개가 주문목록에 추가되었습니다.`)
    }
    setSelectedQuoteQuantity(1)
  }

  const onOpenStoreProductPreset = () => openStoreProductPreset?.({
    majorId: routeContext.activeMajorId,
    subcategory: routeContext.activeSubcategory,
    leaf: routeContext.activeLeaf,
    groupName: routeContext.selectedGroupName ?? routeContext.activeGroup,
    model: selectedModelCard?.modelName,
    optionModel: selectedOptionModel,
  })

  return {
    onAddLineItem,
    onStartGuestOrder,
    onOpenStoreProductPreset,
    selectedQuoteQuantity,
  }
}
