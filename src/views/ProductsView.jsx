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

function withPdfViewerParams(url = '') {
  const text = String(url ?? '').trim()
  if (!text) return ''

  const [base, hash = ''] = text.split('#')
  const params = new URLSearchParams(hash)
  if (!params.has('page')) params.set('page', '1')
  if (!params.has('zoom')) params.set('zoom', 'page-fit')

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

export function ProductsView({ isActive, onStatusChange }) {
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

      onStatusChange?.(
        `Product catalog loaded from local data. Categories: ${majorResult.source}. Leaf tree: ${treeResult.source}.`
      )
    })()

    return () => {
      alive = false
    }
  }, [onStatusChange])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!categoryCrumbRef.current) return
      if (!categoryCrumbRef.current.contains(event.target)) {
        setIsMajorPanelOpen(false)
        setIsSubPanelOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key !== 'Escape') return
      setIsMajorPanelOpen(false)
      setIsSubPanelOpen(false)
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
      return
    }

    const matchedLeaf = findMatchingLabel(selectableLeafChips, activeSubcategory) ?? activeSubcategory
    if (normalizeLabel(activeLeaf) !== normalizeLabel(matchedLeaf)) {
      setActiveLeaf(matchedLeaf)
    }
    if (activeGroup) setActiveGroup(null)
  }, [activeSubcategory, selectableLeafChips, activeLeaf, activeGroup])

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

  const selectedModelCard = useMemo(
    () => visibleModelCards.find((item) => normalizeLabel(item.modelName) === normalizeLabel(activeModel)) ?? visibleModelCards[0] ?? null,
    [visibleModelCards, activeModel]
  )

  useEffect(() => {
    if (visibleModelCards.length === 0) {
      setActiveModel(null)
      return
    }

    const exists = visibleModelCards.some((item) => normalizeLabel(item.modelName) === normalizeLabel(activeModel))
    if (!exists) {
      setActiveModel(visibleModelCards[0].modelName)
    }
  }, [visibleModelCards, activeModel])

  const showNewProducts = !hasSearch && !activeLeaf

  const pageHeading = hasSearch ? 'Search Results' : activeLeaf || activeMajor?.name || 'Product Information'
  const pageDescription = hasSearch
    ? '카테고리, 시리즈, 그룹, 모델 검색 결과입니다.'
    : activeLeaf
      ? ''
      : `${activeMajor?.name ?? 'Products'} 카테고리의 소분류와 시리즈 탐색 화면입니다.`

  const majorTitle = hasSearch ? 'Search Results' : activeLeaf || activeSubcategory || activeMajor?.name || 'Category'
  const showMajorTitle = normalizeLabel(majorTitle) !== normalizeLabel(pageHeading)

  const searchMetaText = hasSearch
    ? searchResults.length > 0
      ? `${searchResults.length}개의 결과가 있습니다. 클릭하면 해당 카테고리로 이동합니다.`
      : '일치하는 검색 결과가 없습니다.'
    : activeLeaf
      ? leafView && leafView.totalModelCount > 0
        ? `총 ${leafView.totalModelCount}개 모델이 등록되어 있습니다.`
        : '해당 시리즈 모델 데이터가 아직 없습니다.'
      : '상단 카테고리 바에서 대분류 -> 소분류 순서로 선택하세요.'

  const handleMajorClick = (majorId) => {
    setActiveMajorId(majorId)
    setActiveSubcategory(null)
    setActiveLeaf(null)
    setActiveGroup(null)
    setIsMajorPanelOpen(false)
    if (hasSearch) setSearch('')
  }

  const handleSubcategoryClick = (subcategory) => {
    setActiveSubcategory(subcategory)
    setActiveLeaf(subcategory || null)
    setActiveGroup(null)
    setIsSubPanelOpen(false)
  }

  const handleLeafClick = (leafName) => {
    setActiveLeaf(leafName)
    setActiveGroup(null)
    if (hasSearch) setSearch('')
  }

  const handleSearchResultClick = (result) => {
    setActiveMajorId(result.majorId)
    setActiveSubcategory(result.subcategory || null)
    setActiveLeaf(result.leafChip || null)
    setActiveGroup(result.groupName || null)
    setSearch('')
  }

  return (
    <section className={`${isActive ? '' : 'is-hidden'} min-h-[1200px] bg-slate-100 pb-16 max-[640px]:min-h-0 max-[640px]:pb-10`} id="product-page">
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

              <dl className={`g ${isMajorPanelOpen ? 'open' : ''}`}>
                <dt>
                  <button
                    type="button"
                    aria-expanded={isMajorPanelOpen}
                    aria-controls="aside-g-panel"
                    onClick={() => {
                      setIsMajorPanelOpen((prev) => !prev)
                      setIsSubPanelOpen(false)
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
                <>
                  <section className="overflow-hidden rounded-xl border border-[#c83a3a]">
                    <header className="flex items-center justify-between bg-[#d13636] px-4 py-3 text-white">
                      <h3 className="m-0 text-[36px] font-black leading-none max-[640px]:text-[28px]">{activeSubcategory}</h3>
                      <button type="button" className="rounded-full border border-white/70 px-3 py-1 text-xs font-bold text-white/90">
                        VIEW MORE +
                      </button>
                    </header>
                    <div className="grid gap-2.5 bg-[#efefef] p-3 sm:grid-cols-2 lg:grid-cols-3">
                      {selectableLeafChips.map((chip) => {
                        const view = getLeafView({ majorName: activeMajor?.name, subcategoryName: activeSubcategory, leafName: chip, treeMap: leafTreeMap })
                        const isActive = normalizeLabel(chip) === normalizeLabel(activeLeaf)
                        const hint = view.groups.length > 1 ? `${view.groups.length}개 그룹 / 모델 ${view.totalModelCount}개` : `모델 ${view.totalModelCount}개`
                        return (
                          <button
                            key={chip}
                            type="button"
                            className={`grid gap-1 rounded-md border px-3 py-2.5 text-left transition ${
                              isActive
                                ? 'border-[#c83a3a] bg-[#c83a3a] text-white'
                                : 'border-slate-300 bg-white text-slate-700 hover:border-[#c83a3a] hover:text-[#c83a3a]'
                            }`}
                            onClick={() => handleLeafClick(chip)}
                          >
                            <span className="text-[14px] font-bold">{chip}</span>
                            <span className={`text-[11px] ${isActive ? 'text-[#fbe4e4]' : 'text-slate-500'}`}>{hint}</span>
                          </button>
                        )
                      })}
                    </div>
                  </section>
                </>
              )
            ) : selectedModelCard ? (
              <article className="grid min-h-[980px] gap-4 rounded-xl border border-slate-300 bg-slate-50 p-4 max-[640px]:min-h-0 max-[640px]:gap-3 max-[640px]:p-3">
                <div className="grid gap-2.5">
                  <p className="m-0 text-[11px] font-bold uppercase tracking-[0.06em] text-[#c83a3a]">
                    {activeMajor?.name} / {activeSubcategory} / {activeLeaf}
                  </p>
                  <h4 className="m-0 text-[clamp(32px,2.8vw,46px)] font-black leading-tight tracking-[-0.01em] text-slate-900">{selectedModelCard.modelName}</h4>
                </div>
                {selectedModelCard.asset?.pdfUrl ? (
                  <div className="h-[1290px] overflow-hidden rounded-lg border border-slate-300 bg-[#1f2937] max-[980px]:h-[1050px] max-[640px]:h-[calc(100vh-170px)] max-[640px]:min-h-[560px]">
                    <iframe
                      title={`${selectedModelCard.modelName} PDF`}
                      src={withPdfViewerParams(decodeAssetUrl(selectedModelCard.asset.pdfUrl))}
                      className="h-full w-full border-0 bg-white"
                    ></iframe>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8">
                    <p className="m-0 text-center text-sm text-slate-500">선택한 모델의 PDF 자료가 없습니다.</p>
                  </div>
                )}
              </article>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6">
                <p className="m-0 text-center text-sm text-slate-500">상단 카테고리에서 모델을 선택해주세요.</p>
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

