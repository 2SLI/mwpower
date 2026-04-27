import { resolveLeafThumbnailUrl } from './productCatalogService'

const QUOTE_CART_STORAGE_KEY = 'mwpower_quote_cart_v1'

function normalizeText(value = '') {
  return String(value ?? '').trim()
}

function normalizeKey(value = '') {
  return normalizeText(value).toLowerCase()
}

function normalizeQuantity(value, fallback = 1) {
  const nextValue = Number.parseInt(value, 10)
  if (!Number.isFinite(nextValue) || nextValue <= 0) return fallback
  return Math.min(nextValue, 99999)
}

export function buildQuoteItemId(item = {}) {
  return [
    item.majorId,
    item.majorName,
    item.subcategory,
    item.leaf,
    item.groupName,
    item.baseModel ?? item.model,
    item.optionModel,
  ]
    .map((value) => normalizeKey(value) || '-')
    .join('::')
}

export function normalizeQuoteLineItem(item = {}) {
  const majorId = normalizeText(item.majorId)
  const majorName = normalizeText(item.majorName)
  const subcategory = normalizeText(item.subcategory)
  const leaf = normalizeText(item.leaf)
  const groupName = normalizeText(item.groupName)
  const baseModel = normalizeText(item.baseModel ?? item.model)
  const optionModel = normalizeText(item.optionModel)
  const displayModel = normalizeText(item.displayModel) || optionModel || baseModel
  const thumbnailUrl =
    normalizeText(item.thumbnailUrl) ||
    resolveLeafThumbnailUrl({
      majorName,
      subcategoryName: subcategory,
      leafName: leaf,
    })

  if (!baseModel || !displayModel) return null

  return {
    id: buildQuoteItemId({ majorId, majorName, subcategory, leaf, groupName, baseModel, optionModel }),
    majorId,
    majorName,
    subcategory,
    leaf,
    groupName,
    baseModel,
    optionModel,
    displayModel,
    thumbnailUrl,
    wattage: normalizeText(item.wattage),
    pdfUrl: normalizeText(item.pdfUrl),
    note: normalizeText(item.note),
    quantity: normalizeQuantity(item.quantity, 1),
    addedAt: normalizeText(item.addedAt) || new Date().toISOString(),
  }
}

export function normalizeQuoteItems(items = []) {
  if (!Array.isArray(items)) return []
  return items.map((item) => normalizeQuoteLineItem(item)).filter(Boolean)
}

export function addQuoteItem(items = [], nextItem = null) {
  const normalizedItems = normalizeQuoteItems(items)
  const normalizedNextItem = normalizeQuoteLineItem(nextItem)
  if (!normalizedNextItem) return normalizedItems

  const existingIndex = normalizedItems.findIndex((item) => item.id === normalizedNextItem.id)
  if (existingIndex < 0) return [normalizedNextItem, ...normalizedItems]

  return normalizedItems.map((item, index) =>
    index === existingIndex
      ? {
          ...item,
          quantity: normalizeQuantity(item.quantity, 1) + normalizeQuantity(normalizedNextItem.quantity, 1),
          note: item.note || normalizedNextItem.note,
          addedAt: normalizedNextItem.addedAt || item.addedAt,
          thumbnailUrl: item.thumbnailUrl || normalizedNextItem.thumbnailUrl,
          wattage: item.wattage || normalizedNextItem.wattage,
          pdfUrl: item.pdfUrl || normalizedNextItem.pdfUrl,
        }
      : item
  )
}

export function updateQuoteItemQuantity(items = [], itemId = '', quantity = 1) {
  const normalizedItemId = normalizeText(itemId)
  if (!normalizedItemId) return normalizeQuoteItems(items)

  return normalizeQuoteItems(items).map((item) =>
    item.id === normalizedItemId
      ? {
          ...item,
          quantity: normalizeQuantity(quantity, item.quantity),
        }
      : item
  )
}

export function updateQuoteItemNote(items = [], itemId = '', note = '') {
  const normalizedItemId = normalizeText(itemId)
  if (!normalizedItemId) return normalizeQuoteItems(items)

  return normalizeQuoteItems(items).map((item) =>
    item.id === normalizedItemId
      ? {
          ...item,
          note: normalizeText(note),
        }
      : item
  )
}

export function removeQuoteItem(items = [], itemId = '') {
  const normalizedItemId = normalizeText(itemId)
  if (!normalizedItemId) return normalizeQuoteItems(items)
  return normalizeQuoteItems(items).filter((item) => item.id !== normalizedItemId)
}

export function clearQuoteItems() {
  return []
}

export function readStoredQuoteItems() {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(QUOTE_CART_STORAGE_KEY)
    if (!raw) return []
    return normalizeQuoteItems(JSON.parse(raw))
  } catch {
    return []
  }
}

export function writeStoredQuoteItems(items = []) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(QUOTE_CART_STORAGE_KEY, JSON.stringify(normalizeQuoteItems(items)))
  } catch {
    // Ignore localStorage failures so the UI can continue functioning.
  }
}

export function getQuoteItemSummary(items = []) {
  const normalizedItems = normalizeQuoteItems(items)

  return normalizedItems.reduce(
    (summary, item) => {
      summary.lineCount += 1
      summary.totalQuantity += normalizeQuantity(item.quantity, 1)
      return summary
    },
    { lineCount: 0, totalQuantity: 0 }
  )
}

export function formatQuoteItemPath(item = {}) {
  return [item.majorName, item.subcategory, item.leaf, item.groupName].map((value) => normalizeText(value)).filter(Boolean).join(' / ')
}
