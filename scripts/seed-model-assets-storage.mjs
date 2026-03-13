import path from 'node:path'
import { promises as fs } from 'node:fs'
import { initializeApp } from 'firebase/app'
import { collection, doc, getDocs, getFirestore, writeBatch } from 'firebase/firestore'
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage'

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
const ASSET_ROOT = path.join(PROJECT_ROOT, 'public', 'meanwell', '1. 민웰 통합_사양서+썸네일 (2)')
const STORAGE_PREFIX = 'catalog-assets/meanwell'
const UPLOAD_CONCURRENCY = 6

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

async function walkFiles(rootDir) {
  const stack = [rootDir]
  const files = []

  while (stack.length > 0) {
    const current = stack.pop()
    const entries = await fs.readdir(current, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) stack.push(full)
      else files.push(full)
    }
  }

  return files
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.pdf') return 'application/pdf'
  return 'application/octet-stream'
}

function makeStorageObjectPath(fullPath) {
  const relative = path.relative(ASSET_ROOT, fullPath).split(path.sep).join('/')
  return `${STORAGE_PREFIX}/${relative}`
}

async function uploadAndGetDownloadUrl(storage, fullPath) {
  const objectPath = makeStorageObjectPath(fullPath)
  const storageRef = ref(storage, objectPath)

  const buffer = await fs.readFile(fullPath)
  await uploadBytes(storageRef, buffer, {
    contentType: getContentType(fullPath),
    cacheControl: 'public, max-age=31536000, immutable',
  })
  const url = await getDownloadURL(storageRef)
  return { objectPath, url, uploaded: true }
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

function pickModelAsset(modelName, index) {
  const modelKey = normalizeModelKey(modelName)
  if (!modelKey) return null

  const exact = index.get(modelKey)
  if (exact) return { ...exact, model: modelName }

  const compact = modelKey.replaceAll('-', '')
  for (const [key, value] of index.entries()) {
    const keyCompact = key.replaceAll('-', '')
    if (!keyCompact) continue
    if (keyCompact === compact || keyCompact.startsWith(compact) || compact.startsWith(keyCompact)) {
      return { ...value, model: modelName }
    }
  }

  return null
}

function pickPreferredFilesByModelKey(modelKeys, allFiles) {
  const byModelKey = new Map()

  allFiles.forEach((fullPath) => {
    const ext = path.extname(fullPath).toLowerCase()
    if (ext !== '.jpg' && ext !== '.pdf') return
    const base = path.basename(fullPath, ext)
    const key = normalizeModelKey(base)
    if (!key) return
    const item = byModelKey.get(key) ?? { jpg: [], pdf: [] }
    if (ext === '.jpg') item.jpg.push(fullPath)
    if (ext === '.pdf') item.pdf.push(fullPath)
    byModelKey.set(key, item)
  })

  const selected = new Set()

  modelKeys.forEach((modelKey) => {
    const exact = byModelKey.get(modelKey)
    if (exact) {
      if (exact.jpg[0]) selected.add(exact.jpg[0])
      if (exact.pdf[0]) selected.add(exact.pdf[0])
      return
    }

    const compact = modelKey.replaceAll('-', '')
    for (const [key, files] of byModelKey.entries()) {
      const keyCompact = key.replaceAll('-', '')
      if (!keyCompact) continue
      if (keyCompact === compact || keyCompact.startsWith(compact) || compact.startsWith(keyCompact)) {
        if (files.jpg[0]) selected.add(files.jpg[0])
        if (files.pdf[0]) selected.add(files.pdf[0])
      }
    }
  })

  return [...selected]
}

async function runWithConcurrency(items, worker, concurrency = UPLOAD_CONCURRENCY) {
  const queue = [...items]
  const results = []
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift()
      if (!item) continue
      const result = await worker(item)
      results.push(result)
    }
  })
  await Promise.all(workers)
  return results
}

