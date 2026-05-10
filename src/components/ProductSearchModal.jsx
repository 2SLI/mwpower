import { useEffect, useMemo, useRef, useState } from 'react'
import { defaultMajorCategories } from '../data/defaultMajorCategories'
import { inventoryOptionModelsByBaseKey } from '../data/productInventory'
import { modelOptionWattageMap } from '../data/modelOptionWattageMap'
import { findSearchResults, loadLeafModelTreeMap, loadMajorCategories, normalizeLabel } from '../features/productCatalogService'
import { lockBodyScroll } from '../utils/bodyScrollLock'

const EMPTY_TREE = { byKey: {}, byLeaf: {} }

function getSingleSearchToken(value = '') {
  const tokens = String(value ?? '')
    .split(/[,\uFF0C]/)
    .map((token) => String(token ?? '').trim())
    .filter(Boolean)

  return tokens.length === 1 ? tokens[0] : ''
}

export function ProductSearchModal({ isOpen, onClose, onSelectKeyword }) {
  const [majorCategories, setMajorCategories] = useState(defaultMajorCategories)
  const [leafTreeMap, setLeafTreeMap] = useState(EMPTY_TREE)
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    let alive = true

    ;(async () => {
      const [majorResult, treeResult] = await Promise.all([loadMajorCategories(), loadLeafModelTreeMap()])
      if (!alive) return
      setMajorCategories(majorResult.categories.length > 0 ? majorResult.categories : defaultMajorCategories)
      setLeafTreeMap(treeResult.treeMap)
    })()

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return undefined

    const releaseBodyScrollLock = lockBodyScroll()
    const timer = setTimeout(() => inputRef.current?.focus(), 30)

    return () => {
      clearTimeout(timer)
      releaseBodyScrollLock()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return undefined

    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose?.()
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const trimmedQuery = query.trim()
  const singleSearchToken = getSingleSearchToken(trimmedQuery)

  const majorIdByName = useMemo(
    () =>
      majorCategories.reduce((acc, item) => {
        const id = String(item?.id ?? '').trim()
        const nameKey = normalizeLabel(item?.name)
        if (!id || !nameKey || acc[nameKey]) return acc
        acc[nameKey] = id
        return acc
      }, {}),
    [majorCategories]
  )

  const modelRouteIndex = useMemo(() => {
    const routesByModelKey = {}
    const baseRouteByKey = {}

    const registerModelRoute = (modelName, route) => {
      const model = String(modelName ?? '').trim()
      const key = normalizeLabel(model)
      if (!model || !key) return
      if (!routesByModelKey[key]) routesByModelKey[key] = { ...route, model, optionModel: '' }
      if (!baseRouteByKey[key]) baseRouteByKey[key] = { ...route, model, optionModel: '' }
    }

    Object.values(leafTreeMap?.byKey ?? {}).forEach((record) => {
      const majorName = String(record?.major ?? '').trim()
      const majorNameKey = normalizeLabel(majorName)
      const subcategory = String(record?.subcategory ?? '').trim()
      const leaf = String(record?.leaf ?? '').trim()
      if (!majorNameKey || !subcategory || !leaf) return

      const routeBase = {
        majorId: majorIdByName[majorNameKey] ?? '',
        subcategory,
        leaf,
        groupName: null,
      }

      if (Array.isArray(record?.groups) && record.groups.length > 1) {
        record.groups.forEach((group) => {
          const groupName = String(group?.name ?? '').trim()
          const models = Array.isArray(group?.models) ? group.models : []
          models.forEach((modelName) => registerModelRoute(modelName, { ...routeBase, groupName: groupName || null }))
        })
        return
      }

      const models = Array.isArray(record?.models) ? record.models : []
      models.forEach((modelName) => registerModelRoute(modelName, routeBase))
    })

    Object.entries(modelOptionWattageMap).forEach(([baseModelKey, options]) => {
      const normalizedBaseKey = normalizeLabel(baseModelKey)
      const baseRoute = baseRouteByKey[normalizedBaseKey]
      if (!baseRoute || !Array.isArray(options)) return

      options.forEach((item) => {
        const optionModel = String(item?.model ?? '').trim()
        const optionKey = normalizeLabel(optionModel)
        if (!optionKey || routesByModelKey[optionKey]) return

        routesByModelKey[optionKey] = {
          ...baseRoute,
          optionModel,
        }
      })
    })

    Object.entries(inventoryOptionModelsByBaseKey).forEach(([baseModelKey, optionModels]) => {
      const normalizedBaseKey = normalizeLabel(baseModelKey)
      const baseRoute = baseRouteByKey[normalizedBaseKey]
      if (!baseRoute || !Array.isArray(optionModels)) return

      optionModels.forEach((optionModelName) => {
        const optionModel = String(optionModelName ?? '').trim()
        const optionKey = normalizeLabel(optionModel)
        if (!optionKey || routesByModelKey[optionKey]) return

        routesByModelKey[optionKey] = {
          ...baseRoute,
          optionModel,
        }
      })
    })

    return routesByModelKey
  }, [leafTreeMap, majorIdByName])

  const modelShortcutList = useMemo(() => {
    const tokenKey = normalizeLabel(singleSearchToken)
    if (!tokenKey) return []

    return Object.entries(modelRouteIndex)
      .filter(([modelKey]) => modelKey.includes(tokenKey) || tokenKey.startsWith(`${modelKey}-`))
      .map(([modelKey, route]) => ({
        modelKey,
        displayModel: String(route.optionModel || route.model || '').toUpperCase(),
      }))
      .sort((a, b) => {
        const aExact = a.modelKey === tokenKey ? 0 : 1
        const bExact = b.modelKey === tokenKey ? 0 : 1
        if (aExact !== bExact) return aExact - bExact

        const aStarts = a.modelKey.startsWith(tokenKey) ? 0 : 1
        const bStarts = b.modelKey.startsWith(tokenKey) ? 0 : 1
        if (aStarts !== bStarts) return aStarts - bStarts

        const aLen = a.modelKey.length
        const bLen = b.modelKey.length
        if (aLen !== bLen) return aLen - bLen

        return a.displayModel.localeCompare(b.displayModel, undefined, { numeric: true, sensitivity: 'base' })
      })
      .slice(0, 8)
  }, [singleSearchToken, modelRouteIndex])

  const searchResults = useMemo(() => {
    if (!trimmedQuery) return []
    return findSearchResults(majorCategories, trimmedQuery, leafTreeMap, 20)
  }, [trimmedQuery, majorCategories, leafTreeMap])

  const quickKeywords = useMemo(() => majorCategories.slice(0, 8).map((item) => item.name), [majorCategories])

  if (!isOpen) return null

  const handleSelect = (keyword) => {
    const value = String(keyword ?? '').trim()
    if (!value) return
    onSelectKeyword?.(value)
    onClose?.()
  }

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/35 px-3 pt-20 backdrop-blur-[1px] max-[640px]:pt-16"
      role="dialog"
      aria-modal="true"
      aria-label="상품 검색"
      onClick={onClose}
    >
      <div
        className="mx-auto w-full max-w-[780px] overflow-hidden rounded-2xl border border-[#e7b7bd] bg-white shadow-[0_18px_40px_rgba(186,38,48,0.2)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="bg-[#c9252f] px-4 py-3.5 text-white">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="m-0 text-xl font-black tracking-[-0.02em]">상품 찾기</h2>
              <p className="mb-0 mt-1 text-xs font-semibold text-white/90">시리즈명 또는 모델명을 입력하세요.</p>
            </div>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/70 bg-white text-[#c9252f] transition hover:bg-[#fff3f4]"
              onClick={onClose}
              aria-label="닫기"
            >
              <span className="text-lg leading-none">×</span>
            </button>
          </div>
        </header>

        <div className="border-b border-[#f2c8cd] bg-white px-4 py-3">
          <label className="sr-only" htmlFor="header-product-search">상품 검색</label>
          <div className="flex items-center rounded-xl border border-[#e9b4bb] bg-white px-3 focus-within:border-[#cb2c37] focus-within:shadow-[0_0_0_2px_#f7d8dc]">
            <i className="fa-solid fa-magnifying-glass text-sm text-[#c9252f]" aria-hidden="true"></i>
            <input
              id="header-product-search"
              ref={inputRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="시리즈/모델명 검색 (예: RS-35)"
              className="h-11 w-full border-0 bg-transparent px-2 text-sm font-semibold text-slate-800 outline-none placeholder:font-medium placeholder:text-slate-400 max-[640px]:text-base"
            />
            {trimmedQuery ? (
              <button
                type="button"
                className="rounded-full border border-[#e8b2b9] bg-white px-2.5 py-1 text-[11px] font-bold text-[#c9252f] transition hover:bg-[#fff3f4]"
                onClick={() => setQuery('')}
              >
                지우기
              </button>
            ) : null}
          </div>
        </div>

        <div className="max-h-[58vh] overflow-y-auto bg-white px-4 py-3.5">
          {trimmedQuery ? (
            modelShortcutList.length > 0 || searchResults.length > 0 ? (
              <div className="grid gap-3">
                {modelShortcutList.length > 0 ? (
                  <div className="rounded-xl border border-[#efc9cf] bg-[#fff8f9] px-3.5 py-3">
                    <p className="mb-2 mt-0 text-[12px] font-black uppercase tracking-[0.06em] text-[#b22b37]">바로가기</p>
                    <div className="flex flex-wrap gap-2">
                      {modelShortcutList.map((shortcut) => (
                        <button
                          key={`${shortcut.modelKey}-${shortcut.displayModel}`}
                          type="button"
                          className="rounded-full border border-[#d9a0a8] bg-white px-3 py-1.5 text-[12px] font-bold uppercase text-[#b52c37] transition hover:border-[#c9252f] hover:bg-[#fff3f4] hover:text-[#c9252f]"
                          onClick={() => handleSelect(shortcut.displayModel)}
                        >
                          {shortcut.displayModel}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {searchResults.length > 0 ? (
                  <ul className="m-0 grid list-none gap-2.5 p-0">
                    {searchResults.map((result) => (
                      <li key={`${result.majorId}-${result.subcategory}-${result.leafChip}-${result.groupName}-${result.name}`}>
                        <button
                          type="button"
                          className="grid w-full gap-1 rounded-xl border border-[#efc9cf] bg-white px-3.5 py-2.5 text-left transition hover:border-[#cb2c37] hover:bg-[#fff7f8]"
                          onClick={() => handleSelect(result.name)}
                        >
                          <strong className="text-sm font-extrabold text-slate-800">{result.name}</strong>
                          <span className="text-xs font-semibold text-[#a53a45]">{result.context}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#e5adb5] bg-white px-3 py-8 text-center text-sm font-semibold text-[#a53a45]">
                검색 결과가 없습니다.
              </div>
            )
          ) : (
            <div className="grid gap-3">
              <p className="m-0 text-xs font-black uppercase tracking-[0.08em] text-[#b32a35]">빠른 검색</p>
              <div className="flex flex-wrap gap-2">
                {quickKeywords.map((keyword) => (
                  <button
                    key={keyword}
                    type="button"
                    className="rounded-full border border-[#d9a0a8] bg-white px-3.5 py-1.5 text-xs font-bold text-[#b52c37] transition hover:border-[#c9252f] hover:bg-[#fff3f4] hover:text-[#c9252f]"
                    onClick={() => handleSelect(keyword)}
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
