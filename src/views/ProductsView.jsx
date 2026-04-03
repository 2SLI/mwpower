import { useEffect, useMemo, useRef, useState } from 'react'
import { defaultMajorCategories } from '../data/defaultMajorCategories'
import {
  findMatchingLabel,
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

export function ProductsView({ isActive, externalSearchRequest, externalPresetRequest, onNavigate }) {
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
  const wasActiveRef = useRef(isActive)
  const lastAppliedPresetAtRef = useRef(null)
  const searchInput = String(search ?? '').trim()
  const hasSearchInput = searchInput.length > 0
  const searchKeywords = Array.from(
    new Set(
      searchInput
        .split(/[,\uFF0C]/)
        .map((keyword) => normalizeLabel(keyword))
        .filter(Boolean)
    )
  )
  const hasSearch = searchKeywords.length > 0

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
    const becameActive = isActive && !wasActiveRef.current
    if (!becameActive) {
      wasActiveRef.current = isActive
      return
    }

    const presetAt = externalPresetRequest?.at ?? null
    const hasFreshPreset = presetAt != null && presetAt !== lastAppliedPresetAtRef.current
    if (hasFreshPreset) {
      setSearch('')
      setIsMajorPanelOpen(false)
      setIsSubPanelOpen(false)
      setIsLeafPanelOpen(false)
      setIsModelPanelOpen(false)

      wasActiveRef.current = isActive
      return
    }

    const defaultMajorId = majorCategories[0]?.id ?? defaultMajorCategories[0]?.id ?? ''
    setActiveMajorId(defaultMajorId)
    setActiveSubcategory(null)
    setActiveLeaf(null)
    setActiveGroup(null)
    setActiveModel(null)
    setSearch('')
    setIsMajorPanelOpen(false)
    setIsSubPanelOpen(false)
    setIsLeafPanelOpen(false)
    setIsModelPanelOpen(false)

    wasActiveRef.current = isActive
  }, [isActive, majorCategories, externalPresetRequest])

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
    lastAppliedPresetAtRef.current = externalPresetRequest?.at ?? null
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
    if (hasSearch) return
    if (activeSubcategory && !subcategories.includes(activeSubcategory)) setActiveSubcategory(null)
  }, [hasSearch, activeSubcategory, subcategories, subcategoriesKey])

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
    if (!activeLeaf) return

    const matchedLeaf = findMatchingLabel(selectableLeafChips, activeLeaf)
    if (!matchedLeaf) {
      setActiveLeaf(null)
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

  const getRecordModelNames = (record) => {
    const sourceModels =
      Array.isArray(record?.groups) && record.groups.length > 1
        ? record.groups.flatMap((group) => (Array.isArray(group?.models) ? group.models : []))
        : Array.isArray(record?.models)
          ? record.models
          : []

    const dedupedModels = []
    const modelSeen = new Set()
    sourceModels.forEach((modelName) => {
      const model = String(modelName ?? '').trim()
      const key = normalizeLabel(model)
      if (!model || !key || modelSeen.has(key)) return
      modelSeen.add(key)
      dedupedModels.push(model)
    })

    return dedupedModels
  }

  const toLeafCardRecord = (record, modelNames = getRecordModelNames(record)) => {
    const modelList = modelNames.map((modelName) => ({
      modelName,
      asset: getModelAssetByModel(record?.modelAssetsByKey, modelName),
    }))

    return {
      key: String(record?.key ?? '').trim(),
      major: String(record?.major ?? '').trim(),
      subcategory: String(record?.subcategory ?? '').trim(),
      leaf: String(record?.leaf ?? '').trim(),
      thumbnailUrl: String(record?.thumbnailUrl ?? '').trim(),
      wattage: String(record?.wattage ?? '').trim(),
      features: Array.isArray(record?.features) ? record.features : [],
      modelList,
      totalModels: modelList.length,
      pdfReadyCount: modelList.filter((item) => hasPdfAsset(item.asset)).length,
    }
  }

  const majorAllLeafRecords = useMemo(() => {
    if (!activeMajor || hasSearch || activeLeaf) return []

    return Object.values(leafTreeMap?.byKey ?? {})
      .filter((record) => {
        const isMajorMatched = normalizeLabel(record?.major) === normalizeLabel(activeMajor.name)
        if (!isMajorMatched) return false
        if (!activeSubcategory) return true
        return normalizeLabel(record?.subcategory) === normalizeLabel(activeSubcategory)
      })
      .sort((a, b) => {
        const sub = String(a?.subcategory ?? '').localeCompare(String(b?.subcategory ?? ''))
        if (sub !== 0) return sub
        return String(a?.leaf ?? '').localeCompare(String(b?.leaf ?? ''))
      })
      .map((record) => toLeafCardRecord(record))
  }, [activeMajor, hasSearch, activeSubcategory, activeLeaf, leafTreeMap])

  const searchLeafRecords = useMemo(() => {
    if (!hasSearch) return []

    return Object.values(leafTreeMap?.byKey ?? {})
      .reduce((acc, record) => {
        const models = getRecordModelNames(record)
        const groups = Array.isArray(record?.groups) ? record.groups.map((group) => String(group?.name ?? '').trim()) : []
        const searchableTexts = [
          String(record?.major ?? ''),
          String(record?.subcategory ?? ''),
          String(record?.leaf ?? ''),
          ...groups,
          ...models,
        ]

        const isMatched = searchableTexts.some((text) => {
          const normalizedText = normalizeLabel(text)
          return searchKeywords.some((keyword) => normalizedText.includes(keyword))
        })
        if (!isMatched) return acc

        acc.push(toLeafCardRecord(record, models))
        return acc
      }, [])
      .sort((a, b) => {
        const major = String(a?.major ?? '').localeCompare(String(b?.major ?? ''))
        if (major !== 0) return major
        const sub = String(a?.subcategory ?? '').localeCompare(String(b?.subcategory ?? ''))
        if (sub !== 0) return sub
        return String(a?.leaf ?? '').localeCompare(String(b?.leaf ?? ''))
      })
  }, [hasSearch, searchKeywords, leafTreeMap])

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

  const showMajorAggregateView = !hasSearch && !activeLeaf && majorAllLeafRecords.length > 0
  const showNewProducts = !hasSearch && !activeLeaf && !showMajorAggregateView

  const pageHeading = hasSearch ? 'Search Results' : activeLeaf || activeMajor?.name || 'Product Information'
  const pageDescription = hasSearch
    ? '카테고리, 시리즈, 그룹, 모델 검색 결과입니다.'
    : activeLeaf
      ? ''
      : `${activeMajor?.name ?? 'Products'} 카테고리의 소분류와 시리즈 탐색 화면입니다.`

  const majorTitle = hasSearch ? 'Search Results' : activeLeaf || ''
  const showMajorTitle = Boolean(majorTitle) && normalizeLabel(majorTitle) !== normalizeLabel(pageHeading)

  const searchMetaText = hasSearch
    ? searchLeafRecords.length > 0
      ? `${searchLeafRecords.length}개 시리즈가 검색되었습니다. 모델을 클릭하면 해당 상세로 이동합니다.`
      : '일치하는 검색 결과가 없습니다.'
    : activeLeaf
      ? modelCards.length > 0
        ? `총 ${modelCards.length}개 모델 (PDF 제공 ${pdfReadyModelCount}개 / PDF 준비중 ${modelCards.length - pdfReadyModelCount}개)`
        : '등록된 모델이 없습니다.'
      : showMajorAggregateView
        ? `${activeMajor?.name ?? ''}${activeSubcategory ? ` / ${activeSubcategory}` : ''} 하위의 전체 품목을 표시중입니다. (${majorAllLeafRecords.length}개 시리즈)`
        : '상단 카테고리 바에서 대분류 -> 중분류 -> 소분류 -> 모델 순서로 선택하세요.'

  const canGoBack = hasSearch || Boolean(activeModel) || Boolean(activeLeaf) || Boolean(activeSubcategory)
  const backButtonAriaLabel = canGoBack ? '뒤로가기' : '홈으로'
  const backButtonIconClass = canGoBack ? 'fa-solid fa-arrow-left' : 'fa-solid fa-house'
  const mobilePathText = [activeMajor?.name, activeSubcategory, activeLeaf, activeModel].filter(Boolean).join(' / ') || '카테고리를 선택하세요'

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

  const handleLeafRecordModelClick = (record, modelName) => {
    const majorName = String(record?.major ?? '').trim()
    const subcategory = String(record?.subcategory ?? '').trim()
    const leaf = String(record?.leaf ?? '').trim()
    const model = String(modelName ?? '').trim()
    if (!subcategory || !leaf || !model) return

    const matchedMajorId = majorCategories.find((item) => normalizeLabel(item?.name) === normalizeLabel(majorName))?.id
    if (matchedMajorId) setActiveMajorId(matchedMajorId)
    setActiveSubcategory(subcategory)
    setActiveLeaf(leaf)
    setActiveGroup(null)
    setActiveModel(model)
    setSearch('')
    setIsMajorPanelOpen(false)
    setIsSubPanelOpen(false)
    setIsLeafPanelOpen(false)
    setIsModelPanelOpen(false)
  }

  const handleBack = () => {
    setIsMajorPanelOpen(false)
    setIsSubPanelOpen(false)
    setIsLeafPanelOpen(false)
    setIsModelPanelOpen(false)

    if (hasSearchInput) {
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

  const handleBackOrHome = () => {
    if (canGoBack) {
      handleBack()
      return
    }
    onNavigate?.('home')
  }

  const renderLeafRecordCard = (record) => (
    <article key={record.key} className="rounded-xl border border-slate-300 bg-white p-4 max-[640px]:p-3">
      <p className="m-0 text-[11px] font-bold uppercase tracking-[0.06em] text-[#c83a3a]">
        {record.major} / {record.subcategory} / {record.leaf}
      </p>
      <div className="mt-3 grid gap-4 lg:grid-cols-[280px_1fr_320px]">
        <div className="overflow-hidden rounded-lg border border-slate-300 bg-slate-100">
          {record.thumbnailUrl ? (
            <img
              src={decodeAssetUrl(record.thumbnailUrl)}
              alt={record.leaf}
              className="block h-[220px] w-full object-contain p-3"
              loading="lazy"
            />
          ) : (
            <div className="grid h-[220px] w-full place-items-center text-sm text-slate-500">썸네일 준비중</div>
          )}
        </div>

        <div className="grid content-start gap-3">
          <h4 className="m-0 text-[34px] font-black leading-tight tracking-[-0.01em] text-slate-900 max-[640px]:text-[28px]">{record.leaf}</h4>
          <div className="grid gap-1.5 text-[15px] text-slate-700">
            <p className="m-0">
              <strong>Wattage:</strong> {record.wattage || '정보 없음'}
            </p>
          </div>

          <div>
            <p className="mb-2 mt-0 text-[15px] font-bold text-slate-800">Features</p>
            {Array.isArray(record.features) && record.features.length > 0 ? (
              <ul className="m-0 grid gap-1 pl-5 text-[14px] leading-6 text-slate-700">
                {record.features.map((feature) => (
                  <li key={`${record.key}-${feature}`}>{feature}</li>
                ))}
              </ul>
            ) : (
              <p className="m-0 text-[14px] text-slate-500">등록된 feature 정보가 없습니다.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-300 bg-slate-50 p-3">
          <p className="mb-2 mt-0 text-[15px] font-bold text-slate-800">Model</p>
          {record.modelList.length > 0 ? (
            <div className="flex flex-wrap gap-x-2 gap-y-1.5 text-[14px]">
              {record.modelList.map((item, index) => (
                <button
                  key={`${record.key}-${item.modelName}`}
                  type="button"
                  className="text-left text-slate-700 underline-offset-2 hover:text-[#c02f2f] hover:underline"
                  onClick={() => handleLeafRecordModelClick(record, item.modelName)}
                >
                  {item.modelName}
                  {!hasPdfAsset(item.asset) ? ' (PDF 준비중)' : ''}
                  {index < record.modelList.length - 1 ? ' /' : ''}
                </button>
              ))}
            </div>
          ) : (
            <p className="m-0 text-[14px] text-slate-500">등록된 모델이 없습니다.</p>
          )}
        </div>
      </div>
    </article>
  )

  return (
    <section className={`${isActive ? '' : 'is-hidden'} min-h-[1200px] overflow-x-hidden bg-slate-100 pb-16 max-[640px]:min-h-0 max-[640px]:pb-10`} id="product-page">
      <div className="border-b border-slate-200 bg-white">
        <div className="w-full">
          <div className="product-category-crumb" ref={categoryCrumbRef}>
            <div className="inner max-[640px]:hidden">
              <button type="button" className="home" aria-label={backButtonAriaLabel} onClick={handleBackOrHome}>
                <i className={backButtonIconClass} aria-hidden="true"></i>
              </button>

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
                    {activeSubcategory ?? '중분류 선택'}
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

            <div className="mobile-crumb hidden max-[640px]:block">
              <div className="mobile-crumb-top">
                <button type="button" className="mobile-home" aria-label={backButtonAriaLabel} onClick={handleBackOrHome}>
                  <i className={backButtonIconClass} aria-hidden="true"></i>
                </button>

                <p className="mobile-path" title={mobilePathText}>
                  {mobilePathText}
                </p>
              </div>

              <div className="mobile-tab-bar" role="tablist" aria-label="카테고리 선택 탭">
                <button
                  type="button"
                  className={`mobile-tab ${isMajorPanelOpen ? 'on' : ''}`}
                  aria-expanded={isMajorPanelOpen}
                  aria-controls="mobile-major-panel"
                  onClick={() => {
                    setIsMajorPanelOpen((prev) => !prev)
                    setIsSubPanelOpen(false)
                    setIsLeafPanelOpen(false)
                    setIsModelPanelOpen(false)
                  }}
                >
                  <span className="mobile-tab-text">{activeMajor?.name ?? '상품'}</span>
                </button>

                <button
                  type="button"
                  className={`mobile-tab ${isSubPanelOpen ? 'on' : ''}`}
                  aria-expanded={isSubPanelOpen}
                  aria-controls="mobile-sub-panel"
                  onClick={() => {
                    if (subcategories.length === 0) return
                    setIsSubPanelOpen((prev) => !prev)
                    setIsMajorPanelOpen(false)
                    setIsLeafPanelOpen(false)
                    setIsModelPanelOpen(false)
                  }}
                  disabled={subcategories.length === 0}
                >
                  <span className="mobile-tab-text">{activeSubcategory ?? '중분류 선택'}</span>
                </button>

                <button
                  type="button"
                  className={`mobile-tab ${isLeafPanelOpen ? 'on' : ''}`}
                  aria-expanded={isLeafPanelOpen}
                  aria-controls="mobile-leaf-panel"
                  onClick={() => {
                    if (selectableLeafChips.length === 0) return
                    setIsLeafPanelOpen((prev) => !prev)
                    setIsMajorPanelOpen(false)
                    setIsSubPanelOpen(false)
                    setIsModelPanelOpen(false)
                  }}
                  disabled={selectableLeafChips.length === 0}
                >
                  <span className="mobile-tab-text">{activeLeaf ?? '소분류 선택'}</span>
                </button>

                <button
                  type="button"
                  className={`mobile-tab ${isModelPanelOpen ? 'on' : ''}`}
                  aria-expanded={isModelPanelOpen}
                  aria-controls="mobile-model-panel"
                  onClick={() => {
                    if (modelCards.length === 0) return
                    setIsModelPanelOpen((prev) => !prev)
                    setIsMajorPanelOpen(false)
                    setIsSubPanelOpen(false)
                    setIsLeafPanelOpen(false)
                  }}
                  disabled={modelCards.length === 0}
                >
                  <span className="mobile-tab-text">{activeModel ?? '모델 선택'}</span>
                </button>
              </div>

              {isMajorPanelOpen ? (
                <div className="mobile-tab-panel" id="mobile-major-panel">
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
              ) : null}

              {isSubPanelOpen ? (
                <div className="mobile-tab-panel" id="mobile-sub-panel">
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
              ) : null}

              {isLeafPanelOpen ? (
                <div className="mobile-tab-panel" id="mobile-leaf-panel">
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
              ) : null}

              {isModelPanelOpen ? (
                <div className="mobile-tab-panel" id="mobile-model-panel">
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
              ) : null}
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
              placeholder="상품명/시리즈/그룹 검색 (예: LED, MEDICAL)"
              autoComplete="off"
              spellCheck="false"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button
              type="button"
              className={`h-[34px] rounded-full bg-slate-200 px-3.5 text-xs font-bold text-slate-700 max-[640px]:h-[30px] max-[640px]:px-3 ${hasSearchInput ? '' : 'is-hidden'}`}
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
              searchLeafRecords.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-[18px] py-6">
                  <p className="m-0 text-center text-sm text-slate-500">검색 결과가 없습니다. 다른 키워드로 다시 시도해보세요.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {searchLeafRecords.map((record) => renderLeafRecordCard(record))}
                </div>
              )
            ) : showMajorAggregateView ? (
              <div className="grid gap-3">
                {majorAllLeafRecords.map((record) => renderLeafRecordCard(record))}
              </div>
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
