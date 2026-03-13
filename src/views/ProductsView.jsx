import { useEffect, useMemo, useState } from 'react'
import { defaultMajorCategories } from '../data/defaultMajorCategories'
import {
  findMatchingLabel,
  findSearchResults,
  getLeafChips,
  getModelAssetByModel,
  getLeafView,
  iconByMajor,
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

export function ProductsView({ isActive, onStatusChange }) {
  const [majorCategories, setMajorCategories] = useState(defaultMajorCategories)
  const [leafTreeMap, setLeafTreeMap] = useState({ byKey: {}, byLeaf: {} })

  const [activeMajorId, setActiveMajorId] = useState(defaultMajorCategories[0]?.id ?? '')
  const [activeSubcategory, setActiveSubcategory] = useState(null)
  const [activeLeaf, setActiveLeaf] = useState(null)
  const [activeGroup, setActiveGroup] = useState(null)
  const [activeModel, setActiveModel] = useState(null)
  const [search, setSearch] = useState('')

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
        `Firebase initialized: App/Auth/Firestore connected. Categories: ${majorResult.source}. Leaf tree: ${treeResult.source}.`
      )
    })()

    return () => {
      alive = false
    }
  }, [onStatusChange])

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
  const groupOptions = useMemo(() => (leafView?.groups.length > 1 ? leafView.groups.map((group) => group.name) : []), [leafView])

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
      : '상단 카테고리 바에서 대분류 -> 소분류 -> 시리즈 -> 그룹 -> 모델 순서로 선택하세요.'

  const handleMajorClick = (majorId) => {
    setActiveMajorId(majorId)
    setActiveSubcategory(null)
    setActiveLeaf(null)
    setActiveGroup(null)
    if (hasSearch) setSearch('')
  }

  const handleSubcategoryClick = (subcategory) => {
    setActiveSubcategory(subcategory)
    setActiveLeaf(null)
    setActiveGroup(null)
  }

  const handleLeafClick = (leafName) => {
    setActiveLeaf(leafName)
    setActiveGroup(null)
    if (hasSearch) setSearch('')
  }

  const handleGroupClick = (groupName) => {
    setActiveGroup(groupName || null)
    if (hasSearch) setSearch('')
  }

  const handleModelClick = (modelName) => {
    setActiveModel(modelName || null)
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
    <section className={`${isActive ? '' : 'is-hidden'} min-h-[1200px] bg-slate-100 pb-16`} id="product-page">
      <div className="h-[168px] bg-[linear-gradient(rgba(53,53,53,0.36),rgba(53,53,53,0.36)),url('/meanwell/image/product_banner.jpg')] bg-cover bg-center bg-no-repeat max-[980px]:h-[150px] max-[640px]:h-[120px]"></div>

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1320px] px-3 py-3">
          <div className="flex min-h-[64px] items-end gap-2 overflow-x-auto rounded-2xl border border-[#e9b7b7] bg-[linear-gradient(180deg,#fff,#fdf5f5)] p-2.5 shadow-[0_6px_18px_rgba(151,29,29,0.08)]">
            <span className="grid h-[42px] w-[44px] shrink-0 place-items-center rounded-lg bg-[#d42a2a] text-white shadow-sm">
              <i className="fa-solid fa-house text-xs"></i>
            </span>
            <span className="shrink-0 pb-2 text-[11px] font-black text-[#c83a3a]">-&gt;</span>

            <label className="grid shrink-0 gap-1">
              <span className="text-[11px] font-black uppercase tracking-[0.05em] text-[#ab2b2b]">대분류</span>
              <select
                className="h-[38px] min-w-[170px] rounded-lg border border-[#dba3a3] bg-white px-3 text-[13px] font-semibold text-slate-700 outline-none transition focus:border-[#c83a3a] focus:shadow-[0_0_0_2px_#f3d8d8]"
                value={activeMajor?.id ?? ''}
                onChange={(event) => handleMajorClick(event.target.value)}
              >
                {majorCategories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <span className="shrink-0 pb-2 text-[11px] font-black text-[#c83a3a]">-&gt;</span>

            <label className="grid shrink-0 gap-1">
              <span className="text-[11px] font-black uppercase tracking-[0.05em] text-[#ab2b2b]">소분류</span>
              <select
                className="h-[38px] min-w-[200px] rounded-lg border border-[#dba3a3] bg-white px-3 text-[13px] font-semibold text-slate-700 outline-none transition focus:border-[#c83a3a] focus:shadow-[0_0_0_2px_#f3d8d8] disabled:cursor-not-allowed disabled:bg-slate-100"
                value={activeSubcategory ?? ''}
                onChange={(event) => handleSubcategoryClick(event.target.value)}
                disabled={subcategories.length === 0}
              >
                {subcategories.length === 0 ? <option value="">소분류 없음</option> : null}
                {subcategories.map((subcategory) => (
                  <option key={subcategory} value={subcategory}>
                    {subcategory}
                  </option>
                ))}
              </select>
            </label>

            <span className="shrink-0 pb-2 text-[11px] font-black text-[#c83a3a]">-&gt;</span>

            <label className="grid shrink-0 gap-1">
              <span className="text-[11px] font-black uppercase tracking-[0.05em] text-[#ab2b2b]">시리즈</span>
              <select
                className="h-[38px] min-w-[200px] rounded-lg border border-[#dba3a3] bg-white px-3 text-[13px] font-semibold text-slate-700 outline-none transition focus:border-[#c83a3a] focus:shadow-[0_0_0_2px_#f3d8d8] disabled:cursor-not-allowed disabled:bg-slate-100"
                value={activeLeaf ?? ''}
                onChange={(event) => handleLeafClick(event.target.value)}
                disabled={!activeSubcategory || selectableLeafChips.length === 0}
              >
                <option value="">시리즈 선택</option>
                {selectableLeafChips.map((chip) => (
                  <option key={chip} value={chip}>
                    {chip}
                  </option>
                ))}
              </select>
            </label>

            <span className="shrink-0 pb-2 text-[11px] font-black text-[#c83a3a]">-&gt;</span>

            <label className="grid shrink-0 gap-1">
              <span className="text-[11px] font-black uppercase tracking-[0.05em] text-[#ab2b2b]">그룹</span>
              <select
                className="h-[38px] min-w-[170px] rounded-lg border border-[#dba3a3] bg-white px-3 text-[13px] font-semibold text-slate-700 outline-none transition focus:border-[#c83a3a] focus:shadow-[0_0_0_2px_#f3d8d8] disabled:cursor-not-allowed disabled:bg-slate-100"
                value={selectedGroupName ?? ''}
                onChange={(event) => handleGroupClick(event.target.value)}
                disabled={groupOptions.length === 0}
              >
                <option value="">{groupOptions.length > 0 ? '그룹 선택' : '그룹 없음'}</option>
                {groupOptions.map((groupName) => (
                  <option key={groupName} value={groupName}>
                    {groupName}
                  </option>
                ))}
              </select>
            </label>

            <span className="shrink-0 pb-2 text-[11px] font-black text-[#c83a3a]">-&gt;</span>

            <label className="grid shrink-0 gap-1">
              <span className="text-[11px] font-black uppercase tracking-[0.05em] text-[#ab2b2b]">모델</span>
              <select
                className="h-[38px] min-w-[190px] rounded-lg border border-[#dba3a3] bg-white px-3 text-[13px] font-semibold text-slate-700 outline-none transition focus:border-[#c83a3a] focus:shadow-[0_0_0_2px_#f3d8d8] disabled:cursor-not-allowed disabled:bg-slate-100"
                value={activeModel ?? ''}
                onChange={(event) => handleModelClick(event.target.value)}
                disabled={!activeLeaf || visibleModels.length === 0}
              >
                <option value="">{visibleModels.length > 0 ? '모델 선택' : '모델 없음'}</option>
                {visibleModels.map((modelName) => (
                  <option key={modelName} value={modelName}>
                    {modelName}
                  </option>
                ))}
              </select>
            </label>
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

          {activeLeaf && !hasSearch ? (
            <section className="mb-5 grid gap-4 rounded-xl border border-slate-300 bg-white p-4 max-[640px]:p-3">
              <div className="grid gap-4 [grid-template-columns:280px_minmax(0,1fr)] max-[980px]:grid-cols-1">
                <div className="grid h-[250px] place-items-center rounded-lg border border-slate-200 bg-slate-50 p-3">
                  {selectedModelCard?.asset?.imageUrl ? (
                    <img src={selectedModelCard.asset.imageUrl} alt={selectedModelCard.modelName} className="max-h-full w-full object-contain" loading="lazy" />
                  ) : (
                    <span className="text-xs text-slate-500">이미지 없음</span>
                  )}
                </div>
                <div className="grid content-start gap-2.5">
                  <span className="inline-flex w-fit items-center rounded-full bg-[#d71f2b] px-2 py-0.5 text-[10px] font-bold text-white">NEW</span>
                  <h2 className="m-0 text-[clamp(30px,2vw,42px)] font-black tracking-[-0.01em] text-slate-900">{selectedModelCard?.modelName ?? activeLeaf}</h2>
                  <p className="m-0 text-sm text-slate-500">{selectedModelCard ? `${selectedModelCard.modelName} 기준 상세 정보입니다.` : '모델을 선택하면 상세 정보를 확인할 수 있습니다.'}</p>
                </div>
              </div>
              <div className="overflow-x-auto border-t border-slate-200 pt-2">
                <div className="flex min-w-[620px] items-center gap-5 text-[12px] font-semibold text-slate-500">
                  <span className="border-b-2 border-[#c83a3a] pb-2 text-[#c83a3a]">특징</span>
                  <span className="pb-2">종류</span>
                  <span className="pb-2">상세사양</span>
                  <span className="pb-2">회로도</span>
                  <span className="pb-2">자료 다운로드</span>
                  <span className="pb-2">유사상품</span>
                </div>
              </div>
            </section>
          ) : null}

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
              <article className="grid min-h-[980px] gap-4 rounded-xl border border-slate-300 bg-slate-50 p-4">
                <div className="grid gap-2.5">
                  <p className="m-0 text-[11px] font-bold uppercase tracking-[0.06em] text-[#c83a3a]">
                    {activeMajor?.name} / {activeSubcategory} / {activeLeaf}
                  </p>
                  <h4 className="m-0 text-[clamp(32px,2.8vw,46px)] font-black leading-tight tracking-[-0.01em] text-slate-900">{selectedModelCard.modelName}</h4>
                </div>
                {selectedModelCard.asset?.pdfUrl ? (
                  <div className="h-[860px] overflow-hidden rounded-lg border border-slate-300 bg-[#1f2937] max-[980px]:h-[700px] max-[640px]:h-[540px]">
                    <iframe title={`${selectedModelCard.modelName} PDF`} src={withPdfViewerParams(selectedModelCard.asset.pdfUrl)} className="h-full w-full border-0 bg-white"></iframe>
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
