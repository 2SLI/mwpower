import { defaultMajorCategories } from '../data/defaultMajorCategories'
import { folderCatalogManifest } from '../data/folderCatalogManifest'
import { leafModelTreeFallback } from '../data/leafModelTreeFallback'

export const iconByMajor = {
  'AC/DC': 'fa-bolt',
  'DC/DC': 'fa-battery-half',
  'DC/AC': 'fa-plug-circle-bolt',
  'AC/AC': 'fa-wave-square',
  'Peripheral Accessory': 'fa-puzzle-piece',
  Automation: 'fa-gears',
  'Green Energy Solutions': 'fa-leaf',
  'Smart Building Solutions': 'fa-building',
}

const leafChipIndex = buildLeafChipIndex(folderCatalogManifest)

export async function loadMajorCategories() {
  return { categories: defaultMajorCategories, source: 'local' }
}

export async function loadLeafModelTreeMap() {
  const byKey = {}
  const byLeaf = {}

  leafModelTreeFallback
    .map((record) => normalizeLeafTreeRecord(record))
    .filter(Boolean)
    .forEach((record) => {
      byKey[record.key] = record
      if (!byLeaf[normalizeLabel(record.leaf)]) byLeaf[normalizeLabel(record.leaf)] = record
    })

  return { treeMap: { byKey, byLeaf }, source: 'local' }
}

export function getLeafChips(majorName, subcategoryName, { includeFallback = true } = {}) {
  if (!subcategoryName) return []

  const key = [majorName, subcategoryName].map((value) => normalizeLabel(value)).join('|')
  const fromManifest = leafChipIndex[key] ?? []

  if (fromManifest.length > 0) return fromManifest
  if (!includeFallback) return []
  return [subcategoryName]
}

export function getLeafView({ majorName, subcategoryName, leafName, treeMap }) {
  const treeRecord = getLeafTreeRecord({ majorName, subcategoryName, leafName, treeMap })
  const catalogModels = getCatalogModels(getLeafCatalog(majorName, subcategoryName, leafName).entries)
  const modelAssetsByKey = treeRecord?.modelAssetsByKey ?? {}

  if (treeRecord?.groups?.length > 1) {
    const totalModelCount = treeRecord.groups.reduce((sum, group) => sum + group.models.length, 0)
    return {
      groups: treeRecord.groups,
      models: [],
      totalModelCount,
      modelAssetsByKey,
    }
  }

  const models = uniqueModels([...(treeRecord?.models ?? []), ...catalogModels])

  return {
    groups: [],
    models,
    totalModelCount: models.length,
    modelAssetsByKey,
  }
}

export function getModelAssetByModel(modelAssetsByKey, modelName) {
  const key = normalizeModelKey(modelName)
  if (!key) return null
  return modelAssetsByKey?.[key] ?? null
}

export function getLeafModelHints({ majorName, subcategoryName, leafName, treeMap, limit = 4 }) {
  const leafView = getLeafView({ majorName, subcategoryName, leafName, treeMap })
  if (leafView.groups.length > 1) {
    return leafView.groups.flatMap((group) => group.models).slice(0, limit)
  }
  return leafView.models.slice(0, limit)
}

