import { useEffect, useMemo, useRef, useState } from 'react'
import { defaultMajorCategories } from '../data/defaultMajorCategories'
import { findSearchResults, loadLeafModelTreeMap, loadMajorCategories } from '../features/productCatalogService'
import { lockBodyScroll } from '../utils/bodyScrollLock'

const EMPTY_TREE = { byKey: {}, byLeaf: {} }

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
              className="h-11 w-full border-0 bg-transparent px-2 text-sm font-semibold text-slate-800 outline-none placeholder:font-medium placeholder:text-slate-400"
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
            searchResults.length > 0 ? (
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
