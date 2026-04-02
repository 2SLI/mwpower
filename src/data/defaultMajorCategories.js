import { leafModelTreeFallback } from './leafModelTreeFallback.js'
import { folderCatalogManifest } from './folderCatalogManifest.js'

const MAJOR_ORDER = [
  'AC/DC',
  'DC/DC',
  'DC/AC',
  'AC/AC',
  'Peripheral Accessory',
  'Automation',
  'Green Energy Solutions',
  'Smart Building Solutions',
]

function normalizeKey(value = '') {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function toId(value = '') {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function buildMajorCategoriesFromRecords(records) {
  const majorMap = new Map()

  records.forEach((record) => {
    const major = String(record?.major ?? '').trim()
    const subcategory = String(record?.subcategory ?? '').trim()
    if (!major || !subcategory) return

    const majorKey = normalizeKey(major)
    if (!majorMap.has(majorKey)) {
      majorMap.set(majorKey, {
        id: toId(major),
        name: major,
        subcategories: [],
        subcategorySet: new Set(),
      })
    }

    const majorItem = majorMap.get(majorKey)
    const subKey = normalizeKey(subcategory)
    if (majorItem.subcategorySet.has(subKey)) return

    majorItem.subcategorySet.add(subKey)
    majorItem.subcategories.push(subcategory)
  })

  const categories = Array.from(majorMap.values())
    .filter((item) => item.subcategories.length > 0)
    .map((item) => ({
      id: item.id,
      name: item.name,
      subcategories: item.subcategories,
    }))

  categories.sort((a, b) => {
    const aIndex = MAJOR_ORDER.findIndex((name) => normalizeKey(name) === normalizeKey(a.name))
    const bIndex = MAJOR_ORDER.findIndex((name) => normalizeKey(name) === normalizeKey(b.name))
    const aOrder = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex
    const bOrder = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex
    if (aOrder !== bOrder) return aOrder - bOrder
    return a.name.localeCompare(b.name)
  })

  return categories
}

function buildRecordsFromManifest() {
  return Object.values(folderCatalogManifest).map((record) => ({
    major: record?.labels?.major,
    subcategory: record?.labels?.subcategory,
  }))
}

const fromLeafTree = buildMajorCategoriesFromRecords(leafModelTreeFallback)

export const defaultMajorCategories =
  fromLeafTree.length > 0 ? fromLeafTree : buildMajorCategoriesFromRecords(buildRecordsFromManifest())
