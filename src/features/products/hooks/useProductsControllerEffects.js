import { useEffect } from 'react'
import { defaultMajorCategories } from '../../../data/defaultMajorCategories'
import { findMatchingLabel, loadLeafModelTreeMap, loadMajorCategories, normalizeLabel } from '../../productCatalogService'
import { lockBodyScroll } from '../../../utils/bodyScrollLock'
import { ProductHistoryState, isProductsRoutePath } from '../productViewUtils'

export function useLoadCatalog({ setMajorCategories, setLeafTreeMap, setActiveMajorId }) {
  useEffect(() => {
    let alive = true
    ;(async () => {
      const [majorResult, treeResult] = await Promise.all([loadMajorCategories(), loadLeafModelTreeMap()])
      if (!alive) return
      const categories = majorResult.categories.length > 0 ? majorResult.categories : defaultMajorCategories
      setMajorCategories(categories)
      setLeafTreeMap(treeResult.treeMap)
      setActiveMajorId((prev) => (categories.some((item) => item.id === prev) ? prev : categories[0]?.id ?? ''))
    })()
    return () => { alive = false }
  }, [setMajorCategories, setLeafTreeMap, setActiveMajorId])
}

export function useViewportAndPanelEffects({ categoryCrumbRef, panelState, closePanels, isMobileViewport, setIsMobileViewport }) {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const query = window.matchMedia('(max-width: 640px)')
    const sync = () => setIsMobileViewport(query.matches)
    sync()
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', sync)
      return () => query.removeEventListener('change', sync)
    }
    query.addListener(sync)
    return () => query.removeListener(sync)
  }, [setIsMobileViewport])
  useEffect(() => {
    const handleClickOutside = (event) => categoryCrumbRef.current && !categoryCrumbRef.current.contains(event.target) && closePanels()
    const handleEscape = (event) => event.key === 'Escape' && closePanels()
    document.addEventListener('pointerdown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [categoryCrumbRef, closePanels])
  useEffect(() => {
    if (!(isMobileViewport && (panelState.major || panelState.sub || panelState.leaf || panelState.model))) return undefined
    return lockBodyScroll()
  }, [isMobileViewport, panelState])
}

export function useRouteEffects(params) {
  useEffect(() => {
    const shouldInitialize = params.isActive && (!params.wasActiveRef.current || !params.historySyncReadyRef.current)
    if (!shouldInitialize) {
      params.wasActiveRef.current = params.isActive
      return
    }
    const presetAt = params.externalPresetRequest?.at ?? null
    if (presetAt != null && presetAt !== params.lastAppliedPresetAtRef.current) {
      params.historyActionRef.current = 'replace'
      params.closePanels()
      params.historySyncReadyRef.current = true
      params.wasActiveRef.current = params.isActive
      return
    }
    const historyProductState = typeof window !== 'undefined' && isProductsRoutePath(window.location.pathname) ? ProductHistoryState.normalize(window.history.state?.productState) : null
    params.applyProductRouteState(historyProductState, { history: 'replace' })
    params.historySyncReadyRef.current = true
    params.wasActiveRef.current = params.isActive
  }, [params.isActive, params.externalPresetRequest, params.defaultMajorId, params.majorCategories])
  useEffect(() => {
    const externalKeyword = String(params.externalSearchRequest?.keyword ?? '').trim()
    if (!externalKeyword) return
    params.markHistoryReplace()
    params.setSearch(externalKeyword)
  }, [params.externalSearchRequest])
  useEffect(() => {
    const majorId = String(params.externalPresetRequest?.majorId ?? '').trim()
    if (!majorId) return
    params.applyProductRouteState({
      majorId,
      subcategory: String(params.externalPresetRequest?.subcategory ?? '').trim() || null,
      leaf: String(params.externalPresetRequest?.leaf ?? '').trim() || String(params.externalPresetRequest?.subcategory ?? '').trim() || null,
      groupName: String(params.externalPresetRequest?.groupName ?? '').trim() || null,
      model: String(params.externalPresetRequest?.model ?? '').trim() || null,
      optionModel: String(params.externalPresetRequest?.optionModel ?? '').trim(),
      search: '',
    }, { history: 'replace' })
    params.lastAppliedPresetAtRef.current = params.externalPresetRequest?.at ?? null
  }, [params.externalPresetRequest, params.defaultMajorId, params.majorCategories])
  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const syncFromHistory = () => {
      if (!isProductsRoutePath(window.location.pathname)) return
      params.historySyncReadyRef.current = true
      params.applyProductRouteState(ProductHistoryState.normalize(window.history.state?.productState), { history: 'replace' })
    }
    window.addEventListener('popstate', syncFromHistory)
    return () => window.removeEventListener('popstate', syncFromHistory)
  }, [params.defaultMajorId, params.majorCategories])
}

