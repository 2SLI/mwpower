import path from 'node:path'
import { promises as fs } from 'node:fs'
import { defaultMajorCategories } from '../src/data/defaultMajorCategories.js'

const PROJECT_ROOT = process.cwd()
const SOURCE_ASSET_ROOT = path.join(PROJECT_ROOT, 'catalog-source', 'meanwell-legacy')
const STRUCTURED_ASSET_ROOT = path.join(PROJECT_ROOT, 'public', 'catalog', 'meanwell')
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'src', 'data', 'leafModelTreeFallback.js')

function normalizeLabel(value = '') {
  return String(value ?? '')
    .normalize('NFKC')
    .replaceAll('⇄', '/')
    .replaceAll('↔', '/')
    .replaceAll('—', '-')
    .replaceAll('–', '-')
    .replace(/\s*\/\s*/g, '/')
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

function toPublicUrl(absPath) {
  const relative = path.relative(path.join(PROJECT_ROOT, 'public'), absPath).split(path.sep).join('/')
  return `/${relative}`
}

function safeSegment(value = '') {
  const text = String(value ?? '').trim()
  if (!text) return 'unknown'
  return text.replace(/[^A-Za-z0-9._-]+/g, '-')
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

function buildAssetIndex(files) {
  const index = new Map()

  files.forEach((fullPath) => {
    const ext = path.extname(fullPath).toLowerCase()
    if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.pdf') return

    const baseName = path.basename(fullPath, ext)
    const modelKey = normalizeModelKey(baseName)
    if (!modelKey) return

    const item = index.get(modelKey) ?? { imagePath: '', pdfPath: '' }
    if ((ext === '.jpg' || ext === '.jpeg') && !item.imagePath) item.imagePath = fullPath
    if (ext === '.pdf' && !item.pdfPath) item.pdfPath = fullPath
    index.set(modelKey, item)
  })

  return index
}

function pickModelAsset(modelName, index) {
  const modelKey = normalizeModelKey(modelName)
  if (!modelKey) return null

  const exact = index.get(modelKey)
  if (exact) return { model: modelName, imagePath: exact.imagePath || '', pdfPath: exact.pdfPath || '' }

  const compact = modelKey.replaceAll('-', '')
  if (!compact) return null

  for (const [key, value] of index.entries()) {
    const keyCompact = key.replaceAll('-', '')
    if (!keyCompact) continue
    if (keyCompact === compact || keyCompact.startsWith(compact) || compact.startsWith(keyCompact)) {
      return { model: modelName, imagePath: value.imagePath || '', pdfPath: value.pdfPath || '' }
    }
  }

  return null
}

async function ensureDir(targetPath) {
  await fs.mkdir(targetPath, { recursive: true })
}

async function copyIfExists(sourcePath, targetPath) {
  if (!sourcePath) return false
  await ensureDir(path.dirname(targetPath))
  await fs.copyFile(sourcePath, targetPath)
  return true
}

async function run() {
  const files = await walkFiles(SOURCE_ASSET_ROOT)
  const assetIndex = buildAssetIndex(files)
  const records = []
  let missingPdf = 0
  let missingImage = 0

  await fs.rm(STRUCTURED_ASSET_ROOT, { recursive: true, force: true })
  await ensureDir(STRUCTURED_ASSET_ROOT)

  for (const category of defaultMajorCategories) {
    const majorFolder = safeSegment(category.id)
    const models = Array.isArray(category.subcategories) ? category.subcategories : []
    for (const modelName of models) {
      const picked = pickModelAsset(modelName, assetIndex) ?? { model: modelName, imagePath: '', pdfPath: '' }
      const modelKey = normalizeModelKey(modelName)
      const modelFolder = safeSegment(modelName)
      const targetDir = path.join(STRUCTURED_ASSET_ROOT, majorFolder, modelFolder)

      let imageUrl = ''
      let pdfUrl = ''

      if (picked.imagePath) {
        const imageExt = path.extname(picked.imagePath).toLowerCase() || '.jpg'
        const targetImage = path.join(targetDir, `image${imageExt}`)
        await copyIfExists(picked.imagePath, targetImage)
        imageUrl = toPublicUrl(targetImage)
      } else {
        missingImage += 1
      }

      if (picked.pdfPath) {
        const targetPdf = path.join(targetDir, 'spec.pdf')
        await copyIfExists(picked.pdfPath, targetPdf)
        pdfUrl = toPublicUrl(targetPdf)
      } else {
        missingPdf += 1
      }

      records.push({
        key: `${category.name}|${modelName}|${modelName}`,
        major: category.name,
        subcategory: modelName,
        leaf: modelName,
        groups: [],
        models: [modelName],
        modelAssets: [
          {
            model: modelName,
            imageUrl,
            pdfUrl,
          },
        ],
        modelAssetsByKey: {
          [modelKey]: {
            model: modelName,
            imageUrl,
            pdfUrl,
          },
        },
      })
    }
  }

  const output = `export const leafModelTreeFallback = ${JSON.stringify(records, null, 2)}\n`
  await fs.writeFile(OUTPUT_FILE, output, 'utf8')

  console.log(`Generated: ${OUTPUT_FILE}`)
  console.log(`Structured assets: ${STRUCTURED_ASSET_ROOT}`)
  console.log(`Records: ${records.length}`)
  console.log(`Missing pdf: ${missingPdf}`)
  console.log(`Missing image: ${missingImage}`)
}

await run()
