import { normalizeLabel } from '../productCatalogService'

export function withPdfViewerParams(url = '', { mobile = false } = {}) {
  const text = String(url ?? '').trim()
  if (!text) return ''

  const [base, hash = ''] = text.split('#')
  const params = new URLSearchParams(hash)
  if (!params.has('page')) params.set('page', '1')
  params.set('zoom', mobile ? 'page-width' : 'page-fit')

  return `${base}#${params.toString()}`
}

export function decodeAssetUrl(url = '') {
  const text = String(url ?? '').trim()
  if (!text) return ''
  try {
    return decodeURIComponent(text)
  } catch {
    return text
  }
}

export function hasPdfAsset(asset) {
  return String(asset?.pdfUrl ?? '').trim().length > 0
}

export function getSingleSearchToken(value = '') {
  const tokens = String(value ?? '')
    .split(/[,\uFF0C]/)
    .map((token) => String(token ?? '').trim())
    .filter(Boolean)

  return tokens.length === 1 ? tokens[0] : ''
}

export function buildSearchKeywords(value = '') {
  const normalizedTokens = String(value ?? '')
    .split(/[,\uFF0C]/)
    .map((token) => normalizeLabel(token))
    .filter(Boolean)

  const seen = new Set()
  const keywords = []

  normalizedTokens.forEach((token) => {
    if (!seen.has(token)) {
      seen.add(token)
      keywords.push(token)
    }

    let current = token
    while ((current.match(/-/g) ?? []).length > 1) {
      current = current.slice(0, current.lastIndexOf('-'))
      if (!current || seen.has(current)) continue
      seen.add(current)
      keywords.push(current)
    }
  })

  return keywords
}

export function normalizeRoutePathname(pathname = '/') {
  const raw = String(pathname ?? '/').trim().toLowerCase()
  if (!raw || raw === '/') return '/'
  return raw.replace(/\/+$/g, '') || '/'
}

export function isProductsRoutePath(pathname = '/') {
  const normalized = normalizeRoutePathname(pathname)
  return normalized === '/products' || normalized === '/store/products'
}

export function normalizeHistoryTextValue(value) {
  const text = String(value ?? '').trim()
  return text || null
}

export function normalizeRequestedQuoteQuantity(value, fallback = 1) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.min(parsed, 99999)
}

export class ProductHistoryState {
  static normalize(state) {
    if (!state || typeof state !== 'object') return null

    const snapshot = {}
    const search = normalizeHistoryTextValue(state.search)
    const majorId = normalizeHistoryTextValue(state.majorId)
    const subcategory = normalizeHistoryTextValue(state.subcategory)
    const leaf = normalizeHistoryTextValue(state.leaf)
    const groupName = normalizeHistoryTextValue(state.groupName)
    const model = normalizeHistoryTextValue(state.model)
    const optionModel = normalizeHistoryTextValue(state.optionModel)

    if (search) snapshot.search = search
    if (majorId) snapshot.majorId = majorId
    if (subcategory) snapshot.subcategory = subcategory
    if (leaf) snapshot.leaf = leaf
    if (groupName) snapshot.groupName = groupName
    if (model) snapshot.model = model
    if (optionModel) snapshot.optionModel = optionModel

    return Object.keys(snapshot).length > 0 ? snapshot : null
  }

  static serialize(state) {
    return JSON.stringify(ProductHistoryState.normalize(state) ?? null)
  }

  constructor({ majorCategories = [], defaultMajorId = '' } = {}) {
    this.majorCategories = majorCategories
    this.defaultMajorId = defaultMajorId
  }

  resolve(rawState = null) {
    const source = rawState && typeof rawState === 'object' ? rawState : {}
    const requestedMajorId = String(source.majorId ?? source.activeMajorId ?? '').trim()
    const majorId =
      requestedMajorId && this.majorCategories.some((item) => item.id === requestedMajorId)
        ? requestedMajorId
        : requestedMajorId || this.defaultMajorId

    return {
      majorId,
      subcategory: normalizeHistoryTextValue(source.subcategory ?? source.activeSubcategory),
      leaf: normalizeHistoryTextValue(source.leaf ?? source.activeLeaf),
      groupName: normalizeHistoryTextValue(source.groupName ?? source.activeGroup),
      model: normalizeHistoryTextValue(source.model ?? source.activeModel),
      optionModel: String(source.optionModel ?? source.selectedOptionModel ?? '').trim(),
      search: String(source.search ?? '').trim(),
    }
  }

  buildSnapshot(rawState = null) {
    const resolved = this.resolve(rawState)
    const snapshot = {}
    const hasSelection = Boolean(resolved.subcategory || resolved.leaf || resolved.groupName || resolved.model)

    if (resolved.search) snapshot.search = resolved.search
    if (resolved.majorId && (resolved.majorId !== this.defaultMajorId || resolved.search || hasSelection)) snapshot.majorId = resolved.majorId
    if (resolved.subcategory) snapshot.subcategory = resolved.subcategory
    if (resolved.leaf) snapshot.leaf = resolved.leaf
    if (resolved.groupName) snapshot.groupName = resolved.groupName
    if (resolved.model) snapshot.model = resolved.model
    if (resolved.model && resolved.optionModel) snapshot.optionModel = resolved.optionModel

    return Object.keys(snapshot).length > 0 ? snapshot : null
  }
}