export function useSelectionEffects(params) {
  useEffect(() => {
    if (params.hasSearch) return
    if (params.activeSubcategory && !params.subcategories.includes(params.activeSubcategory)) params.setActiveSubcategory(null)
  }, [params.hasSearch, params.activeSubcategory, params.subcategories, params.setActiveSubcategory])
  useEffect(() => {
    if (!params.activeSubcategory || params.selectableLeafChips.length === 0) {
      if (params.activeLeaf) params.setActiveLeaf(null)
      if (params.activeGroup) params.setActiveGroup(null)
      if (params.activeModel) params.setActiveModel(null)
      return
    }
    if (!params.activeLeaf) return
    const matchedLeaf = findMatchingLabel(params.selectableLeafChips, params.activeLeaf)
    if (!matchedLeaf) {
      params.setActiveLeaf(null)
      params.setActiveGroup(null)
      if (params.activeModel) params.setActiveModel(null)
      return
    }
    if (normalizeLabel(params.activeLeaf) !== normalizeLabel(matchedLeaf)) params.setActiveLeaf(matchedLeaf)
  }, [params.activeSubcategory, params.selectableLeafChips, params.activeLeaf, params.activeGroup, params.activeModel])
  useEffect(() => {
    if (!params.leafView || params.leafView.groups.length <= 1) {
      if (params.activeGroup) params.setActiveGroup(null)
      return
    }
    const groupNames = params.leafView.groups.map((group) => group.name)
    const matched = findMatchingLabel(groupNames, params.activeGroup)
    if (!matched) {
      params.setActiveGroup(groupNames[0])
      return
    }
    if (matched !== params.activeGroup) params.setActiveGroup(matched)
  }, [params.leafView, params.activeGroup])
  useEffect(() => {
    if (params.modelCards.length === 0 || !params.activeModel) {
      if (params.activeModel && params.modelCards.length === 0) params.setActiveModel(null)
      if (params.selectedOptionModel) params.setSelectedOptionModel('')
      params.setSelectedQuoteQuantity(1)
      return
    }
    const exists = params.modelCards.some((item) => normalizeLabel(item.modelName) === normalizeLabel(params.activeModel))
    if (!exists) {
      params.setActiveModel(null)
      if (params.selectedOptionModel) params.setSelectedOptionModel('')
      params.setSelectedQuoteQuantity(1)
    }
  }, [params.modelCards, params.activeModel, params.selectedOptionModel])
  useEffect(() => {
    params.setSelectedQuoteQuantity(1)
  }, [params.activeModel])
  useEffect(() => {
    if (!params.selectedOptionModel) return
    const matchedOption = findMatchingLabel(params.selectedCombinedOptionModels, params.selectedOptionModel)
    if (!matchedOption) {
      params.setSelectedOptionModel('')
      return
    }
    if (matchedOption !== params.selectedOptionModel) params.setSelectedOptionModel(matchedOption)
  }, [params.selectedCombinedOptionModels, params.selectedOptionModel])
  useEffect(() => {
    params.setMobilePdfNumPages(0)
  }, [params.selectedPdfUrl])
  useEffect(() => {
    if (!params.isMobileViewport) return undefined
    const viewport = params.mobilePdfViewportRef.current
    if (!viewport) return undefined
    const syncWidth = () => {
      const nextWidth = Math.round(viewport.clientWidth)
      params.setMobilePdfViewportWidth((prev) => (prev === nextWidth ? prev : nextWidth))
    }
    syncWidth()
    if (typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(syncWidth)
      observer.observe(viewport)
      return () => observer.disconnect()
    }
    if (typeof window === 'undefined') return undefined
    window.addEventListener('resize', syncWidth)
    return () => window.removeEventListener('resize', syncWidth)
  }, [params.isMobileViewport, params.selectedPdfUrl])
  useEffect(() => {
    if (!params.quoteFeedback) return undefined
    const timer = window.setTimeout(() => params.setQuoteFeedback(''), 3200)
    return () => window.clearTimeout(timer)
  }, [params.quoteFeedback])
}

export function useScrollAndHistoryEffects(params) {
  useEffect(() => {
    if (!params.isActive || !params.activeModel || !params.pendingProductDetailScrollRef.current) return undefined
    const timer = window.setTimeout(() => {
      const target = params.productDetailRef.current
      if (target) target.scrollIntoView({ behavior: 'auto', block: 'start' })
      else if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' })
      params.pendingProductDetailScrollRef.current = false
    }, 0)
    return () => window.clearTimeout(timer)
  }, [params.isActive, params.activeModel, params.selectedModelCard?.modelName, params.activeLeaf, params.activeSubcategory])
  useEffect(() => {
    if (!params.isActive || !params.historySyncReadyRef.current || typeof window === 'undefined') return
    if (!isProductsRoutePath(window.location.pathname)) return
    const currentHistoryState = window.history.state && typeof window.history.state === 'object' ? window.history.state : {}
    const currentProductState = ProductHistoryState.normalize(currentHistoryState.productState)
    const nextProductState = params.buildHistoryProductState()
    params.historyActionRef.current = params.historyActionRef.current === 'push' ? 'push' : 'replace'
    if (ProductHistoryState.serialize(currentProductState) === ProductHistoryState.serialize(nextProductState)) {
      params.historyActionRef.current = 'replace'
      return
    }
    const nextHistoryState = { ...currentHistoryState, view: 'products' }
    if (nextProductState) nextHistoryState.productState = nextProductState
    else if ('productState' in nextHistoryState) delete nextHistoryState.productState
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`
    if (params.historyActionRef.current === 'push') window.history.pushState(nextHistoryState, '', currentUrl)
    else window.history.replaceState(nextHistoryState, '', currentUrl)
    params.historyActionRef.current = 'replace'
  }, [params.isActive, params.activeMajorId, params.activeSubcategory, params.activeLeaf, params.activeGroup, params.activeModel, params.selectedOptionModel, params.search, params.defaultMajorId])
}