export function findSearchResults(categories, queryText, treeMap, limit = 120) {
  const queryValue = normalizeLabel(queryText)
  if (!queryValue) return []

  const results = []
  const seen = new Set()

  categories.forEach((major) => {
    const majorId = major.id
    const majorName = major.name
    const subcategories = Array.isArray(major.subcategories) ? major.subcategories : []

    pushSearchResult({
      results,
      seen,
      key: `major:${majorId}`,
      match: matchesSearch(majorName, queryValue),
      payload: {
        majorId,
        majorName,
        subcategory: subcategories[0] ?? '',
        leafChip: '',
        groupName: '',
        name: majorName,
        context: 'Major category',
      },
    })

    subcategories.forEach((subcategory) => {
      pushSearchResult({
        results,
        seen,
        key: `sub:${majorId}:${normalizeLabel(subcategory)}`,
        match: matchesSearch(subcategory, queryValue),
        payload: {
          majorId,
          majorName,
          subcategory,
          leafChip: '',
          groupName: '',
          name: subcategory,
          context: `${majorName} category`,
        },
      })

      const leafChips = getLeafChips(majorName, subcategory, { includeFallback: false })
      leafChips.forEach((leafChip) => {
        const leafView = getLeafView({ majorName, subcategoryName: subcategory, leafName: leafChip, treeMap })

        pushSearchResult({
          results,
          seen,
          key: `leaf:${majorId}:${normalizeLabel(subcategory)}:${normalizeLabel(leafChip)}`,
          match: matchesSearch(leafChip, queryValue),
          payload: {
            majorId,
            majorName,
            subcategory,
            leafChip,
            groupName: '',
            name: leafChip,
            context: `${majorName} / ${subcategory}`,
          },
        })

        leafView.groups.forEach((group) => {
          pushSearchResult({
            results,
            seen,
            key: `group:${majorId}:${normalizeLabel(subcategory)}:${normalizeLabel(leafChip)}:${normalizeLabel(group.name)}`,
            match: matchesSearch(group.name, queryValue),
            payload: {
              majorId,
              majorName,
              subcategory,
              leafChip,
              groupName: group.name,
              name: group.name,
              context: `${majorName} / ${subcategory} / ${leafChip}`,
            },
          })

          group.models.forEach((modelName) => {
            pushSearchResult({
              results,
              seen,
              key: `model:${majorId}:${normalizeLabel(subcategory)}:${normalizeLabel(leafChip)}:${normalizeLabel(group.name)}:${normalizeLabel(modelName)}`,
              match: matchesSearch(modelName, queryValue),
              payload: {
                majorId,
                majorName,
                subcategory,
                leafChip,
                groupName: group.name,
                name: modelName,
                context: `${majorName} / ${subcategory} / ${leafChip} / ${group.name}`,
              },
            })
          })
        })

        leafView.models.forEach((modelName) => {
          pushSearchResult({
            results,
            seen,
            key: `model:${majorId}:${normalizeLabel(subcategory)}:${normalizeLabel(leafChip)}:${normalizeLabel(modelName)}`,
            match: matchesSearch(modelName, queryValue),
            payload: {
              majorId,
              majorName,
              subcategory,
              leafChip,
              groupName: '',
              name: modelName,
              context: `${majorName} / ${subcategory} / ${leafChip}`,
            },
          })
        })
      })
    })
  })

  return results.slice(0, limit)
}

export function findMatchingLabel(values, target) {
  if (!target || values.length === 0) return null
  const normalizedTarget = normalizeLabel(target)
  return values.find((value) => normalizeLabel(value) === normalizedTarget) ?? null
}

export function normalizeLabel(value = '') {
  const text = typeof value === 'string' ? value : String(value ?? '')
  return text
    .normalize('NFKC')
    .replaceAll('⇄', '/')
    .replaceAll('↔', '/')
    .replaceAll('—', '-')
    .replaceAll('–', '-')
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}
function pushSearchResult({ results, seen, key, match, payload }) {
  if (!match || seen.has(key)) return
  results.push(payload)
  seen.add(key)
}

function getLeafTreeRecord({ majorName, subcategoryName, leafName, treeMap }) {
  const key = normalizeLeafTreeKey([majorName, subcategoryName, leafName].map((value) => normalizeLabel(value)).join('|'))
  if (treeMap.byKey[key]) return treeMap.byKey[key]
  return treeMap.byLeaf[normalizeLabel(leafName)] ?? null
}

function getLeafCatalog(majorName, subcategoryName, leafName) {
  const key = [majorName, subcategoryName, leafName].map((value) => normalizeLabel(value)).join('|')
  return folderCatalogManifest[key] ?? { labels: { major: majorName, subcategory: subcategoryName, leaf: leafName }, entries: [] }
}

