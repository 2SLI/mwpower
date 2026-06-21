import { useMemo } from 'react'
import { compareModelLabelsByInventory, findModelOptionKey, getInventoryOptionModels } from '../../inventory/inventoryUtils'
import { buildCombinedOptionModelLabels, collectUniqueOptionValues } from '../../productOptions/productOptionUtils'
import { normalizeLabel } from '../../productCatalogService'
import { decodeAssetUrl } from '../productViewUtils'

export function useProductSelection({ activeModel, inventoryContext, mobilePdfViewportWidth, modelCards }) {
  const selectedModelCard = useMemo(
    () => modelCards.find((item) => normalizeLabel(item.modelName) === normalizeLabel(activeModel)) ?? null,
    [modelCards, activeModel]
  )
  const selectedModelOptions = useMemo(() => {
    const optionKey = findModelOptionKey(selectedModelCard?.modelName, inventoryContext)
    if (!optionKey) return []
    const options = Array.isArray(inventoryContext.modelOptionWattageMap[optionKey]) ? inventoryContext.modelOptionWattageMap[optionKey] : []
    return options.filter((item) => String(item?.model ?? '').trim())
  }, [selectedModelCard?.modelName, inventoryContext])
  const selectedCombinedOptionModels = useMemo(() => {
    const labels = buildCombinedOptionModelLabels({ options: selectedModelOptions, selectedModel: selectedModelCard?.modelName })
    const inventoryLabels = getInventoryOptionModels(selectedModelCard?.modelName, inventoryContext)
    return collectUniqueOptionValues([...labels, ...inventoryLabels]).sort((a, b) => compareModelLabelsByInventory(a, b, inventoryContext))
  }, [selectedModelOptions, selectedModelCard?.modelName, inventoryContext])
  const selectedPdfUrl = useMemo(() => decodeAssetUrl(selectedModelCard?.asset?.pdfUrl), [selectedModelCard?.asset?.pdfUrl])
  const mobilePdfPageWidth = useMemo(() => {
    const width = mobilePdfViewportWidth - 16
    if (!Number.isFinite(width) || width <= 0) return null
    return Math.max(260, width)
  }, [mobilePdfViewportWidth])

  return {
    selectedModelCard,
    selectedModelOptions,
    selectedCombinedOptionModels,
    selectedPdfUrl,
    mobilePdfPageWidth,
  }
}
