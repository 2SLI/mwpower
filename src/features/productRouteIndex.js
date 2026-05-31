import { inventoryOptionModelsByBaseKey } from '../data/productInventory'
import { modelOptionWattageMap } from '../data/modelOptionWattageMap'
import { normalizeLabel } from './productCatalogService'

export function buildMajorIdByName(majorCategories = []) {
  return majorCategories.reduce((acc, item) => {
    const id = String(item?.id ?? '').trim()
    const nameKey = normalizeLabel(item?.name)
    if (!id || !nameKey || acc[nameKey]) return acc
    acc[nameKey] = id
    return acc
  }, {})
}

export function buildModelRouteIndex(leafTreeMap = {}, majorIdByName = {}) {
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
}

export function toProductRouteShortcut(modelKey, route = {}) {
  return {
    modelKey,
    majorId: route.majorId,
    subcategory: route.subcategory,
    leaf: route.leaf,
    groupName: route.groupName,
    model: route.model,
    optionModel: route.optionModel,
    displayModel: String(route.optionModel || route.model || '').toUpperCase(),
  }
}
