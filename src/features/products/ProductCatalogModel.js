import {
  compareLeafRecordsByInventory,
  compareModelCardsByInventory,
  getInventorySortRank,
} from '../inventory/inventoryUtils'
import { getModelAssetByModel, normalizeLabel } from '../productCatalogService'
import { hasPdfAsset } from './productViewUtils'

export class ProductCatalogModel {
  constructor({ leafTreeMap, majorCategories, inventoryContext }) {
    this.leafTreeMap = leafTreeMap
    this.majorCategories = majorCategories
    this.inventoryContext = inventoryContext
    this.majorIdByName = this.createMajorIdByName()
  }

  createMajorIdByName() {
    return this.majorCategories.reduce((acc, item) => {
      const id = String(item?.id ?? '').trim()
      const nameKey = normalizeLabel(item?.name)
      if (!id || !nameKey || acc[nameKey]) return acc
      acc[nameKey] = id
      return acc
    }, {})
  }

  getRecordModelNames(record) {
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

  toModelCards(models = [], modelAssetsByKey) {
    return models
      .map((modelName) => ({
        modelName,
        asset: getModelAssetByModel(modelAssetsByKey, modelName),
      }))
      .sort((a, b) => compareModelCardsByInventory(a, b, this.inventoryContext))
  }

  toLeafCardRecord(record, modelNames = this.getRecordModelNames(record)) {
    const modelList = this.toModelCards(modelNames, record?.modelAssetsByKey)

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

  buildRouteIndex() {
    const routesByModelKey = {}
    const baseRouteByKey = {}

    const registerModelRoute = (modelName, route) => {
      const model = String(modelName ?? '').trim()
      const key = normalizeLabel(model)
      if (!model || !key) return
      if (!routesByModelKey[key]) routesByModelKey[key] = { ...route, model, optionModel: '' }
      if (!baseRouteByKey[key]) baseRouteByKey[key] = { ...route, model, optionModel: '' }
    }

    Object.values(this.leafTreeMap?.byKey ?? {}).forEach((record) => {
      const majorName = String(record?.major ?? '').trim()
      const majorNameKey = normalizeLabel(majorName)
      const subcategory = String(record?.subcategory ?? '').trim()
      const leaf = String(record?.leaf ?? '').trim()
      if (!majorNameKey || !subcategory || !leaf) return

      const routeBase = {
        majorId: this.majorIdByName[majorNameKey] ?? '',
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

    this.registerOptionRoutes(routesByModelKey, baseRouteByKey, this.inventoryContext.modelOptionWattageMap)
    this.registerInventoryOptionRoutes(routesByModelKey, baseRouteByKey)

    return routesByModelKey
  }

  registerOptionRoutes(routesByModelKey, baseRouteByKey, optionMap) {
    Object.entries(optionMap).forEach(([baseModelKey, options]) => {
      const baseRoute = baseRouteByKey[normalizeLabel(baseModelKey)]
      if (!baseRoute || !Array.isArray(options)) return

      options.forEach((item) => {
        const optionModel = String(item?.model ?? '').trim()
        const optionKey = normalizeLabel(optionModel)
        if (!optionKey || routesByModelKey[optionKey]) return
        routesByModelKey[optionKey] = { ...baseRoute, optionModel }
      })
    })
  }

  registerInventoryOptionRoutes(routesByModelKey, baseRouteByKey) {
    Object.entries(this.inventoryContext.optionModelsByBaseKey).forEach(([baseModelKey, optionModels]) => {
      const baseRoute = baseRouteByKey[normalizeLabel(baseModelKey)]
      if (!baseRoute || !Array.isArray(optionModels)) return

      optionModels.forEach((optionModelName) => {
        const optionModel = String(optionModelName ?? '').trim()
        const optionKey = normalizeLabel(optionModel)
        if (!optionKey || routesByModelKey[optionKey]) return
        routesByModelKey[optionKey] = { ...baseRoute, optionModel }
      })
    })
  }

  getMajorLeafRecords({ activeMajor, activeSubcategory, hasSearch, activeLeaf }) {
    if (!activeMajor || hasSearch || activeLeaf) return []

    return Object.values(this.leafTreeMap?.byKey ?? {})
      .filter((record) => {
        const isMajorMatched = normalizeLabel(record?.major) === normalizeLabel(activeMajor.name)
        if (!isMajorMatched) return false
        if (!activeSubcategory) return true
        return normalizeLabel(record?.subcategory) === normalizeLabel(activeSubcategory)
      })
      .map((record) => this.toLeafCardRecord(record))
      .sort((a, b) => compareLeafRecordsByInventory(a, b, this.inventoryContext))
  }

  getSearchLeafRecords({ hasSearch, searchKeywords }) {
    if (!hasSearch) return []

    return Object.values(this.leafTreeMap?.byKey ?? {})
      .reduce((acc, record) => {
        const models = this.getRecordModelNames(record)
        const groups = Array.isArray(record?.groups) ? record.groups.map((group) => String(group?.name ?? '').trim()) : []
        const texts = [record?.major, record?.subcategory, record?.leaf, ...groups, ...models].map((text) => String(text ?? ''))
        const isMatched = texts.some((text) => {
          const normalizedText = normalizeLabel(text)
          return searchKeywords.some((keyword) => normalizedText.includes(keyword))
        })
        if (isMatched) acc.push(this.toLeafCardRecord(record, models))
        return acc
      }, [])
      .sort((a, b) => compareLeafRecordsByInventory(a, b, this.inventoryContext))
  }

  getModelShortcuts({ singleSearchToken, modelRouteIndex }) {
    const tokenKey = normalizeLabel(singleSearchToken)
    if (!tokenKey) return []

    return Object.entries(modelRouteIndex)
      .filter(([modelKey]) => modelKey.includes(tokenKey) || tokenKey.startsWith(`${modelKey}-`))
      .map(([modelKey, route]) => ({
        modelKey,
        majorId: route.majorId,
        subcategory: route.subcategory,
        leaf: route.leaf,
        groupName: route.groupName,
        model: route.model,
        optionModel: route.optionModel,
        displayModel: String(route.optionModel || route.model || '').toUpperCase(),
      }))
      .sort((a, b) => this.compareShortcut(a, b, tokenKey))
      .slice(0, 8)
  }

  compareShortcut(a, b, tokenKey) {
    const aExact = a.modelKey === tokenKey ? 0 : 1
    const bExact = b.modelKey === tokenKey ? 0 : 1
    if (aExact !== bExact) return aExact - bExact

    const aStarts = a.modelKey.startsWith(tokenKey) ? 0 : 1
    const bStarts = b.modelKey.startsWith(tokenKey) ? 0 : 1
    if (aStarts !== bStarts) return aStarts - bStarts

    const stockRank = getInventorySortRank(a.displayModel, this.inventoryContext) - getInventorySortRank(b.displayModel, this.inventoryContext)
    if (stockRank !== 0) return stockRank

    if (a.modelKey.length !== b.modelKey.length) return a.modelKey.length - b.modelKey.length
    return a.displayModel.localeCompare(b.displayModel, undefined, { numeric: true, sensitivity: 'base' })
  }
}
