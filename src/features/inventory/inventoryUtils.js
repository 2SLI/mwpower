function normalizeLabel(value = '') {
  const text = typeof value === 'string' ? value : String(value ?? '')
  return text
    .normalize('NFKC')
    .replaceAll('⇄', '/')
    .replaceAll('↔', '/')
    .replaceAll('—', '-')
    .replaceAll('–', '-')
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function normalizeInventoryContext(context = {}) {
  return {
    inventoryByModelKey: context.inventoryByModelKey ?? {},
    optionModelsByBaseKey: context.optionModelsByBaseKey ?? {},
    modelOptionWattageMap: context.modelOptionWattageMap ?? {},
    priceByModelKey: context.priceByModelKey ?? {},
  }
}

export function findModelOptionKey(modelName = '', context = {}) {
  const { modelOptionWattageMap } = normalizeInventoryContext(context)
  let key = normalizeLabel(modelName)
  if (!key) return ''
  if (modelOptionWattageMap[key]) return key

  while (key.includes('-')) {
    key = key.slice(0, key.lastIndexOf('-'))
    if (modelOptionWattageMap[key]) return key
  }

  return ''
}

export function getInventoryRecord(modelName = '', context = {}) {
  const { inventoryByModelKey } = normalizeInventoryContext(context)
  const key = normalizeLabel(modelName)
  if (!key) return null
  return inventoryByModelKey[key] ?? null
}

export function getProductPrice(modelName = '', context = {}) {
  const { priceByModelKey } = normalizeInventoryContext(context)
  const key = normalizeLabel(modelName)
  if (!key) return null
  const price = Number(priceByModelKey[key])
  return Number.isFinite(price) && price > 0 ? price : null
}

export function getInventoryOptionModels(baseModelName = '', context = {}) {
  const { optionModelsByBaseKey } = normalizeInventoryContext(context)
  const baseKey = findModelOptionKey(baseModelName, context) || normalizeLabel(baseModelName)
  if (!baseKey) return []
  return Array.isArray(optionModelsByBaseKey[baseKey]) ? optionModelsByBaseKey[baseKey] : []
}

export function getInventoryQuantity(modelName = '', context = {}) {
  const { optionModelsByBaseKey } = normalizeInventoryContext(context)
  const exact = getInventoryRecord(modelName, context)
  if (exact && Number.isFinite(Number(exact.quantity))) return Number(exact.quantity)

  const baseKey = findModelOptionKey(modelName, context) || normalizeLabel(modelName)
  const optionModels = Array.isArray(optionModelsByBaseKey[baseKey]) ? optionModelsByBaseKey[baseKey] : []
  if (optionModels.length === 0) return null

  return optionModels.reduce((sum, optionModel) => {
    const optionRecord = getInventoryRecord(optionModel, context)
    const quantity = Number(optionRecord?.quantity)
    return Number.isFinite(quantity) ? sum + quantity : sum
  }, 0)
}

export function formatInventoryText(modelName = '', context = {}, { aggregate = true } = {}) {
  const exact = getInventoryRecord(modelName, context)
  if (exact && Number.isFinite(Number(exact.quantity))) return `재고 ${Number(exact.quantity).toLocaleString('ko-KR')}개`

  if (!aggregate) return '재고 미등록'

  const quantity = getInventoryQuantity(modelName, context)
  if (Number.isFinite(quantity)) return `재고 ${quantity.toLocaleString('ko-KR')}개`
  return '재고 미등록'
}

export function formatProductPrice(value) {
  const price = Number(value)
  if (!Number.isFinite(price) || price <= 0) return '별도 안내'
  return `${price.toLocaleString('ko-KR')}원`
}

export function formatProductPriceText(modelName = '', context = {}, { aggregate = true } = {}) {
  const { optionModelsByBaseKey } = normalizeInventoryContext(context)
  const exactPrice = getProductPrice(modelName, context)
  if (exactPrice != null) return formatProductPrice(exactPrice)
  if (!aggregate) return '별도 안내'

  const baseKey = findModelOptionKey(modelName, context) || normalizeLabel(modelName)
  const optionModels = Array.isArray(optionModelsByBaseKey[baseKey]) ? optionModelsByBaseKey[baseKey] : []
  const prices = [...new Set(optionModels.map((model) => getProductPrice(model, context)).filter((price) => price != null))].sort((a, b) => a - b)
  if (prices.length === 0) return '별도 안내'
  if (prices.length === 1) return formatProductPrice(prices[0])
  return `${formatProductPrice(prices[0])} ~ ${formatProductPrice(prices[prices.length - 1])}`
}

export function formatOptionLabelWithInventory(modelName = '', context = {}) {
  const label = String(modelName ?? '').trim()
  if (!label) return ''
  return `${label} - ${formatInventoryText(label, context, { aggregate: false })} - ${formatProductPriceText(label, context, { aggregate: false })}`
}

export function getInventoryTone(modelName = '', context = {}) {
  const quantity = getInventoryQuantity(modelName, context)
  if (!Number.isFinite(quantity)) return 'unknown'
  return quantity > 0 ? 'in-stock' : 'out-of-stock'
}

export function getInventorySortRank(modelName = '', context = {}) {
  const tone = getInventoryTone(modelName, context)
  if (tone === 'in-stock') return 0
  if (tone === 'unknown') return 1
  return 2
}

export function compareModelCardsByInventory(a, b, context = {}) {
  const stockRank = getInventorySortRank(a?.modelName, context) - getInventorySortRank(b?.modelName, context)
  if (stockRank !== 0) return stockRank

  const quantityA = getInventoryQuantity(a?.modelName, context)
  const quantityB = getInventoryQuantity(b?.modelName, context)
  const safeQuantityA = Number.isFinite(quantityA) ? quantityA : -1
  const safeQuantityB = Number.isFinite(quantityB) ? quantityB : -1
  if (safeQuantityA !== safeQuantityB) return safeQuantityB - safeQuantityA

  return String(a?.modelName ?? '').localeCompare(String(b?.modelName ?? ''), undefined, {
    numeric: true,
    sensitivity: 'base',
  })
}

export function compareModelLabelsByInventory(a, b, context = {}) {
  return compareModelCardsByInventory({ modelName: a }, { modelName: b }, context)
}

export function getModelInventoryStats(modelName = '', context = {}) {
  const optionModels = getInventoryOptionModels(modelName, context)
  const targets = optionModels.length > 0 ? optionModels : [modelName]

  return targets.reduce(
    (stats, targetModel) => {
      const quantity = getInventoryQuantity(targetModel, context)
      stats.totalSlots += 1
      if (Number.isFinite(quantity)) {
        stats.knownSlots += 1
        stats.totalQuantity += quantity
        if (quantity > 0) stats.inStockSlots += 1
      }
      return stats
    },
    { totalSlots: 0, knownSlots: 0, inStockSlots: 0, totalQuantity: 0 }
  )
}

export function getLeafRecordInventoryStats(record, context = {}) {
  const modelList = Array.isArray(record?.modelList) ? record.modelList : []
  return modelList.reduce(
    (stats, item) => {
      const next = getModelInventoryStats(item?.modelName, context)
      stats.totalSlots += next.totalSlots
      stats.knownSlots += next.knownSlots
      stats.inStockSlots += next.inStockSlots
      stats.totalQuantity += next.totalQuantity
      return stats
    },
    { totalSlots: 0, knownSlots: 0, inStockSlots: 0, totalQuantity: 0 }
  )
}

export function compareLeafRecordsByInventory(a, b, context = {}) {
  const statsA = getLeafRecordInventoryStats(a, context)
  const statsB = getLeafRecordInventoryStats(b, context)
  const rankA = statsA.inStockSlots > 0 ? 0 : statsA.knownSlots > 0 ? 1 : 2
  const rankB = statsB.inStockSlots > 0 ? 0 : statsB.knownSlots > 0 ? 1 : 2
  if (rankA !== rankB) return rankA - rankB

  const coverageA = statsA.totalSlots > 0 ? statsA.inStockSlots / statsA.totalSlots : 0
  const coverageB = statsB.totalSlots > 0 ? statsB.inStockSlots / statsB.totalSlots : 0
  if (coverageA !== coverageB) return coverageB - coverageA

  if (statsA.inStockSlots !== statsB.inStockSlots) return statsB.inStockSlots - statsA.inStockSlots
  if (statsA.totalQuantity !== statsB.totalQuantity) return statsB.totalQuantity - statsA.totalQuantity

  const major = String(a?.major ?? '').localeCompare(String(b?.major ?? ''), undefined, {
    numeric: true,
    sensitivity: 'base',
  })
  if (major !== 0) return major

  const sub = String(a?.subcategory ?? '').localeCompare(String(b?.subcategory ?? ''), undefined, {
    numeric: true,
    sensitivity: 'base',
  })
  if (sub !== 0) return sub

  return String(a?.leaf ?? '').localeCompare(String(b?.leaf ?? ''), undefined, {
    numeric: true,
    sensitivity: 'base',
  })
}

export function clampRequestedQuantityForModel(modelName = '', quantity = 1, context = {}, normalizeQuantity) {
  const normalizedQuantity =
    typeof normalizeQuantity === 'function'
      ? normalizeQuantity(quantity, 1)
      : Math.min(Math.max(1, Number.parseInt(quantity, 10) || 1), 99999)
  const stockQuantity = getInventoryQuantity(modelName, context)
  if (!Number.isFinite(stockQuantity) || stockQuantity < 1) return normalizedQuantity
  return Math.min(normalizedQuantity, stockQuantity)
}