function getCatalogModels(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return []

  const models = []
  entries.forEach((entry) => {
    if (Array.isArray(entry?.modelPreview) && entry.modelPreview.length > 0) {
      models.push(...entry.modelPreview)
      return
    }

    if (entry?.productName) {
      models.push(entry.productName)
      return
    }

    if (entry?.seriesName) {
      models.push(entry.seriesName)
    }
  })

  return uniqueModels(models)
}

function normalizeLeafTreeRecord(record) {
  if (!record || typeof record !== 'object') return null

  const major = String(record.major ?? '').trim()
  const subcategory = String(record.subcategory ?? '').trim()
  const leaf = String(record.leaf ?? '').trim()
  const rawKey = String(record.key ?? [major, subcategory, leaf].map((value) => normalizeLabel(value)).join('|')).trim()
  const key = normalizeLeafTreeKey(rawKey)

  if (!key || !leaf) return null

  const groups = []
  const groupSeen = new Set()

  if (Array.isArray(record.groups)) {
    record.groups.forEach((group) => {
      const name = String(group?.name ?? '').trim()
      const normalizedName = normalizeLabel(name)
      if (!name || !normalizedName || groupSeen.has(normalizedName)) return

      const models = uniqueModels(Array.isArray(group?.models) ? group.models : [])
      if (models.length === 0) return

      groupSeen.add(normalizedName)
      groups.push({ name, models })
    })
  }

  const models = uniqueModels(Array.isArray(record.models) ? record.models : [])
  const modelAssetsByKey = normalizeModelAssetsByKey(record)

  if (groups.length <= 1) {
    return {
      key,
      major,
      subcategory,
      leaf,
      groups: [],
      models: uniqueModels([...models, ...groups.flatMap((group) => group.models)]),
      modelAssetsByKey,
    }
  }

  return { key, major, subcategory, leaf, groups, models, modelAssetsByKey }
}

function normalizeLeafTreeKey(key) {
  return String(key ?? '')
    .split('|')
    .map((value) => normalizeLabel(value))
    .join('|')
}

function uniqueModels(values) {
  const unique = []
  const seen = new Set()

  values.forEach((value) => {
    const model = String(value ?? '').trim()
    const key = normalizeLabel(model)
    if (!model || !key || seen.has(key)) return
    seen.add(key)
    unique.push(model)
  })

  return unique
}

function matchesSearch(value, normalizedQuery) {
  return normalizeLabel(value).includes(normalizedQuery)
}

function normalizeModelKey(value = '') {
  return normalizeLabel(value)
    .replace(/_+\d+$/g, '')
    .replace(/-spec$/g, '')
    .replace(/[^a-z0-9-]+/g, '')
}

function normalizeModelAssetsByKey(record) {
  const output = {}
  const source = record?.modelAssetsByKey

  if (source && typeof source === 'object') {
    Object.values(source).forEach((item) => {
      const model = String(item?.model ?? '').trim()
      const key = normalizeModelKey(model)
      if (!model || !key) return
      output[key] = {
        model,
        imageUrl: String(item?.imageUrl ?? '').trim(),
        pdfUrl: String(item?.pdfUrl ?? '').trim(),
      }
    })
  }

  if (Array.isArray(record?.modelAssets)) {
    record.modelAssets.forEach((item) => {
      const model = String(item?.model ?? '').trim()
      const key = normalizeModelKey(model)
      if (!model || !key || output[key]) return
      output[key] = {
        model,
        imageUrl: String(item?.imageUrl ?? '').trim(),
        pdfUrl: String(item?.pdfUrl ?? '').trim(),
      }
    })
  }

  return output
}

function buildLeafChipIndex(manifest) {
  const index = {}

  Object.values(manifest).forEach((record) => {
    const labels = record?.labels
    if (!labels?.major || !labels?.subcategory || !labels?.leaf) return

    const key = [labels.major, labels.subcategory].map((value) => normalizeLabel(value)).join('|')
    if (!index[key]) index[key] = []

    const alreadyExists = index[key].some((chip) => normalizeLabel(chip) === normalizeLabel(labels.leaf))
    if (!alreadyExists) index[key].push(labels.leaf)
  })

  return index
}
