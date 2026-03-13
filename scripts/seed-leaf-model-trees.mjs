import { promises as fs } from 'node:fs'
import path from 'node:path'
import { initializeApp } from 'firebase/app'
import { doc, getFirestore, writeBatch } from 'firebase/firestore'
import { folderCatalogManifest } from '../src/data/folderCatalogManifest.js'
import { leafModelTreeFallback } from '../src/data/leafModelTreeFallback.js'

const firebaseConfig = {
  apiKey: 'AIzaSyB6HRLq6vFlBy7uvuMpd-VeKKdyKN4abY4',
  authDomain: 'meanwellpower-103ae.firebaseapp.com',
  projectId: 'meanwellpower-103ae',
  storageBucket: 'meanwellpower-103ae.firebasestorage.app',
  messagingSenderId: '459112128979',
  appId: '1:459112128979:web:dc0782d0d6c64318588f26',
}

const COLLECTION = 'leafModelTrees'
const projectRoot = process.cwd()
const DEFAULT_REFERENCE_HTML_PATH = path.join(projectRoot, 'public', 'meanwell', '민웰카테고리 참고용', 'MEAN WELL Switching Power Supply Manufacturer.htm')
const BATCH_LIMIT = 400
const LEAF_ALIAS_MAP = new Map([
  ['a301_302 series', 'a301/302 series'],
  ['ac↔dc green bidirectional power', 'ac/dc green bidirectional power'],
])

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

function canonicalLeafLabel(value = '') {
  return normalizeLabel(value)
    .replace(/(\d)_(\d)/g, '$1/$2')
    .replace(/([a-z])_([a-z])/g, '$1/$2')
    .replace(/\(.*?\)/g, '')
    .replace(/\bseries\b/g, '')
    .replace(/[^\w/-]+/g, '')
}

function stripTags(value = '') {
  return String(value ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function cleanGroupName(value = '') {
  return stripTags(value).replace(/[：:]+$/g, '').trim()
}

function cleanModelName(value = '') {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^[^\w]+/, '')
    .replace(/[^\w)]+$/g, '')
    .replace(/,+/g, '/')
}

function uniqueModels(values) {
  const unique = []
  const seen = new Set()

  values.forEach((value) => {
    const model = cleanModelName(value)
    const key = normalizeLabel(model)
    if (!model || !key || seen.has(key)) return
    seen.add(key)
    unique.push(model)
  })

  return unique
}

function isLikelyModelName(value = '') {
  const normalized = normalizeLabel(value)
  if (!normalized) return false
  if (!/[a-z]/i.test(normalized) || !/\d/.test(normalized) || !normalized.includes('-')) return false
  if (normalized === 'ac-dc' || normalized === 'dc-ac' || normalized.startsWith('rs-485')) return false
  return true
}

function flattenRecordModels(record) {
  const merged = []
  if (Array.isArray(record.models)) merged.push(...record.models)
  if (Array.isArray(record.groups)) {
    record.groups.forEach((group) => {
      if (Array.isArray(group.models)) merged.push(...group.models)
    })
  }
  return uniqueModels(merged.filter((item) => isLikelyModelName(item)))
}

function normalizeTreeRecord(record) {
  if (!record) return null

  const key = String(record.key ?? '').trim()
  const major = String(record.major ?? '').trim()
  const subcategory = String(record.subcategory ?? '').trim()
  const leaf = String(record.leaf ?? '').trim()

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

  if (groups.length <= 1) {
    return {
      key,
      major,
      subcategory,
      leaf,
      groups: [],
      models: uniqueModels([...models, ...groups.flatMap((group) => group.models)]),
    }
  }

  return { key, major, subcategory, leaf, groups, models }
}

function decodeHtmlBuffer(buffer) {
  if (buffer.length >= 2) {
    const bom0 = buffer[0]
    const bom1 = buffer[1]
    if (bom0 === 0xff && bom1 === 0xfe) return buffer.toString('utf16le')
  }

  let zeroCount = 0
  const sampleSize = Math.min(buffer.length, 4000)
  for (let i = 0; i < sampleSize; i += 1) {
    if (buffer[i] === 0) zeroCount += 1
  }

  if (sampleSize > 0 && zeroCount / sampleSize > 0.1) {
    return buffer.toString('utf16le')
  }

  return buffer.toString('utf8')
}

