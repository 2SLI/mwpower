import { useEffect, useMemo, useRef, useState } from 'react'
import { defaultMajorCategories } from '../data/defaultMajorCategories'
import {
  findMatchingLabel,
  findSearchResults,
  getLeafChips,
  getModelAssetByModel,
  getLeafView,
  loadLeafModelTreeMap,
  loadMajorCategories,
  normalizeLabel,
} from '../features/productCatalogService'

function withPdfViewerParams(url = '', { mobile = false } = {}) {
  const text = String(url ?? '').trim()
  if (!text) return ''

  const [base, hash = ''] = text.split('#')
  const params = new URLSearchParams(hash)
  if (!params.has('page')) params.set('page', '1')
  params.set('zoom', mobile ? 'page-width' : 'page-fit')

  return `${base}#${params.toString()}`
}

function decodeAssetUrl(url = '') {
  const text = String(url ?? '').trim()
  if (!text) return ''
  try {
    return decodeURIComponent(text)
  } catch {
    return text
  }
}

function hasPdfAsset(asset) {
  return String(asset?.pdfUrl ?? '').trim().length > 0
}

export function ProductsView({ isActive, externalSearchRequest, externalPresetRequest }) {
  const [majorCategories, setMajorCategories] = useState(defaultMajorCategories)
  const [leafTreeMap, setLeafTreeMap] = useState({ byKey: {}, byLeaf: {} })

  const [activeMajorId, setActiveMajorId] = useState(defaultMajorCategories[0]?.id ?? '')
  const [activeSubcategory, setActiveSubcategory] = useState(null)
  const [activeLeaf, setActiveLeaf] = useState(null)
  const [activeGroup, setActiveGroup] = useState(null)
  const [activeModel, setActiveModel] = useState(null)
  const [search, setSearch] = useState('')
  const [isMajorPanelOpen, setIsMajorPanelOpen] = useState(false)
  const [isSubPanelOpen, setIsSubPanelOpen] = useState(false)
  const [isLeafPanelOpen, setIsLeafPanelOpen] = useState(false)
  const [isModelPanelOpen, setIsModelPanelOpen] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const categoryCrumbRef = useRef(null)

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

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const externalKeyword = String(externalSearchRequest?.keyword ?? '').trim()
    if (!externalKeyword) return
    setSearch(externalKeyword)
  }, [externalSearchRequest])

  useEffect(() => {
    const majorId = String(externalPresetRequest?.majorId ?? '').trim()
    if (!majorId) return

    const subcategory = String(externalPresetRequest?.subcategory ?? '').trim()
    const leaf = String(externalPresetRequest?.leaf ?? '').trim()
    const group = String(externalPresetRequest?.groupName ?? '').trim()
    const model = String(externalPresetRequest?.model ?? '').trim()

    setSearch('')
    setActiveMajorId(majorId)
    setActiveSubcategory(subcategory || null)
    setActiveLeaf(leaf || subcategory || null)
    setActiveGroup(group || null)
    setActiveModel(model || null)
  }, [externalPresetRequest])

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
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!categoryCrumbRef.current) return
      if (!categoryCrumbRef.current.contains(event.target)) {
        setIsMajorPanelOpen(false)
        setIsSubPanelOpen(false)
        setIsLeafPanelOpen(false)
        setIsModelPanelOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key !== 'Escape') return
      setIsMajorPanelOpen(false)
      setIsSubPanelOpen(false)
      setIsLeafPanelOpen(false)
      setIsModelPanelOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const activeMajor = useMemo(
    () => majorCategories.find((item) => item.id === activeMajorId) ?? majorCategories[0] ?? null,
    [majorCategories, activeMajorId]
  )

  const subcategories = useMemo(
    () => (Array.isArray(activeMajor?.subcategories) ? activeMajor.subcategories : []),
    [activeMajor]
  )

  const subcategoriesKey = useMemo(() => subcategories.join('|'), [subcategories])

  useEffect(() => {
    if (search.trim()) return
    if (!activeSubcategory || !subcategories.includes(activeSubcategory)) {
      setActiveSubcategory(subcategories[0] ?? null)
    }
  }, [search, activeSubcategory, subcategories, subcategoriesKey])

  const selectableLeafChips = useMemo(
    () => getLeafChips(activeMajor?.name, activeSubcategory, { includeFallback: true }),
    [activeMajor?.name, activeSubcategory]
  )

  useEffect(() => {
    if (!activeSubcategory) {
      if (activeLeaf) setActiveLeaf(null)
      if (activeGroup) setActiveGroup(null)
      if (activeModel) setActiveModel(null)
      return
    }

    if (selectableLeafChips.length === 0) {
      if (activeLeaf) setActiveLeaf(null)
      if (activeGroup) setActiveGroup(null)
      if (activeModel) setActiveModel(null)
      return
    }

    if (!activeLeaf) {
      setActiveLeaf(selectableLeafChips[0] ?? null)
      if (activeGroup) setActiveGroup(null)
      if (activeModel) setActiveModel(null)
      return
    }

    const matchedLeaf = findMatchingLabel(selectableLeafChips, activeLeaf)
    if (!matchedLeaf) {
      setActiveLeaf(selectableLeafChips[0] ?? null)
      setActiveGroup(null)
      if (activeModel) setActiveModel(null)
      return
    }

    if (normalizeLabel(activeLeaf) !== normalizeLabel(matchedLeaf)) {
      setActiveLeaf(matchedLeaf)
    }
  }, [activeSubcategory, selectableLeafChips, activeLeaf, activeGroup, activeModel])

  const leafKey = useMemo(() => selectableLeafChips.join('|'), [selectableLeafChips])

  useEffect(() => {
    if (!activeLeaf) return
    const matched = findMatchingLabel(selectableLeafChips, activeLeaf)
    if (!matched) {
      setActiveLeaf(null)
      setActiveGroup(null)
      return
    }
    if (matched !== activeLeaf) setActiveLeaf(matched)
  }, [activeLeaf, selectableLeafChips, leafKey])

  const leafView = useMemo(() => {
    if (!activeMajor || !activeSubcategory || !activeLeaf) return null
    return getLeafView({
      majorName: activeMajor.name,
      subcategoryName: activeSubcategory,
      leafName: activeLeaf,
      treeMap: leafTreeMap,
    })
  }, [activeMajor, activeSubcategory, activeLeaf, leafTreeMap])

  useEffect(() => {
    if (!leafView || leafView.groups.length <= 1) {
      if (activeGroup) setActiveGroup(null)
      return
    }

    const groupNames = leafView.groups.map((group) => group.name)
    const matched = findMatchingLabel(groupNames, activeGroup)
    if (!matched) {
      setActiveGroup(groupNames[0])
      return
    }

    if (matched !== activeGroup) {
      setActiveGroup(matched)
    }
  }, [leafView, activeGroup])

  const searchTerm = search.trim()
  const hasSearch = searchTerm.length > 0

  const searchResults = useMemo(
    () => (hasSearch ? findSearchResults(majorCategories, searchTerm, leafTreeMap) : []),
    [hasSearch, majorCategories, searchTerm, leafTreeMap]
  )

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

  const visibleModelCards = useMemo(
    () =>
      visibleModels.map((modelName) => ({
        modelName,
        asset: getModelAssetByModel(leafView?.modelAssetsByKey, modelName),
      })),
    [visibleModels, leafView]
  )

  const modelCards = useMemo(() => visibleModelCards, [visibleModelCards])

  const pdfReadyModelCount = useMemo(() => modelCards.filter((item) => hasPdfAsset(item.asset)).length, [modelCards])

  const selectedModelCard = useMemo(
    () => modelCards.find((item) => normalizeLabel(item.modelName) === normalizeLabel(activeModel)) ?? null,
    [modelCards, activeModel]
  )

  useEffect(() => {
    if (modelCards.length === 0) {
      if (activeModel) setActiveModel(null)
      return
    }

    if (!activeModel) return

    const exists = modelCards.some((item) => normalizeLabel(item.modelName) === normalizeLabel(activeModel))
    if (!exists) setActiveModel(null)
  }, [modelCards, activeModel])

  const showNewProducts = !hasSearch && !activeLeaf

  const pageHeading = hasSearch ? 'Search Results' : activeLeaf || activeMajor?.name || 'Product Information'
  const pageDescription = hasSearch
    ? '카테고리, 시리즈, 그룹, 모델 검색 결과입니다.'
    : activeLeaf
      ? ''
      : `${activeMajor?.name ?? 'Products'} 카테고리의 소분류와 시리즈 탐색 화면입니다.`

  const majorTitle = hasSearch ? 'Search Results' : activeLeaf || ''
  const showMajorTitle = Boolean(majorTitle) && normalizeLabel(majorTitle) !== normalizeLabel(pageHeading)

  const searchMetaText = hasSearch
    ? searchResults.length > 0
      ? `${searchResults.length}개의 결과가 있습니다. 클릭하면 해당 카테고리로 이동합니다.`
      : '일치하는 검색 결과가 없습니다.'
    : activeLeaf
      ? modelCards.length > 0
        ? `총 ${modelCards.length}개 모델 (PDF 제공 ${pdfReadyModelCount}개 / PDF 준비중 ${modelCards.length - pdfReadyModelCount}개)`
        : '등록된 모델이 없습니다.'
      : '상단 카테고리 바에서 대분류 -> 중분류 -> 소분류 -> 모델 순서로 선택하세요.'

  const canGoBack = hasSearch || Boolean(activeModel) || Boolean(activeLeaf) || Boolean(activeSubcategory)

  const handleMajorClick = (majorId) => {
    setActiveMajorId(majorId)
    setActiveSubcategory(null)
    setActiveLeaf(null)
    setActiveGroup(null)
    setActiveModel(null)
    setIsMajorPanelOpen(false)
    setIsLeafPanelOpen(false)
    setIsModelPanelOpen(false)
    if (hasSearch) setSearch('')
  }

  const handleSubcategoryClick = (subcategory) => {
    setActiveSubcategory(subcategory)
    setActiveLeaf(null)
    setActiveGroup(null)
    setActiveModel(null)
    setIsSubPanelOpen(false)
    setIsLeafPanelOpen(false)
    setIsModelPanelOpen(false)
  }

  const handleBack = () => {
    setIsMajorPanelOpen(false)
    setIsSubPanelOpen(false)
    setIsLeafPanelOpen(false)
    setIsModelPanelOpen(false)

    if (hasSearch) {
      setSearch('')
      return
    }

    if (activeModel) {
      setActiveModel(null)
      return
    }

    if (activeLeaf) {
      setActiveLeaf(null)
      setActiveGroup(null)
      setActiveModel(null)
      return
    }

    if (activeSubcategory) {
      setActiveSubcategory(null)
      setActiveLeaf(null)
      setActiveGroup(null)
      setActiveModel(null)
    }
  }

  const handleLeafClick = (leafName) => {
    setActiveLeaf(leafName)
    setActiveGroup(null)
    setActiveModel(null)
    setIsLeafPanelOpen(false)
    setIsModelPanelOpen(false)
    if (hasSearch) setSearch('')
  }

  const handleModelClick = (modelName) => {
    const exists = modelCards.some((item) => normalizeLabel(item.modelName) === normalizeLabel(modelName))
    if (!exists) return
    setActiveModel(modelName)
    setIsModelPanelOpen(false)
    if (hasSearch) setSearch('')
  }

  const handleSearchResultClick = (result) => {
    setActiveMajorId(result.majorId)
    setActiveSubcategory(result.subcategory || null)
    setActiveLeaf(result.leafChip || null)
    setActiveGroup(result.groupName || null)
    setSearch('')
    setIsMajorPanelOpen(false)
    setIsSubPanelOpen(false)
    setIsLeafPanelOpen(false)
    setIsModelPanelOpen(false)
  }

  return (
    <section className={`${isActive ? '' : 'is-hidden'} min-h-[1200px] overflow-x-hidden bg-slate-100 pb-16 max-[640px]:min-h-0 max-[640px]:pb-10`} id="product-page">
      <div className="h-[168px] bg-[linear-gradient(rgba(53,53,53,0.36),rgba(53,53,53,0.36)),url('/meanwell/image/product_banner.jpg')] bg-cover bg-center bg-no-repeat max-[980px]:h-[150px] max-[640px]:h-[120px]"></div>

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1320px] px-3">
          <div className="product-category-crumb" ref={categoryCrumbRef}>
            <div className="inner">
              <a className="home" href="/" aria-label="홈으로">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    fill="currentColor"
                    d="M12 3.2 3 10.6V21h6.2v-5.4h5.6V21H21V10.6L12 3.2Zm7 15.8h-2.2v-5.4H7.2V19H5v-7.4l7-5.8 7 5.8V19Z"
                  />
                </svg>
              </a>

              {canGoBack ? (
                <button
                  type="button"
                  className="inline-flex h-[58px] items-center gap-2 border-r border-slate-300 bg-white px-4 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-50 max-[640px]:h-[52px] max-[640px]:px-3 max-[640px]:text-[13px]"
                  onClick={handleBack}
                >
                  <span aria-hidden="true">←</span>
                  뒤로가기
                </button>
              ) : null}

              <dl className={`g ${isMajorPanelOpen ? 'open' : ''}`}>
                <dt>
                  <button
                    type="button"
                    aria-expanded={isMajorPanelOpen}
                    aria-controls="aside-g-panel"
                    onClick={() => {
                      setIsMajorPanelOpen((prev) => !prev)
                      setIsSubPanelOpen(false)
                      setIsLeafPanelOpen(false)
                      setIsModelPanelOpen(false)
                    }}
                  >
                    {activeMajor?.name ?? '상품'}
                  </button>
                </dt>
                <dd id="aside-g-panel" aria-hidden={!isMajorPanelOpen}>
                  <div>
                    {majorCategories.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={item.id === activeMajor?.id ? 'on' : ''}
                        onClick={() => handleMajorClick(item.id)}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </dd>
              </dl>

              <dl className={`s ${isSubPanelOpen ? 'open' : ''}`}>
                <dt>
                  <button
                    type="button"
                    aria-expanded={isSubPanelOpen}
                    aria-controls="aside-s-panel"
                    onClick={() => {
                      if (subcategories.length === 0) return
                      setIsSubPanelOpen((prev) => !prev)
                      setIsMajorPanelOpen(false)
                      setIsLeafPanelOpen(false)
                      setIsModelPanelOpen(false)
                    }}
                    disabled={subcategories.length === 0}
                  >
                    {activeSubcategory ?? '상품'}
                  </button>
                </dt>
                <dd id="aside-s-panel" aria-hidden={!isSubPanelOpen}>
                  <div>
                    {subcategories.map((subcategory) => (
                      <button
                        key={subcategory}
                        type="button"
                        className={normalizeLabel(subcategory) === normalizeLabel(activeSubcategory) ? 'on' : ''}
                        onClick={() => handleSubcategoryClick(subcategory)}
                      >
                        {subcategory}
                      </button>
                    ))}
                  </div>
                </dd>
              </dl>

              <dl className={`l ${isLeafPanelOpen ? 'open' : ''}`}>
                <dt>
                  <button
                    type="button"
                    aria-expanded={isLeafPanelOpen}
                    aria-controls="aside-l-panel"
                    onClick={() => {
                      if (selectableLeafChips.length === 0) return
                      setIsLeafPanelOpen((prev) => !prev)
                      setIsMajorPanelOpen(false)
                      setIsSubPanelOpen(false)
                      setIsModelPanelOpen(false)
                    }}
                    disabled={selectableLeafChips.length === 0}
                  >
                    {activeLeaf ?? '소분류 선택'}
                  </button>
                </dt>
                <dd id="aside-l-panel" aria-hidden={!isLeafPanelOpen}>
                  <div>
                    {selectableLeafChips.map((leafChip) => (
                      <button
                        key={leafChip}
                        type="button"
                        className={normalizeLabel(leafChip) === normalizeLabel(activeLeaf) ? 'on' : ''}
                        onClick={() => handleLeafClick(leafChip)}
                      >
                        {leafChip}
                      </button>
                    ))}
                  </div>
                </dd>
              </dl>

              <dl className={`m ${isModelPanelOpen ? 'open' : ''}`}>
                <dt>
                  <button
                    type="button"
                    aria-expanded={isModelPanelOpen}
                    aria-controls="aside-m-panel"
                    onClick={() => {
                      if (modelCards.length === 0) return
                      setIsModelPanelOpen((prev) => !prev)
                      setIsMajorPanelOpen(false)
                      setIsSubPanelOpen(false)
                      setIsLeafPanelOpen(false)
                    }}
                    disabled={modelCards.length === 0}
                  >
                    {activeModel ?? '모델 선택'}
                  </button>
                </dt>
                <dd id="aside-m-panel" aria-hidden={!isModelPanelOpen}>
                  <div>
                    {modelCards.map((item) => (
                      <button
                        key={item.modelName}
                        type="button"
                        className={normalizeLabel(item.modelName) === normalizeLabel(activeModel) ? 'on' : ''}
                        onClick={() => handleModelClick(item.modelName)}
                      >
                        {item.modelName}
                        {!hasPdfAsset(item.asset) ? ' · PDF 준비중' : ''}
                      </button>
                    ))}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-[1160px] px-3 max-[980px]:mt-6">
        <div className="product-main min-w-0">
          <div className="rounded-xl border border-slate-300 bg-white px-5 py-5 max-[640px]:px-3.5">
            <h1 className="mb-0 mt-0 text-[clamp(34px,2.3vw,44px)] font-black leading-tight tracking-[-0.02em] text-slate-800 max-[980px]:text-[32px] max-[640px]:text-[26px]">
              Product Information
            </h1>
            <p className="mb-0 mt-2 text-[14px] text-slate-500">{pageDescription}</p>
          </div>

          <div className="product-search mb-2.5 mt-4 flex h-[54px] max-w-[720px] items-center gap-2.5 rounded-[999px] border border-slate-300 bg-white px-4 focus-within:border-[#c83a3a] focus-within:shadow-[0_0_0_2px_#f3d8d8] max-[640px]:h-[46px] max-[640px]:max-w-none max-[640px]:px-3" role="search" aria-label="Product search">
            <label className="sr-only" htmlFor="product-search-input">Search products</label>
            <i className="fa-solid fa-magnifying-glass text-sm text-slate-500" aria-hidden="true"></i>
            <input
              id="product-search-input"
              className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-slate-700 outline-none placeholder:text-slate-400"
              type="text"
              placeholder="상품명/시리즈/그룹 검색"
              autoComplete="off"
              spellCheck="false"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button
              type="button"
              className={`h-[34px] rounded-full bg-slate-200 px-3.5 text-xs font-bold text-slate-700 max-[640px]:h-[30px] max-[640px]:px-3 ${hasSearch ? '' : 'is-hidden'}`}
              onClick={() => setSearch('')}
            >
              Clear
            </button>
          </div>
          <p className="mb-8 min-h-[18px] text-[13px] text-slate-500 max-[980px]:mb-6" aria-live="polite">{searchMetaText}</p>

          {showMajorTitle ? (
            <h2 className="mb-4 mt-0 text-[clamp(38px,2.2vw,46px)] font-black leading-tight tracking-[-0.02em] text-slate-900 max-[980px]:text-[32px] max-[640px]:text-[26px]">{majorTitle}</h2>
          ) : null}

          <div className="category-grid grid gap-3 rounded-[12px] bg-slate-100 p-1">
            {hasSearch ? (
              searchResults.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-[18px] py-6">
                  <p className="m-0 text-center text-sm text-slate-500">검색 결과가 없습니다. 다른 키워드로 다시 시도해보세요.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 max-[640px]:grid-cols-1">
                  {searchResults.map((result) => (
                    <article
                      key={`${result.majorId}-${result.subcategory}-${result.leafChip}-${result.groupName}-${result.name}`}
                      className="grid cursor-pointer gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-[13px] transition hover:border-[#cf4a4a] hover:shadow-[0_0_0_2px_#f1d6d6]"
                      onClick={() => handleSearchResultClick(result)}
                    >
                      <p className="m-0 text-[11px] font-bold uppercase tracking-[0.06em] text-[#ab2b2b]">{result.majorName}</p>
                      <h3 className="m-0 text-base font-bold text-slate-800">{result.name}</h3>
                      <p className="m-0 text-xs text-slate-500">{result.context}</p>
                    </article>
                  ))}
                </div>
              )
            ) : !activeLeaf ? (
              !activeSubcategory ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6">
                  <p className="m-0 text-center text-sm text-slate-500">상단 카테고리 바에서 소분류를 선택하면 시리즈 결과가 표시됩니다.</p>
                </div>
              ) : selectableLeafChips.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6">
                  <p className="m-0 text-center text-sm text-slate-500">선택한 소분류에 등록된 시리즈가 없습니다.</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6">
                  <p className="m-0 text-center text-sm text-slate-500">상단 카테고리 바의 소분류 선택 메뉴에서 시리즈를 선택해주세요.</p>
                </div>
              )
            ) : selectedModelCard && leafView ? (
              <article className="grid min-h-[980px] gap-4 rounded-xl border border-slate-300 bg-slate-50 p-4 max-[640px]:min-h-0 max-[640px]:gap-3 max-[640px]:p-3">
                <section className="rounded-xl border border-slate-300 bg-white p-4 max-[640px]:p-3">
                  <p className="m-0 text-[11px] font-bold uppercase tracking-[0.06em] text-[#c83a3a]">
                    {activeMajor?.name} / {activeSubcategory} / {selectedModelCard.modelName}
                  </p>
                  <div className="mt-3 grid gap-4 lg:grid-cols-[280px_1fr_320px]">
                    <div className="overflow-hidden rounded-lg border border-slate-300 bg-slate-100">
                      {leafView.thumbnailUrl ? (
                        <img
                          src={decodeAssetUrl(leafView.thumbnailUrl)}
                          alt={activeLeaf}
                          className="block h-[220px] w-full object-contain p-3"
                          loading="lazy"
                        />
                      ) : (
                        <div className="grid h-[220px] w-full place-items-center text-sm text-slate-500">썸네일 준비중</div>
                      )}
                    </div>

                    <div className="grid content-start gap-3">
                      <h4 className="m-0 text-[34px] font-black leading-tight tracking-[-0.01em] text-slate-900 max-[640px]:text-[28px]">
                        {selectedModelCard.modelName}
                      </h4>
                      <div className="grid gap-1.5 text-[15px] text-slate-700">
                        <p className="m-0">
                          <strong>Wattage:</strong> {leafView.wattage || '정보 없음'}
                        </p>
                      </div>

                      <div>
                        <p className="mb-2 mt-0 text-[15px] font-bold text-slate-800">Features</p>
                        {Array.isArray(leafView.features) && leafView.features.length > 0 ? (
                          <ul className="m-0 grid gap-1 pl-5 text-[14px] leading-6 text-slate-700">
                            {leafView.features.map((feature) => (
                              <li key={feature}>{feature}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="m-0 text-[14px] text-slate-500">등록된 feature 정보가 없습니다.</p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-300 bg-slate-50 p-3">
                      <p className="mb-2 mt-0 text-[15px] font-bold text-slate-800">Model</p>
                      {modelCards.length > 0 ? (
                        <div className="flex flex-wrap gap-x-2 gap-y-1.5 text-[14px]">
                          {modelCards.map((item, index) => (
                            <button
                              key={item.modelName}
                              type="button"
                              className={`underline-offset-2 hover:underline ${
                                normalizeLabel(item.modelName) === normalizeLabel(activeModel) ? 'font-bold text-[#c83a3a]' : 'text-slate-700'
                              }`}
                              onClick={() => handleModelClick(item.modelName)}
                            >
                              {item.modelName}
                              {!hasPdfAsset(item.asset) ? ' (PDF 준비중)' : ''}
                              {index < modelCards.length - 1 ? ' /' : ''}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="m-0 text-[14px] text-slate-500">등록된 모델이 없습니다.</p>
                      )}
                    </div>
                  </div>
                </section>

                {selectedModelCard.asset?.pdfUrl ? (
                  <div className="h-[1290px] overflow-hidden rounded-lg border border-slate-300 bg-[#1f2937] max-[980px]:h-[1050px] max-[640px]:h-[calc(100vh-170px)] max-[640px]:min-h-[560px]">
                    <iframe
                      title={`${selectedModelCard.modelName} PDF`}
                      src={withPdfViewerParams(decodeAssetUrl(selectedModelCard.asset.pdfUrl), { mobile: isMobileViewport })}
                      className="h-full w-full border-0 bg-white max-[640px]:h-[128%] max-[640px]:w-[128%] max-[640px]:origin-top-left max-[640px]:scale-[0.78]"
                    ></iframe>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8">
                    <p className="m-0 text-center text-sm text-slate-500">PDF 준비중입니다.</p>
                  </div>
                )}
              </article>
            ) : activeLeaf && leafView ? (
              <article className="rounded-xl border border-slate-300 bg-white p-4 max-[640px]:p-3">
                <p className="m-0 text-[11px] font-bold uppercase tracking-[0.06em] text-[#c83a3a]">
                  {activeMajor?.name} / {activeSubcategory} / {activeLeaf}
                </p>
                <div className="mt-3 grid gap-4 lg:grid-cols-[280px_1fr_320px]">
                  <div className="overflow-hidden rounded-lg border border-slate-300 bg-slate-100">
                    {leafView.thumbnailUrl ? (
                      <img
                        src={decodeAssetUrl(leafView.thumbnailUrl)}
                        alt={activeLeaf}
                        className="block h-[220px] w-full object-contain p-3"
                        loading="lazy"
                      />
                    ) : (
                      <div className="grid h-[220px] w-full place-items-center text-sm text-slate-500">썸네일 준비중</div>
                    )}
                  </div>

                  <div className="grid content-start gap-3">
                    <h4 className="m-0 text-[34px] font-black leading-tight tracking-[-0.01em] text-slate-900 max-[640px]:text-[28px]">{activeLeaf}</h4>
                    <div className="grid gap-1.5 text-[15px] text-slate-700">
                      <p className="m-0">
                        <strong>Wattage:</strong> {leafView.wattage || '정보 없음'}
                      </p>
                    </div>

                    <div>
                      <p className="mb-2 mt-0 text-[15px] font-bold text-slate-800">Features</p>
                      {Array.isArray(leafView.features) && leafView.features.length > 0 ? (
                        <ul className="m-0 grid gap-1 pl-5 text-[14px] leading-6 text-slate-700">
                          {leafView.features.map((feature) => (
                            <li key={feature}>{feature}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="m-0 text-[14px] text-slate-500">등록된 feature 정보가 없습니다.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-300 bg-slate-50 p-3">
                    <p className="mb-2 mt-0 text-[15px] font-bold text-slate-800">Model</p>
                    {modelCards.length > 0 ? (
                      <div className="flex flex-wrap gap-x-2 gap-y-1.5 text-[14px]">
                        {modelCards.map((item, index) => (
                          <button
                            key={item.modelName}
                            type="button"
                            className={`underline-offset-2 hover:underline ${
                              normalizeLabel(item.modelName) === normalizeLabel(activeModel) ? 'font-bold text-[#c83a3a]' : 'text-slate-700'
                            }`}
                            onClick={() => handleModelClick(item.modelName)}
                          >
                            {item.modelName}
                            {!hasPdfAsset(item.asset) ? ' (PDF 준비중)' : ''}
                            {index < modelCards.length - 1 ? ' /' : ''}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="m-0 text-[14px] text-slate-500">등록된 모델이 없습니다.</p>
                    )}
                  </div>
                </div>
              </article>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6">
                <p className="m-0 text-center text-sm text-slate-500">상단 카테고리 바의 모델 선택 메뉴에서 모델을 선택해주세요.</p>
              </div>
            )}
          </div>

          <div className={`product-new-head mt-14 flex items-center justify-between max-[980px]:mt-10 ${showNewProducts ? '' : 'is-hidden'}`}>
            <h2 className="m-0 text-[clamp(38px,2.2vw,46px)] font-black leading-tight tracking-[-0.02em] text-slate-900 max-[980px]:text-[32px] max-[640px]:text-[26px]">New Products</h2>
            <a href="#" className="text-sm font-bold text-[#bf2222]">View all</a>
          </div>

          <div className={`new-products mt-4 grid gap-3 ${showNewProducts ? '' : 'is-hidden'}`}>
            <article className="grid grid-cols-[130px_1fr] gap-5 rounded-2xl border border-slate-300 bg-white px-4 py-4 max-[640px]:grid-cols-1">
              <div className="grid h-[96px] w-full place-items-center rounded-lg bg-slate-100 text-[#c12b2b]"><i className="fa-solid fa-microchip text-2xl" aria-hidden="true"></i></div>
              <div>
                <span className="inline-block rounded-full bg-[#d31f1f] px-2 py-[3px] text-[11px] font-bold text-white">NEW</span>
                <h3 className="mb-1 mt-2 text-[26px] font-black tracking-[-0.01em] text-slate-900 max-[640px]:text-[22px]">DX1 Controller</h3>
                <p className="m-0 text-[14px] text-slate-500">카테고리 탐색 기준으로 새로 등록될 제품군의 자리입니다.</p>
              </div>
            </article>
          </div>

        </div>
      </div>
    </section>
  )
}
