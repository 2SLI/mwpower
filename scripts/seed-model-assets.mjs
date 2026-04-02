import path from 'node:path'
import { promises as fs } from 'node:fs'
import { initializeApp } from 'firebase/app'
import { collection, doc, getDocs, getFirestore, writeBatch } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyB6HRLq6vFlBy7uvuMpd-VeKKdyKN4abY4',
  authDomain: 'meanwellpower-103ae.firebaseapp.com',
  projectId: 'meanwellpower-103ae',
  storageBucket: 'meanwellpower-103ae.firebasestorage.app',
  messagingSenderId: '459112128979',
  appId: '1:459112128979:web:dc0782d0d6c64318588f26',
}

const COLLECTION = 'leafModelTrees'
const BATCH_LIMIT = 400
const PROJECT_ROOT = process.cwd()
const ASSET_ROOT = path.join(PROJECT_ROOT, 'public', 'catalog', 'meanwell')

function normalizeLabel(value = '') {
  return String(value ?? '')
    .normalize('NFKC')
    .replaceAll('⇄', '/')
    .replaceAll('↔', '/')
    .replaceAll('—', '-')
    .replaceAll('–', '-')
    .replace(/\s+/g, '')
    .trim()
    .toLowerCase()
}

function normalizeModelKey(value = '') {
  return normalizeLabel(value)
    .replace(/_+\d+$/g, '')
    .replace(/-spec$/g, '')
    .replace(/[^a-z0-9-]+/g, '')
}

function normalizeTreeRecord(record) {
  if (!record || typeof record !== 'object') return null

  const key = String(record.key ?? '').trim()
  const major = String(record.major ?? '').trim()
  const subcategory = String(record.subcategory ?? '').trim()
  const leaf = String(record.leaf ?? '').trim()
  if (!key || !leaf) return null

  const groups = []
  if (Array.isArray(record.groups)) {
    record.groups.forEach((group) => {
      const name = String(group?.name ?? '').trim()
      if (!name) return
      const models = Array.isArray(group?.models)
        ? [...new Set(group.models.map((item) => String(item ?? '').trim()).filter(Boolean))]
        : []
      if (models.length === 0) return
      groups.push({ name, models })
    })
  }

  const models = Array.isArray(record.models)
    ? [...new Set(record.models.map((item) => String(item ?? '').trim()).filter(Boolean))]
    : []

  return { key, major, subcategory, leaf, groups, models }
}

function toPublicUrl(absPath) {
  const relative = path.relative(path.join(PROJECT_ROOT, 'public'), absPath).split(path.sep).join('/')
  return `/${relative
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')}`
}

async function walkFiles(rootDir) {
  const stack = [rootDir]
  const files = []

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

function buildAssetIndex(files) {
  const index = new Map()

  files.forEach((fullPath) => {
    const relative = path.relative(ASSET_ROOT, fullPath).split(path.sep).join('/').toLowerCase()
    if (relative.startsWith('thumbnails/')) return

    const ext = path.extname(fullPath).toLowerCase()
    if (ext !== '.jpg' && ext !== '.pdf') return

    const baseName = path.basename(fullPath, ext)
    const modelKey = normalizeModelKey(baseName)
    if (!modelKey) return

    const existing = index.get(modelKey) ?? { imageUrl: '', pdfUrl: '' }
    const url = toPublicUrl(fullPath)
    if (ext === '.jpg' && !existing.imageUrl) existing.imageUrl = url
    if (ext === '.pdf' && !existing.pdfUrl) existing.pdfUrl = url
    index.set(modelKey, existing)
  })

  return index
}

function pickModelAsset(modelName, index) {
  const modelKey = normalizeModelKey(modelName)
  if (!modelKey) return null

  const exact = index.get(modelKey)
  if (exact) return { model: modelName, imageUrl: exact.imageUrl || '', pdfUrl: exact.pdfUrl || '' }

  const compact = modelKey.replaceAll('-', '')
  if (!compact) return null

  for (const [key, value] of index.entries()) {
    const keyCompact = key.replaceAll('-', '')
    if (!keyCompact) continue
    if (keyCompact === compact || keyCompact.startsWith(compact) || compact.startsWith(keyCompact)) {
      return { model: modelName, imageUrl: value.imageUrl || '', pdfUrl: value.pdfUrl || '' }
    }
  }

  return null
}

function collectModels(record) {
  const models = []
  if (Array.isArray(record.models)) models.push(...record.models)
  if (Array.isArray(record.groups)) {
    record.groups.forEach((group) => {
      if (Array.isArray(group.models)) models.push(...group.models)
    })
  }
  return [...new Set(models.map((item) => String(item ?? '').trim()).filter(Boolean))]
}

async function run() {
  const allFiles = await walkFiles(ASSET_ROOT)
  const assetIndex = buildAssetIndex(allFiles)

  const app = initializeApp(firebaseConfig)
  const db = getFirestore(app)
  const snap = await getDocs(collection(db, COLLECTION))

  let batch = writeBatch(db)
  let batchCount = 0
  let updatedDocs = 0
  let linkedModels = 0
  let linkedWithImage = 0
  let linkedWithPdf = 0

  const commitBatch = async () => {
    if (batchCount === 0) return
    await batch.commit()
    batch = writeBatch(db)
    batchCount = 0
  }

  for (const docSnap of snap.docs) {
    const normalized = normalizeTreeRecord(docSnap.data())
    if (!normalized) continue

    const models = collectModels(normalized)
    const modelAssets = []
    const modelAssetsByKey = {}

    models.forEach((modelName) => {
      const picked = pickModelAsset(modelName, assetIndex)
      if (!picked) return
      if (!picked.imageUrl && !picked.pdfUrl) return

      const modelKey = normalizeModelKey(modelName)
      modelAssets.push({
        model: modelName,
        imageUrl: picked.imageUrl,
        pdfUrl: picked.pdfUrl,
      })
      modelAssetsByKey[modelKey] = {
        model: modelName,
        imageUrl: picked.imageUrl,
        pdfUrl: picked.pdfUrl,
      }
      linkedModels += 1
      if (picked.imageUrl) linkedWithImage += 1
      if (picked.pdfUrl) linkedWithPdf += 1
    })

    batch.set(
      doc(db, COLLECTION, docSnap.id),
      {
        modelAssets,
        modelAssetsByKey,
        assetStats: {
          totalModels: models.length,
          linkedModels: modelAssets.length,
          linkedWithImage: modelAssets.filter((item) => item.imageUrl).length,
          linkedWithPdf: modelAssets.filter((item) => item.pdfUrl).length,
        },
        assetsUpdatedAt: new Date().toISOString(),
      },
      { merge: true }
    )
    batchCount += 1
    updatedDocs += 1

    if (batchCount >= BATCH_LIMIT) {
      await commitBatch()
    }
  }

  await commitBatch()

  console.log(`Asset root: ${ASSET_ROOT}`)
  console.log(`Indexed files: ${allFiles.length}, model asset keys: ${assetIndex.size}`)
  console.log(`Updated docs: ${updatedDocs}`)
  console.log(`Linked models (any): ${linkedModels}`)
  console.log(`Linked models (image): ${linkedWithImage}`)
  console.log(`Linked models (pdf): ${linkedWithPdf}`)
}

await run()
