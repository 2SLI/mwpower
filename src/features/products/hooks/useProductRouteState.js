import { useMemo } from 'react'
import { ProductHistoryState, isProductsRoutePath } from '../productViewUtils'

export function useProductRouteState({
  majorCategories,
  defaultMajorId,
  activeMajorId,
  activeSubcategory,
  activeLeaf,
  activeGroup,
  activeModel,
  selectedOptionModel,
  search,
  historyActionRef,
  setters,
  closePanels,
}) {
  const historyState = useMemo(() => new ProductHistoryState({ majorCategories, defaultMajorId }), [majorCategories, defaultMajorId])
  const resolveProductRouteState = (rawState) => historyState.resolve(rawState)
  const buildCurrentProductRouteState = (overrides = {}) =>
    resolveProductRouteState({
      majorId: activeMajorId || defaultMajorId,
      subcategory: activeSubcategory,
      leaf: activeLeaf,
      groupName: activeGroup,
      model: activeModel,
      optionModel: selectedOptionModel,
      search,
      ...overrides,
    })
  const buildHistoryProductState = (rawState = null) => historyState.buildSnapshot(rawState)
  const applyProductRouteState = (rawState = null, { history = 'replace' } = {}) => {
    const resolved = resolveProductRouteState(rawState)
    historyActionRef.current = history
    setters.setActiveMajorId(resolved.majorId || defaultMajorId)
    setters.setActiveSubcategory(resolved.subcategory)
    setters.setActiveLeaf(resolved.leaf)
    setters.setActiveGroup(resolved.groupName)
    setters.setActiveModel(resolved.model)
    setters.setSelectedOptionModel(resolved.optionModel)
    setters.setSearch(resolved.search)
    closePanels()
  }
  const pushProductHistorySnapshot = (rawState = null) => {
    if (typeof window === 'undefined' || !isProductsRoutePath(window.location.pathname)) return
    const currentHistoryState = window.history.state && typeof window.history.state === 'object' ? window.history.state : {}
    const nextHistoryState = { ...currentHistoryState, view: 'products' }
    const nextProductState = buildHistoryProductState(rawState)
    if (nextProductState) nextHistoryState.productState = nextProductState
    else if ('productState' in nextHistoryState) delete nextHistoryState.productState
    window.history.pushState(nextHistoryState, '', `${window.location.pathname}${window.location.search}${window.location.hash}`)
  }

  return {
    resolveProductRouteState,
    buildCurrentProductRouteState,
    buildHistoryProductState,
    applyProductRouteState,
    pushProductHistorySnapshot,
  }
}