async function run() {
  const app = initializeApp(firebaseConfig)
  const db = getFirestore(app)
  const storage = getStorage(app)

  const allFiles = (await walkFiles(ASSET_ROOT)).filter((fullPath) => {
    const ext = path.extname(fullPath).toLowerCase()
    return ext === '.jpg' || ext === '.pdf'
  })
  const snap = await getDocs(collection(db, COLLECTION))
  const allModelKeys = new Set()
  const records = []
  for (const docSnap of snap.docs) {
    const record = normalizeTreeRecord(docSnap.data())
    if (!record) continue
    records.push({ id: docSnap.id, record })
    const models = collectModels(record)
    models.forEach((modelName) => {
      const key = normalizeModelKey(modelName)
      if (key) allModelKeys.add(key)
    })
  }

  const uploadTargets = pickPreferredFilesByModelKey(allModelKeys, allFiles)
  let done = 0
  const fileAssetMap = new Map(
    (
      await runWithConcurrency(
        uploadTargets,
        async (fullPath) => {
          const output = await uploadAndGetDownloadUrl(storage, fullPath)
          done += 1
          if (done % 25 === 0 || done === uploadTargets.length) {
            console.log(`Uploaded ${done}/${uploadTargets.length}`)
          }
          return [fullPath, output]
        },
        UPLOAD_CONCURRENCY
      )
    ).filter(Boolean)
  )

  const modelAssetIndex = new Map()
  for (const fullPath of uploadTargets) {
    const ext = path.extname(fullPath).toLowerCase()
    const base = path.basename(fullPath, ext)
    const modelKey = normalizeModelKey(base)
    if (!modelKey) continue

    const existing = modelAssetIndex.get(modelKey) ?? {
      imageUrl: '',
      imageStoragePath: '',
      pdfUrl: '',
      pdfStoragePath: '',
    }
    const uploaded = fileAssetMap.get(fullPath)
    if (!uploaded) continue

    if ((ext === '.jpg' || ext === '.jpeg') && !existing.imageUrl) {
      existing.imageUrl = uploaded.url
      existing.imageStoragePath = uploaded.objectPath
    }
    if (ext === '.pdf' && !existing.pdfUrl) {
      existing.pdfUrl = uploaded.url
      existing.pdfStoragePath = uploaded.objectPath
    }
    modelAssetIndex.set(modelKey, existing)
  }

  let batch = writeBatch(db)
  let batchCount = 0
  let updatedDocs = 0
  let linkedAny = 0
  let linkedImage = 0
  let linkedPdf = 0

  const commitBatch = async () => {
    if (batchCount === 0) return
    await batch.commit()
    batch = writeBatch(db)
    batchCount = 0
  }

  for (const item of records) {
    const record = item.record

    const models = collectModels(record)
    const modelAssets = []
    const modelAssetsByKey = {}

    models.forEach((modelName) => {
      const found = pickModelAsset(modelName, modelAssetIndex)
      if (!found) return
      if (!found.imageUrl && !found.pdfUrl) return

      const modelKey = normalizeModelKey(modelName)
      const payload = {
        model: modelName,
        imageUrl: found.imageUrl || '',
        imageStoragePath: found.imageStoragePath || '',
        pdfUrl: found.pdfUrl || '',
        pdfStoragePath: found.pdfStoragePath || '',
      }
      modelAssets.push(payload)
      modelAssetsByKey[modelKey] = payload
      linkedAny += 1
      if (payload.imageUrl) linkedImage += 1
      if (payload.pdfUrl) linkedPdf += 1
    })

    batch.set(
      doc(db, COLLECTION, item.id),
      {
        modelAssets,
        modelAssetsByKey,
        assetStats: {
          totalModels: models.length,
          linkedModels: modelAssets.length,
          linkedWithImage: modelAssets.filter((item) => item.imageUrl).length,
          linkedWithPdf: modelAssets.filter((item) => item.pdfUrl).length,
        },
        assetStorageSource: 'firebase-storage',
        assetsUpdatedAt: new Date().toISOString(),
      },
      { merge: true }
    )
    batchCount += 1
    updatedDocs += 1

    if (batchCount >= BATCH_LIMIT) await commitBatch()
  }

  await commitBatch()

  console.log(`Asset root: ${ASSET_ROOT}`)
  console.log(`Local asset files: ${allFiles.length}`)
  console.log(`Upload target files: ${uploadTargets.length}`)
  console.log(`Storage uploads: ${uploadTargets.length}`)
  console.log(`Storage indexed model keys: ${modelAssetIndex.size}`)
  console.log(`Updated docs: ${updatedDocs}`)
  console.log(`Linked models(any): ${linkedAny}`)
  console.log(`Linked models(image): ${linkedImage}`)
  console.log(`Linked models(pdf): ${linkedPdf}`)
}

await run()
