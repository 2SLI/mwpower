import { useMemo } from 'react'
import { buildSearchKeywords, getSingleSearchToken } from '../productViewUtils'

export function useProductSearchShortcuts({ catalogModel, modelRouteIndex, search }) {
  const searchInput = String(search ?? '').trim()
  const singleSearchToken = getSingleSearchToken(searchInput)
  const searchKeywords = buildSearchKeywords(searchInput)
  const hasSearch = searchKeywords.length > 0
  const modelShortcutList = useMemo(
    () => catalogModel.getModelShortcuts({ singleSearchToken, modelRouteIndex }),
    [catalogModel, singleSearchToken, modelRouteIndex]
  )

  return {
    searchInput,
    singleSearchToken,
    searchKeywords,
    hasSearch,
    modelShortcutList,
  }
}
