import path from 'node:path'
import { promises as fs } from 'node:fs'

const PROJECT_ROOT = process.cwd()
const REFERENCE_DIR = path.join(PROJECT_ROOT, '민웰 참고용')
const REFERENCE_HTML_FILE = path.join(PROJECT_ROOT, '민웰 참고용', 'MEAN WELL Switching Power Supply Manufacturer.html')
const REFERENCE_ASSET_DIR = path.join(REFERENCE_DIR, 'MEAN WELL Switching Power Supply Manufacturer_files')
const PUBLIC_CATALOG_ROOT = path.join(PROJECT_ROOT, 'public', 'catalog', 'meanwell')
const PUBLIC_CATALOG_THUMB_ROOT = path.join(PUBLIC_CATALOG_ROOT, 'thumbnails')
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'src', 'data', 'leafModelTreeFallback.js')

const MAJOR_ORDER = ['ac/dc', 'dc/dc', 'dc/ac', 'ac/ac', 'peripheral accessory', 'automation', 'green energy solutions', 'smart building solutions']

function normalizeLabel(value = '') {
  return String(value ?? '')
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

function normalizeModelKey(value = '') {
  return normalizeLabel(value)
    .replace(/_+\d+$/g, '')
    .replace(/-spec$/g, '')
    .replace(/[^a-z0-9-]+/g, '')
}

function toSlug(value = '') {
  return String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replaceAll('⇄', '-')
    .replaceAll('↔', '-')
    .replaceAll('—', '-')
    .replaceAll('–', '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function stemFromRecord(record = {}) {
  const firstModel = String(Array.isArray(record.models) ? record.models[0] ?? '' : '').trim()
  let stem = toSlug(firstModel).replace(/-spec$/g, '')

  while (/-[a-z]*\d+[a-z]*$/.test(stem)) {
    stem = stem.replace(/-[a-z]*\d+[a-z]*$/, '')
  }

  if (/-[a-z]$/.test(stem) && stem.split('-').length > 1) {
    stem = stem.replace(/-[a-z]$/, '')
  }

  if (!stem) {
    stem = toSlug(String(record.leaf ?? '').replace(/\bseries\b/gi, ''))
  }

  return stem || 'thumbnail'
}

function uniqueThumbnailName(preferredStem, ext, usedNames) {
  const safeExt = ext ? ext.toLowerCase() : '.jpg'
  const stem = preferredStem || 'thumbnail'
  let index = 1
  let candidate = `${stem}${safeExt}`

  while (usedNames.has(candidate.toLowerCase())) {
    index += 1
    candidate = `${stem}-${index}${safeExt}`
  }

  usedNames.add(candidate.toLowerCase())
  return candidate
}

function decodeHtml(text = '') {
  return String(text ?? '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function stripTags(text = '') {
  return decodeHtml(String(text ?? '').replace(/<[^>]*>/g, ''))
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeFeatureText(value = '') {
  return stripTags(value)
    .replace(/\s*:\s*/g, ': ')
    .replace(/\s*-\s*/g, ' - ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function toPublicUrl(absPath) {
  const relative = path.relative(path.join(PROJECT_ROOT, 'public'), absPath).split(path.sep).join('/')
  return `/${relative}`
}

async function walkFiles(rootDir) {
  const files = []
  const stack = [rootDir]

  while (stack.length > 0) {
    const current = stack.pop()
    const entries = await fs.readdir(current, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(full)
        continue
      }
      files.push(full)
    }
  }

  return files
}

async function buildAssetIndex() {
  const index = new Map()

  let files = []
  try {
    files = await walkFiles(PUBLIC_CATALOG_ROOT)
  } catch {
    return index
  }

  files.forEach((fullPath) => {
    const relative = path.relative(PUBLIC_CATALOG_ROOT, fullPath).split(path.sep).join('/').toLowerCase()
    if (relative.startsWith('thumbnails/')) return

    const ext = path.extname(fullPath).toLowerCase()
    if (!['.jpg', '.jpeg', '.png', '.webp', '.pdf'].includes(ext)) return

    const modelName = deriveModelNameFromAssetPath(fullPath)
    const modelKey = normalizeModelKey(modelName)
    if (!modelKey) return

    const item = index.get(modelKey) ?? { model: modelName, imageUrl: '', pdfUrl: '' }
    if (ext === '.pdf') {
      item.pdfUrl = item.pdfUrl || toPublicUrl(fullPath)
    } else {
      item.imageUrl = item.imageUrl || toPublicUrl(fullPath)
    }
    index.set(modelKey, item)
  })

  return index
}

function deriveModelNameFromAssetPath(fullPath) {
  const baseName = path.basename(fullPath, path.extname(fullPath))
  const parentName = path.basename(path.dirname(fullPath))
  const normalizedBase = normalizeLabel(baseName)

  if (normalizedBase === 'spec' || normalizedBase === 'image' || normalizedBase === 'thumbnail' || normalizedBase === 'thumb') {
    return parentName
  }

  return baseName
}

function parseTagMetaMap(htmlText) {
  const tabIdToMajor = new Map()
  const tagIdToMeta = new Map()

  const tabLinkRegex = /<a class="nav-link[^"]*"[^>]*href="[^"#]*#(tab-p[^"]+)"[^>]*>([\s\S]*?)<\/a>/g
  for (const match of htmlText.matchAll(tabLinkRegex)) {
    const tabId = match[1]
    const majorName = stripTags(match[2])
    if (tabId && majorName) tabIdToMajor.set(tabId, majorName)
  }

  const tabPaneRegex = /<div class="tab-pane[^"]*" id="(tab-p[^"]+)"[\s\S]*?>([\s\S]*?)<\/div>/g
  for (const match of htmlText.matchAll(tabPaneRegex)) {
    const tabId = match[1]
    const majorName = tabIdToMajor.get(tabId)
    const paneBody = match[2]
    if (!majorName || !paneBody) continue

    const labelRegex = /<a href="[^"#]*#(tag-[^"]+)" class="label labelSelect[^"]*"[^>]*>([\s\S]*?)<\/a>/g
    for (const label of paneBody.matchAll(labelRegex)) {
      const tagId = label[1]
      const subcategory = stripTags(label[2])
      if (!tagId || !subcategory) continue
      tagIdToMeta.set(tagId, { major: majorName, subcategory })
    }
  }

  return tagIdToMeta
}

function parseReferenceRecords(htmlText) {
  const records = []
  const tagMeta = parseTagMetaMap(htmlText)

  const sectionRegex =
    /<div class="list list-product[^>]*id="(tag-[^"]+)"[\s\S]*?<h3 class="product-title h6">([\s\S]*?)<\/h3>([\s\S]*?)(?=<div class="list list-product|<!--list end-->)/g

  for (const sectionMatch of htmlText.matchAll(sectionRegex)) {
    const tagId = sectionMatch[1]
    const headingText = stripTags(sectionMatch[2])
    const sectionBody = sectionMatch[3] ?? ''
    const meta = tagMeta.get(tagId)

    let major = meta?.major ?? ''
    let subcategory = meta?.subcategory ?? ''

    if (!major || !subcategory) {
      const headingMatch = headingText.match(/^([^>]+)>\s*(.+?)-/)
      if (headingMatch) {
        major = major || headingMatch[1].trim()
        subcategory = subcategory || headingMatch[2].trim()
      }
    }

    if (!major || !subcategory) continue

    const itemRegex = /<div class="list-item"[^>]*>([\s\S]*?)(?=<div class="list-item"|$)/g
    for (const itemMatch of sectionBody.matchAll(itemRegex)) {
      const itemBody = itemMatch[1] ?? ''
      const leaf = stripTags(itemBody.match(/<h4>([\s\S]*?)<\/h4>/)?.[1] ?? '')
      if (!leaf) continue

      const models = []
      const prodRegex = /prod=([^"&]+)"/g
      for (const modelMatch of itemBody.matchAll(prodRegex)) {
        const model = decodeURIComponent(modelMatch[1] ?? '').trim()
        if (!model) continue
        models.push(model)
      }

      const wattage = stripTags(itemBody.match(/<dl class="dl-horizontal">[\s\S]*?<dd>([\s\S]*?)<\/dd>/)?.[1] ?? '')

      const featureBlock = itemBody.match(/<dl class="list">[\s\S]*?<dd>([\s\S]*?)<\/dd>/)?.[1] ?? ''
      const features = []
      const featureRegex = /<li[^>]*>([\s\S]*?)<\/li>/g
      for (const featureMatch of featureBlock.matchAll(featureRegex)) {
        const featureText = normalizeFeatureText(featureMatch[1] ?? '')
        if (featureText) features.push(featureText)
      }

      if (features.length === 0 && featureBlock) {
        const fallbackFeatures = featureBlock
          .split(/<br\s*\/?>/i)
          .map((line) => normalizeFeatureText(line))
          .filter(Boolean)
        features.push(...fallbackFeatures)
      }

      const thumbnailSource = String(
        itemBody.match(/<div class="col pic">[\s\S]*?<img[^>]*src="([^"]+)"/)?.[1] ?? ''
      ).trim()

      records.push({
        major,
        subcategory,
        leaf,
        models: uniqueModels(models),
        wattage,
        features: uniqueFeatures(features),
        thumbnailSource,
      })
    }
  }

  return records
}

function uniqueModels(values) {
  const seen = new Set()
  const output = []
  values.forEach((value) => {
    const model = String(value ?? '').trim()
    const key = normalizeLabel(model)
    if (!model || !key || seen.has(key)) return
    seen.add(key)
    output.push(model)
  })
  return output
}

function uniqueFeatures(values) {
  const seen = new Set()
  const output = []
  values.forEach((value) => {
    const text = String(value ?? '').trim()
    const key = normalizeLabel(text)
    if (!text || !key || seen.has(key)) return
    seen.add(key)
    output.push(text)
  })
  return output
}

function dedupeRecords(records) {
  const byKey = new Map()
  records.forEach((item) => {
    const key = `${normalizeLabel(item.major)}|${normalizeLabel(item.subcategory)}|${normalizeLabel(item.leaf)}`
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, item)
      return
    }

    existing.models = uniqueModels([...(existing.models ?? []), ...(item.models ?? [])])
    existing.features = uniqueFeatures([...(existing.features ?? []), ...(item.features ?? [])])
    if (!existing.wattage && item.wattage) existing.wattage = item.wattage
    if (!existing.thumbnailSource && item.thumbnailSource) existing.thumbnailSource = item.thumbnailSource
  })
  return Array.from(byKey.values())
}

function resolveReferenceAssetPath(src = '') {
  const raw = String(src ?? '').trim()
  if (!raw || /^https?:\/\//i.test(raw)) return ''

  const cleaned = raw
    .replace(/^file:\/\//i, '')
    .replace(/^\.\/+/, '')
    .replace(/^\/+/, '')

  if (cleaned.startsWith('MEAN WELL Switching Power Supply Manufacturer_files/')) {
    const relative = cleaned.replace(/^MEAN WELL Switching Power Supply Manufacturer_files\//, '')
    return path.join(REFERENCE_ASSET_DIR, relative)
  }

  if (cleaned.startsWith('민웰 참고용/')) {
    return path.join(PROJECT_ROOT, cleaned.replace(/^민웰 참고용\//, '민웰 참고용/'))
  }

  return path.join(REFERENCE_DIR, cleaned)
}

async function copyReferenceThumbnails(records) {
  await fs.mkdir(PUBLIC_CATALOG_THUMB_ROOT, { recursive: true })
  const sourceToUrl = new Map()
  const usedNames = new Set()
  let copyCount = 0

  for (const record of records) {
    const sourcePath = resolveReferenceAssetPath(record.thumbnailSource)
    if (!sourcePath) {
      record.thumbnailUrl = ''
      continue
    }

    if (sourceToUrl.has(sourcePath)) {
      record.thumbnailUrl = sourceToUrl.get(sourcePath)
      continue
    }

    const ext = path.extname(sourcePath).toLowerCase() || '.jpg'
    const fileName = uniqueThumbnailName(stemFromRecord(record), ext, usedNames)
    const targetPath = path.join(PUBLIC_CATALOG_THUMB_ROOT, fileName)

    try {
      await fs.copyFile(sourcePath, targetPath)
      copyCount += 1
    } catch {
      record.thumbnailUrl = ''
      continue
    }

    const url = `/catalog/meanwell/thumbnails/${encodeURIComponent(fileName)}`
    sourceToUrl.set(sourcePath, url)
    record.thumbnailUrl = url
  }

  return copyCount
}

function sortRecords(records) {
  return records.sort((a, b) => {
    const majorA = normalizeLabel(a.major)
    const majorB = normalizeLabel(b.major)
    const majorIndexA = MAJOR_ORDER.indexOf(majorA)
    const majorIndexB = MAJOR_ORDER.indexOf(majorB)
    const orderA = majorIndexA === -1 ? Number.MAX_SAFE_INTEGER : majorIndexA
    const orderB = majorIndexB === -1 ? Number.MAX_SAFE_INTEGER : majorIndexB
    if (orderA !== orderB) return orderA - orderB

    const subCompare = a.subcategory.localeCompare(b.subcategory)
    if (subCompare !== 0) return subCompare
    return a.leaf.localeCompare(b.leaf)
  })
}

async function run() {
  const htmlText = await fs.readFile(REFERENCE_HTML_FILE, 'utf8')
  const parsed = parseReferenceRecords(htmlText)
  const deduped = dedupeRecords(parsed)
  const sorted = sortRecords(deduped)
  const copiedThumbnailCount = await copyReferenceThumbnails(sorted)
  const assetIndex = await buildAssetIndex()

  const outputRecords = sorted.map((record) => {
    const models = uniqueModels(record.models)
    const modelAssets = models.map((model) => {
      const asset = assetIndex.get(normalizeModelKey(model)) ?? { imageUrl: '', pdfUrl: '' }
      return { model, imageUrl: asset.imageUrl || '', pdfUrl: asset.pdfUrl || '' }
    })

    const modelAssetsByKey = {}
    modelAssets.forEach((item) => {
      const key = normalizeModelKey(item.model)
      if (!key) return
      modelAssetsByKey[key] = item
    })

    const key = `${record.major}|${record.subcategory}|${record.leaf}`

    return {
      key,
      major: record.major,
      subcategory: record.subcategory,
      leaf: record.leaf,
      groups: [],
      wattage: String(record.wattage ?? '').trim(),
      features: uniqueFeatures(record.features ?? []),
      thumbnailUrl: String(record.thumbnailUrl ?? '').trim(),
      models,
      modelAssets,
      modelAssetsByKey,
    }
  })

  const output = `export const leafModelTreeFallback = ${JSON.stringify(outputRecords, null, 2)}\n`
  await fs.writeFile(OUTPUT_FILE, output, 'utf8')

  const modelCount = outputRecords.reduce((sum, item) => sum + item.models.length, 0)
  console.log(`Generated: ${OUTPUT_FILE}`)
  console.log(`Leaf records: ${outputRecords.length}`)
  console.log(`Model count: ${modelCount}`)
  console.log(`Thumbnail copied: ${copiedThumbnailCount}`)
}

await run()
