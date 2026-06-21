import { useMemo, useRef, useState } from 'react'
import { defaultMajorCategories } from '../../../data/defaultMajorCategories'
import { modelOptionWattageMap } from '../../../data/modelOptionWattageMap'
import { inventoryOptionModelsByBaseKey, productInventoryByModelKey, productInventorySummary } from '../../../data/productInventory'
import { productPriceByModelKey } from '../../../data/productPrices'
import { findMatchingLabel, getLeafChips, getLeafView, normalizeLabel } from '../../productCatalogService'
import { ProductCatalogModel } from '../ProductCatalogModel'
import { useProductOrderActions } from './useProductOrderActions'
import { useProductRouteState } from './useProductRouteState'
import { useProductSearchShortcuts } from './useProductSearchShortcuts'
import { useProductSelection } from './useProductSelection'
import {
  useLoadCatalog,
  useRouteEffects,
  useScrollAndHistoryEffects,
  useSelectionEffects,
  useViewportAndPanelEffects,
} from './useProductsControllerEffects'

export function useProductsController({
  isActive,
  isShopSite = true,
  externalSearchRequest,
  externalPresetRequest,
  onAddOrderItem,
  onAddQuoteItem,
  onStartGuestOrder,
  onOpenStoreProductPreset,
  orderItemCount = 0,
  quoteItemCount = 0,
}) {
  const [majorCategories, setMajorCategories] = useState(defaultMajorCategories)
  const [leafTreeMap, setLeafTreeMap] = useState({ byKey: {}, byLeaf: {} })
  const [activeMajorId, setActiveMajorId] = useState(defaultMajorCategories[0]?.id ?? '')
  const [activeSubcategory, setActiveSubcategory] = useState(null)
  const [activeLeaf, setActiveLeaf] = useState(null)
  const [activeGroup, setActiveGroup] = useState(null)
  const [activeModel, setActiveModel] = useState(null)
  const [selectedOptionModel, setSelectedOptionModel] = useState('')
  const [search, setSearch] = useState('')
  const [panelState, setPanelState] = useState({ major: false, sub: false, leaf: false, model: false })
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const [mobilePdfNumPages, setMobilePdfNumPages] = useState(0)
  const [mobilePdfViewportWidth, setMobilePdfViewportWidth] = useState(0)
  const [quoteFeedback, setQuoteFeedback] = useState('')
  const [selectedQuoteQuantity, setSelectedQuoteQuantity] = useState(1)

  const categoryCrumbRef = useRef(null)
  const productDetailRef = useRef(null)
  const pdfSectionRef = useRef(null)
  const mobilePdfViewportRef = useRef(null)
  const pendingProductDetailScrollRef = useRef(false)
  const wasActiveRef = useRef(isActive)
  const lastAppliedPresetAtRef = useRef(null)
  const historyActionRef = useRef('replace')
  const historySyncReadyRef = useRef(false)

  const inventoryContext = useMemo(
    () => ({
      inventoryByModelKey: productInventoryByModelKey,
      optionModelsByBaseKey: inventoryOptionModelsByBaseKey,
      modelOptionWattageMap,
      priceByModelKey: productPriceByModelKey,
    }),
    []
  )
  const defaultMajorId = majorCategories[0]?.id ?? defaultMajorCategories[0]?.id ?? ''
  const activeMajor = useMemo(() => majorCategories.find((item) => item.id === activeMajorId) ?? majorCategories[0] ?? null, [majorCategories, activeMajorId])
  const subcategories = useMemo(() => (Array.isArray(activeMajor?.subcategories) ? activeMajor.subcategories : []), [activeMajor])
  const selectableLeafChips = useMemo(() => getLeafChips(activeMajor?.name, activeSubcategory, { includeFallback: true }), [activeMajor?.name, activeSubcategory])
  const leafView = useMemo(() => {
    if (!activeMajor || !activeSubcategory || !activeLeaf) return null
    return getLeafView({ majorName: activeMajor.name, subcategoryName: activeSubcategory, leafName: activeLeaf, treeMap: leafTreeMap })
  }, [activeMajor, activeSubcategory, activeLeaf, leafTreeMap])
  const catalogModel = useMemo(() => new ProductCatalogModel({ leafTreeMap, majorCategories, inventoryContext }), [leafTreeMap, majorCategories, inventoryContext])
  const majorIdByName = catalogModel.majorIdByName
  const selectedGroupName = useMemo(() => {
    if (!leafView || leafView.groups.length <= 1) return null
    const groupNames = leafView.groups.map((group) => group.name)
    return findMatchingLabel(groupNames, activeGroup) ?? leafView.groups[0]?.name ?? null
  }, [leafView, activeGroup])
  const visibleModels = useMemo(() => {
    if (!leafView) return []
    if (leafView.groups.length > 1) {
      const group = leafView.groups.find((item) => normalizeLabel(item.name) === normalizeLabel(selectedGroupName))
      return group?.models ?? []
    }
    return leafView.models
  }, [leafView, selectedGroupName])
  const modelCards = useMemo(() => catalogModel.toModelCards(visibleModels, leafView?.modelAssetsByKey), [catalogModel, visibleModels, leafView])
  const pdfReadyModelCount = useMemo(() => modelCards.filter((item) => String(item.asset?.pdfUrl ?? '').trim()).length, [modelCards])
  const modelRouteIndex = useMemo(() => catalogModel.buildRouteIndex(), [catalogModel])
  const { searchInput, searchKeywords, hasSearch, modelShortcutList } = useProductSearchShortcuts({ catalogModel, modelRouteIndex, search })
  const majorAllLeafRecords = useMemo(() => catalogModel.getMajorLeafRecords({ activeMajor, activeSubcategory, hasSearch, activeLeaf }), [catalogModel, activeMajor, activeSubcategory, hasSearch, activeLeaf])
  const searchLeafRecords = useMemo(() => catalogModel.getSearchLeafRecords({ hasSearch, searchKeywords }), [catalogModel, hasSearch, searchKeywords])
  const { selectedModelCard, selectedCombinedOptionModels, selectedPdfUrl, mobilePdfPageWidth } = useProductSelection({
    activeModel,
    inventoryContext,
    mobilePdfViewportWidth,
    modelCards,
  })

  const closePanels = () => setPanelState({ major: false, sub: false, leaf: false, model: false })
  const setExclusivePanel = (panelName) => setPanelState((prev) => ({ major: false, sub: false, leaf: false, model: false, [panelName]: !prev[panelName] }))
  const markHistoryReplace = () => { historyActionRef.current = 'replace' }
  const requestProductDetailTopScroll = () => { pendingProductDetailScrollRef.current = true }
  const { buildCurrentProductRouteState, buildHistoryProductState, applyProductRouteState, pushProductHistorySnapshot } = useProductRouteState({
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
    closePanels,
    setters: {
      setActiveMajorId,
      setActiveSubcategory,
      setActiveLeaf,
      setActiveGroup,
      setActiveModel,
      setSelectedOptionModel,
      setSearch,
    },
  })

  useLoadCatalog({ setMajorCategories, setLeafTreeMap, setActiveMajorId })
  useViewportAndPanelEffects({ categoryCrumbRef, panelState, closePanels, isMobileViewport, setIsMobileViewport })
  useRouteEffects({
    isActive,
    externalPresetRequest,
    externalSearchRequest,
    defaultMajorId,
    majorCategories,
    historyActionRef,
    historySyncReadyRef,
    wasActiveRef,
    lastAppliedPresetAtRef,
    applyProductRouteState,
    closePanels,
    markHistoryReplace,
    setSearch,
  })
  useSelectionEffects({
    hasSearch,
    activeSubcategory,
    subcategories,
    activeLeaf,
    activeGroup,
    activeModel,
    selectableLeafChips,
    leafView,
    modelCards,
    selectedOptionModel,
    selectedCombinedOptionModels,
    selectedPdfUrl,
    isMobileViewport,
    mobilePdfViewportRef,
    setActiveSubcategory,
    setActiveLeaf,
    setActiveGroup,
    setActiveModel,
    setSelectedOptionModel,
    setSelectedQuoteQuantity,
    setMobilePdfNumPages,
    setMobilePdfViewportWidth,
    quoteFeedback,
    setQuoteFeedback,
  })
  useScrollAndHistoryEffects({
    isActive,
    activeModel,
    selectedModelCard,
    activeLeaf,
    activeSubcategory,
    search,
    activeMajorId,
    activeGroup,
    selectedOptionModel,
    defaultMajorId,
    historyActionRef,
    historySyncReadyRef,
    pendingProductDetailScrollRef,
    productDetailRef,
    buildHistoryProductState,
  })

  const onMajorClick = (majorId) => applyProductRouteState(buildCurrentProductRouteState({ majorId, subcategory: null, leaf: null, groupName: null, model: null, optionModel: '', search: hasSearch ? '' : search }), { history: 'push' })
  const onSubcategoryClick = (subcategory) => applyProductRouteState(buildCurrentProductRouteState({ subcategory, leaf: null, groupName: null, model: null, optionModel: '' }), { history: 'push' })
  const onLeafClick = (leafName) => applyProductRouteState(buildCurrentProductRouteState({ leaf: leafName, groupName: null, model: null, optionModel: '', search: hasSearch ? '' : search }), { history: 'push' })
  const onModelClick = (modelName) => {
    if (!modelCards.some((item) => normalizeLabel(item.modelName) === normalizeLabel(modelName))) return
    requestProductDetailTopScroll()
    applyProductRouteState(buildCurrentProductRouteState({ model: modelName, optionModel: '', search: hasSearch ? '' : search }), { history: 'push' })
  }
  const onLeafRecordModelClick = (record, modelName) => {
    const majorName = String(record?.major ?? '').trim()
    const subcategory = String(record?.subcategory ?? '').trim()
    const leaf = String(record?.leaf ?? '').trim()
    const model = String(modelName ?? '').trim()
    if (!subcategory || !leaf || !model) return
    requestProductDetailTopScroll()
    const matchedMajorId = majorCategories.find((item) => normalizeLabel(item?.name) === normalizeLabel(majorName))?.id
    const route = modelRouteIndex[normalizeLabel(model)] ?? null
    const baseRouteState = { majorId: matchedMajorId || activeMajorId || defaultMajorId, subcategory, leaf, groupName: route?.groupName || null, search: '' }
    pushProductHistorySnapshot({ ...baseRouteState, model: null, optionModel: '' })
    applyProductRouteState({ ...baseRouteState, model, optionModel: '' }, { history: 'push' })
  }
  const onShortcutModelClick = (shortcut) => {
    if (!shortcut) return
    requestProductDetailTopScroll()
    const baseRouteState = { majorId: shortcut.majorId || activeMajorId || defaultMajorId, subcategory: shortcut.subcategory || null, leaf: shortcut.leaf || null, groupName: shortcut.groupName || null, search: '' }
    if (baseRouteState.leaf) pushProductHistorySnapshot({ ...baseRouteState, model: null, optionModel: '' })
    applyProductRouteState({ ...baseRouteState, model: shortcut.model || null, optionModel: shortcut.optionModel || '' }, { history: 'push' })
  }
  const orderActions = useProductOrderActions({
    isShopSite,
    inventoryContext,
    selectedModelCard,
    selectedOptionModel,
    selectedQuoteQuantity,
    onAddOrderItem,
    onAddQuoteItem,
    onStartGuestOrder,
    onOpenStoreProductPreset,
    setQuoteFeedback,
    setSelectedQuoteQuantity,
    routeContext: { activeMajor, activeMajorId, activeSubcategory, activeLeaf, activeGroup, selectedGroupName, defaultMajorId, majorIdByName },
  })

  const showMajorAggregateView = !hasSearch && !activeLeaf && majorAllLeafRecords.length > 0
  const showNewProducts = !hasSearch && !activeLeaf && !showMajorAggregateView
  const majorTitle = hasSearch ? 'Search Results' : activeLeaf || ''
  const pageDescription = hasSearch ? '카테고리, 시리즈, 그룹, 모델 검색 결과입니다.' : activeLeaf ? isShopSite ? `재고 기준: ${productInventorySummary.updatedLabel || productInventorySummary.sourceFile}` : '모델별 사양서와 제품 정보를 확인하고 필요한 품목은 견적요청으로 문의하세요.' : `${activeMajor?.name ?? 'Products'} 카테고리의 소분류와 시리즈 탐색 화면입니다.`
  const searchMetaText = hasSearch ? (modelShortcutList.length > 0 ? `${modelShortcutList.length}개 모델 바로가기를 찾았습니다. 항목을 선택해 상세로 이동하세요.` : searchLeafRecords.length > 0 ? `${searchLeafRecords.length}개 시리즈가 검색되었습니다. 모델을 클릭하면 해당 상세로 이동합니다.` : '일치하는 검색 결과가 없습니다.') : activeLeaf ? (modelCards.length > 0 ? `총 ${modelCards.length}개 모델 (PDF 제공 ${pdfReadyModelCount}개 / PDF 준비중 ${modelCards.length - pdfReadyModelCount}개)` : '등록된 모델이 없습니다.') : showMajorAggregateView ? `${activeMajor?.name ?? ''}${activeSubcategory ? ` / ${activeSubcategory}` : ''} 하위의 전체 품목을 표시중입니다. (${majorAllLeafRecords.length}개 시리즈)` : '상단 카테고리 바에서 대분류 -> 중분류 -> 소분류 -> 모델 순서로 선택하세요.'

  const view = {
    isActive,
    isShopSite,
    orderItemCount,
    quoteItemCount,
    majorCategories,
    activeMajor,
    activeMajorId,
    activeSubcategory,
    activeLeaf,
    activeGroup,
    activeModel,
    selectedGroupName,
    selectedOptionModel,
    search,
    hasSearchInput: searchInput.length > 0,
    hasSearch,
    subcategories,
    selectableLeafChips,
    leafView,
    modelCards,
    selectedModelCard,
    selectedCombinedOptionModels,
    selectedQuoteQuantity,
    selectedPdfUrl,
    isMobileViewport,
    mobilePdfNumPages,
    mobilePdfPageWidth,
    quoteFeedback,
    inventoryContext,
    majorAllLeafRecords,
    searchLeafRecords,
    modelShortcutList,
    showMajorAggregateView,
    showNewProducts,
    pageDescription,
    majorTitle,
    showMajorTitle: Boolean(majorTitle) && normalizeLabel(majorTitle) !== normalizeLabel(hasSearch ? 'Search Results' : activeLeaf || activeMajor?.name || 'Product Information'),
    searchMetaText,
    ...panelStateToView(panelState),
  }
  const actions = {
    setSelectedOptionModel,
    setSelectedQuoteQuantity,
    setMobilePdfNumPages,
    markHistoryReplace,
    toggleMajorPanel: () => setExclusivePanel('major'),
    toggleSubPanel: () => subcategories.length > 0 && setExclusivePanel('sub'),
    toggleLeafPanel: () => selectableLeafChips.length > 0 && setExclusivePanel('leaf'),
    toggleModelPanel: () => modelCards.length > 0 && setExclusivePanel('model'),
    onMajorClick,
    onSubcategoryClick,
    onLeafClick,
    onModelClick,
    onLeafRecordModelClick,
    onShortcutModelClick,
    onSearchChange: (value) => { markHistoryReplace(); setSearch(value) },
    onAddLineItem: orderActions.onAddLineItem,
    onStartGuestOrder: orderActions.onStartGuestOrder,
    onOpenStoreProductPreset: orderActions.onOpenStoreProductPreset,
    onScrollToPdfSection: () => pdfSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
  }
  const refs = { categoryCrumbRef, productDetailRef, pdfSectionRef, mobilePdfViewportRef }

  return { view, actions, refs }
}

function panelStateToView(panelState) {
  return {
    isMajorPanelOpen: panelState.major,
    isSubPanelOpen: panelState.sub,
    isLeafPanelOpen: panelState.leaf,
    isModelPanelOpen: panelState.model,
  }
}
