import { clampRequestedQuantityForModel, getInventoryQuantity } from '../inventory/inventoryUtils'
import { normalizeLabel } from '../productCatalogService'
import { normalizeRequestedQuoteQuantity } from './productViewUtils'

export class QuoteItemFactory {
  constructor({ inventoryContext, routeContext }) {
    this.inventoryContext = inventoryContext
    this.routeContext = routeContext
  }

  create({
    majorId = '',
    majorName = '',
    subcategory = '',
    leaf = '',
    groupName = '',
    modelName = '',
    optionModel = '',
    asset = null,
    thumbnailUrl = '',
    wattage = '',
    quantity = 1,
  } = {}) {
    const baseModel = String(modelName ?? '').trim()
    const displayModel = String(optionModel ?? '').trim() || baseModel
    if (!baseModel || !displayModel) return null

    const resolvedMajorName = String(majorName ?? '').trim() || String(this.routeContext.activeMajor?.name ?? '').trim()
    const resolvedMajorId =
      String(majorId ?? '').trim() ||
      this.routeContext.majorIdByName[normalizeLabel(resolvedMajorName)] ||
      this.routeContext.activeMajorId ||
      this.routeContext.defaultMajorId

    return {
      majorId: resolvedMajorId,
      majorName: resolvedMajorName,
      subcategory: String(subcategory ?? '').trim() || String(this.routeContext.activeSubcategory ?? '').trim(),
      leaf: String(leaf ?? '').trim() || String(this.routeContext.activeLeaf ?? '').trim(),
      groupName: String(groupName ?? '').trim() || String(this.routeContext.selectedGroupName ?? this.routeContext.activeGroup ?? '').trim(),
      baseModel,
      optionModel: String(optionModel ?? '').trim(),
      displayModel,
      thumbnailUrl: String(asset?.imageUrl ?? '').trim() || String(thumbnailUrl ?? '').trim(),
      wattage: String(wattage ?? '').trim(),
      pdfUrl: String(asset?.pdfUrl ?? '').trim(),
      stockQuantity: getInventoryQuantity(displayModel, this.inventoryContext),
      quantity: clampRequestedQuantityForModel(displayModel, quantity, this.inventoryContext, normalizeRequestedQuoteQuantity),
      note: '',
      addedAt: new Date().toISOString(),
    }
  }
}