function parseSeriesTreeFromHtml(htmlText) {
  const byLeaf = new Map()

  const h4Matches = [...htmlText.matchAll(/<h4[^>]*>([\s\S]*?)<\/h4>/gi)]
  for (let i = 0; i < h4Matches.length; i += 1) {
    const current = h4Matches[i]
    const next = h4Matches[i + 1]

    const leafName = stripTags(current[1])
    const leafKey = normalizeLabel(leafName)
    if (!leafKey) continue

    const sectionStart = current.index ?? 0
    const sectionEnd = next?.index ?? htmlText.length
    const section = htmlText.slice(sectionStart, sectionEnd)

    const groups = []
    const pairRegex = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi

    for (const pair of section.matchAll(pairRegex)) {
      let groupName = cleanGroupName(pair[1])
      const ddHtml = pair[2]

      const titleModels = [...ddHtml.matchAll(/title="([^"]+)"/gi)].map((hit) => String(hit[1] ?? '').trim())
      const prodModels = [...ddHtml.matchAll(/[?&]prod=([^"&]+)/gi)].map((hit) => decodeURIComponent(String(hit[1] ?? '').trim()))
      const regexModels = [...ddHtml.matchAll(/\b[A-Z]{1,8}-[A-Z0-9()/.+-]{1,24}\b/g)].map((hit) => String(hit[0] ?? '').trim())
      const models = uniqueModels([...prodModels, ...titleModels, ...regexModels])

      if (!groupName && models.length > 0) {
        groupName = 'Models'
      }
      if (!groupName || models.length === 0) continue
      groups.push({ name: groupName, models })
    }

    const normalized = normalizeTreeRecord({
      key: leafKey,
      major: '',
      subcategory: '',
      leaf: leafName,
      groups,
      models: [],
    })

    if (!normalized || (normalized.groups.length === 0 && normalized.models.length === 0)) continue
    byLeaf.set(leafKey, normalized)
  }

  return byLeaf
}

function chooseParsedRecordDetailed(manifestLeaf, parsedByLeaf) {
  const alias = LEAF_ALIAS_MAP.get(normalizeLabel(manifestLeaf))
  if (alias) {
    const aliased = parsedByLeaf.get(normalizeLabel(alias))
    if (aliased) return { record: aliased, score: 110, matchedLeaf: aliased.leaf }
  }

  const direct = parsedByLeaf.get(normalizeLabel(manifestLeaf))
  if (direct) return { record: direct, score: 100, matchedLeaf: direct.leaf }

  const canonicalManifest = canonicalLeafLabel(manifestLeaf)
  if (!canonicalManifest) return { record: null, score: -1, matchedLeaf: '' }

  let best = null
  let bestScore = -1
  let bestLeaf = ''

  parsedByLeaf.forEach((record, key) => {
    const canonicalParsed = canonicalLeafLabel(record.leaf || key)
    if (!canonicalParsed) return

    let score = 0
    if (canonicalParsed === canonicalManifest) score = 100
    else if (canonicalParsed.includes(canonicalManifest) || canonicalManifest.includes(canonicalParsed)) {
      score = 80 - Math.min(Math.abs(canonicalParsed.length - canonicalManifest.length), 30)
    } else {
      const a = new Set(canonicalParsed.split(/[-_/]/).filter(Boolean))
      const b = new Set(canonicalManifest.split(/[-_/]/).filter(Boolean))
      let overlap = 0
      a.forEach((token) => {
        if (b.has(token)) overlap += 1
      })
      if (overlap > 0) score = overlap * 10
    }

    if (score > bestScore) {
      bestScore = score
      best = record
      bestLeaf = record.leaf || key
    }
  })

  if (bestScore >= 45) {
    return { record: best, score: bestScore, matchedLeaf: bestLeaf }
  }

  return { record: null, score: bestScore, matchedLeaf: bestLeaf }
}

async function findFileByName(rootDir, fileName) {
  try {
    const entries = await fs.readdir(rootDir, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(rootDir, entry.name)
      if (entry.isFile() && entry.name === fileName) return full
      if (entry.isDirectory()) {
        const nested = await findFileByName(full, fileName)
        if (nested) return nested
      }
    }
  } catch {
    return null
  }

  return null
}

async function resolveReferenceHtmlPath() {
  try {
    await fs.access(DEFAULT_REFERENCE_HTML_PATH)
    return DEFAULT_REFERENCE_HTML_PATH
  } catch {
    const found = await findFileByName(path.join(projectRoot, 'public'), 'MEAN WELL Switching Power Supply Manufacturer.htm')
    if (found) return found
  }

  throw new Error('Reference HTML not found: MEAN WELL Switching Power Supply Manufacturer.htm')
}

function docIdFromKey(key) {
  return normalizeLabel(key).replaceAll('/', '~').replaceAll('|', '__')
}

async function run() {
  const referenceHtmlPath = await resolveReferenceHtmlPath()
  const htmlBuffer = await fs.readFile(referenceHtmlPath)
  const html = decodeHtmlBuffer(htmlBuffer)
  const parsedByLeaf = parseSeriesTreeFromHtml(html)
  const fallbackByLeaf = new Map()

  leafModelTreeFallback
    .map((record) => normalizeTreeRecord(record))
    .filter(Boolean)
    .forEach((record) => {
      fallbackByLeaf.set(normalizeLabel(record.leaf), record)
    })

  const app = initializeApp(firebaseConfig)
  const db = getFirestore(app)

  let upserted = 0
  let skipped = 0
  let fromParsed = 0
  let fromFallback = 0
  let fromPlaceholder = 0
  const skippedDetails = []

  let batch = writeBatch(db)
  let batchCount = 0

  const commitBatch = async () => {
    if (batchCount === 0) return
    await batch.commit()
    batch = writeBatch(db)
    batchCount = 0
  }

  for (const [key, value] of Object.entries(folderCatalogManifest)) {
    const labels = value?.labels
    if (!labels?.major || !labels?.subcategory || !labels?.leaf) {
      skipped += 1
      continue
    }

    const leafKey = normalizeLabel(labels.leaf)
    const parsedMatch = chooseParsedRecordDetailed(labels.leaf, parsedByLeaf)
    const parsed = parsedMatch.record
    const fallback = fallbackByLeaf.get(leafKey)
    const base = parsed ?? fallback ?? {
      key,
      major: labels.major,
      subcategory: labels.subcategory,
      leaf: labels.leaf,
      groups: [],
      models: [],
    }

    const record = normalizeTreeRecord({
      key,
      major: labels.major,
      subcategory: labels.subcategory,
      leaf: labels.leaf,
      groups: base.groups,
      models: base.models,
    })

    if (!record) {
      skipped += 1
      continue
    }

    if (record && String(key).toLowerCase().startsWith('dc/ac|')) {
      const flattenedModels = flattenRecordModels(record)
      if (flattenedModels.length > 0) {
        record.groups = []
        record.models = flattenedModels
      }
    }

    batch.set(
      doc(db, COLLECTION, docIdFromKey(key)),
      {
        ...record,
        source: parsed ? 'reference-html' : fallback ? 'fallback' : 'placeholder',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    )

    batchCount += 1
    upserted += 1
    if (parsed) fromParsed += 1
    else if (fallback) fromFallback += 1
    else {
      fromPlaceholder += 1
      skippedDetails.push({
        key,
        leaf: labels.leaf,
        bestScore: parsedMatch.score,
        bestLeaf: parsedMatch.matchedLeaf,
      })
    }

    if (batchCount >= BATCH_LIMIT) {
      await commitBatch()
    }
  }

  await commitBatch()

  console.log(`Reference HTML: ${referenceHtmlPath}`)
  console.log(`parsed leaf blocks from html: ${parsedByLeaf.size}`)
  console.log(`Upserted ${upserted} docs into ${COLLECTION}.`)
  console.log(`source: parsed=${fromParsed}, fallback=${fromFallback}, placeholder=${fromPlaceholder}, skipped=${skipped}.`)
  if (skippedDetails.length > 0) {
    console.log('skipped details:')
    skippedDetails.forEach((item) => {
      console.log(`- ${item.key} | leaf=${item.leaf} | bestScore=${item.bestScore} | bestLeaf=${item.bestLeaf}`)
    })
  }
}

await run()
