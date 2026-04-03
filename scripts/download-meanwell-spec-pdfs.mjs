import fs from 'node:fs/promises'
import path from 'node:path'

const SEARCH_BASE_URL = 'https://www.meanwell.com/webapp/product/search.aspx?prod='
const DEFAULT_OUT_DIR = path.resolve(process.cwd(), 'public/catalog/meanwell')

function printUsage() {
  console.log(`
Usage:
  node scripts/download-meanwell-spec-pdfs.mjs --models RPS-30,HVGC-480
  node scripts/download-meanwell-spec-pdfs.mjs --input ./pending-models.txt
  node scripts/download-meanwell-spec-pdfs.mjs --all-missing

Options:
  --models <csv>       Comma-separated product models
  --input <file>       Text file with one model per line
  --all-missing        Use all models that currently have no PDF in leafModelTreeFallback
  --out <dir>          Download directory (default: public/catalog/meanwell)
  --limit <number>     Process only first N models (after offset)
  --offset <number>    Skip first N models
  --delay <ms>         Delay between requests (default: 250)
  --canonical-name     Save as "<MODEL>-SPEC.PDF" for reliable local model matching
  --overwrite          Overwrite existing files
  --dry-run            Show resolved PDF URLs without downloading
`)
}

function parseArgs(argv) {
  const options = {
    models: [],
    inputFile: '',
    allMissing: false,
    outDir: DEFAULT_OUT_DIR,
    limit: Number.POSITIVE_INFINITY,
    offset: 0,
    delayMs: 250,
    canonicalName: false,
    overwrite: false,
    dryRun: false,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--models') {
      const value = argv[i + 1] ?? ''
      i += 1
      options.models.push(
        ...value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      )
      continue
    }
    if (arg === '--input') {
      options.inputFile = argv[i + 1] ?? ''
      i += 1
      continue
    }
    if (arg === '--all-missing') {
      options.allMissing = true
      continue
    }
    if (arg === '--out') {
      options.outDir = path.resolve(process.cwd(), argv[i + 1] ?? '')
      i += 1
      continue
    }
    if (arg === '--limit') {
      options.limit = Math.max(0, Number.parseInt(argv[i + 1] ?? '0', 10) || 0)
      i += 1
      continue
    }
    if (arg === '--offset') {
      options.offset = Math.max(0, Number.parseInt(argv[i + 1] ?? '0', 10) || 0)
      i += 1
      continue
    }
    if (arg === '--delay') {
      options.delayMs = Math.max(0, Number.parseInt(argv[i + 1] ?? '0', 10) || 0)
      i += 1
      continue
    }
    if (arg === '--canonical-name') {
      options.canonicalName = true
      continue
    }
    if (arg === '--overwrite') {
      options.overwrite = true
      continue
    }
    if (arg === '--dry-run') {
      options.dryRun = true
      continue
    }
    if (arg === '--help' || arg === '-h') {
      printUsage()
      process.exit(0)
    }

    if (!arg.startsWith('-')) {
      options.models.push(arg.trim())
    }
  }

  return options
}

function normalizeModel(value = '') {
  return String(value ?? '')
    .normalize('NFKC')
    .replaceAll('—', '-')
    .replaceAll('–', '-')
    .replace(/_+\d+$/i, '')
    .replace(/-spec$/i, '')
    .replace(/\bseries\b$/i, '')
    .replace(/\s*\(\d+\)\s*$/g, '')
    .trim()
}

function dedupeModels(models) {
  const unique = []
  const seen = new Set()
  models.forEach((item) => {
    const normalized = normalizeModel(item)
    if (!normalized) return
    const key = normalized.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    unique.push(normalized)
  })
  return unique
}

function normalizeModelKey(value = '') {
  return normalizeModel(value)
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9-]+/g, '')
}

function collectModels(record = {}) {
  const merged = []
  if (Array.isArray(record.models)) merged.push(...record.models)
  if (Array.isArray(record.groups)) {
    record.groups.forEach((group) => {
      if (Array.isArray(group.models)) merged.push(...group.models)
    })
  }

  const unique = []
  const seen = new Set()
  merged.forEach((item) => {
    const model = normalizeModel(item)
    const key = normalizeModelKey(model)
    if (!model || !key || seen.has(key)) return
    seen.add(key)
    unique.push(model)
  })
  return unique
}

function hasPdfForModel(record = {}, modelName = '') {
  const modelKey = normalizeModelKey(modelName)
  if (!modelKey) return false

  const byKey = record.modelAssetsByKey
  if (byKey && typeof byKey === 'object') {
    const keyed = byKey[modelKey]
    if (String(keyed?.pdfUrl ?? '').trim()) return true
  }

  if (Array.isArray(record.modelAssets)) {
    const fromArray = record.modelAssets.find((item) => normalizeModelKey(item?.model) === modelKey)
    if (String(fromArray?.pdfUrl ?? '').trim()) return true
  }

  return false
}

async function getAllMissingModelsFromLeafTree() {
  const dataModule = await import('../src/data/leafModelTreeFallback.js')
  const records = Array.isArray(dataModule.leafModelTreeFallback) ? dataModule.leafModelTreeFallback : []
  const byModel = new Map()

  records.forEach((record) => {
    const models = collectModels(record)
    models.forEach((modelName) => {
      const key = normalizeModelKey(modelName)
      if (!key) return

      const existing = byModel.get(key)
      const hasPdf = hasPdfForModel(record, modelName)

      if (!existing) {
        byModel.set(key, { model: modelName, hasPdf })
        return
      }

      if (hasPdf) existing.hasPdf = true
    })
  })

  return Array.from(byModel.values())
    .filter((item) => !item.hasPdf)
    .map((item) => item.model)
}

async function readModelsFromFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8')
  return content
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
}

function extractPdfUrl(html, searchUrl) {
  const desktopIframeMatch = html.match(/<iframe[^>]*class=["'][^"']*desktop-pdf[^"']*["'][^>]*src=["']([^"']+)["']/i)
  if (desktopIframeMatch?.[1]) {
    return new URL(desktopIframeMatch[1].replaceAll('&amp;', '&'), searchUrl).href
  }

  const anyPdfIframeMatch = html.match(/<iframe[^>]*src=["']([^"']+\.pdf(?:\?[^"']*)?)["']/i)
  if (anyPdfIframeMatch?.[1]) {
    return new URL(anyPdfIframeMatch[1].replaceAll('&amp;', '&'), searchUrl).href
  }

  const uploadPathMatch = html.match(/(?:\.\.\/)+upload\/pdf\/[^"'<>\s]+\.pdf/i)
  if (uploadPathMatch?.[0]) {
    return new URL(uploadPathMatch[0], searchUrl).href
  }

  return ''
}

function buildSearchUrl(model) {
  return `${SEARCH_BASE_URL}${encodeURIComponent(model)}`
}

async function fetchText(url) {
  const response = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return response.text()
}

async function downloadBinary(url) {
  const response = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
      accept: 'application/pdf,*/*',
    },
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  const data = Buffer.from(await response.arrayBuffer())
  if (!data.length) throw new Error('Empty file')
  return data
}

function getPdfFilename(pdfUrl, fallbackModel) {
  const urlObject = new URL(pdfUrl)
  const basename = path.basename(urlObject.pathname).trim()
  if (basename && /\.pdf$/i.test(basename)) return basename
  return `${fallbackModel}-SPEC.PDF`
}

function sanitizeFilename(value = '') {
  return String(value ?? '')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
}

function getCanonicalFilename(model = '') {
  const safeModel = sanitizeFilename(model)
  if (!safeModel) return 'UNKNOWN-SPEC.PDF'
  return `${safeModel}-SPEC.PDF`
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  let models = [...options.models]

  if (options.allMissing) {
    const missing = await getAllMissingModelsFromLeafTree()
    models.push(...missing)
  }

  if (options.inputFile) {
    const fromFile = await readModelsFromFile(path.resolve(process.cwd(), options.inputFile))
    models.push(...fromFile)
  }

  models = dedupeModels(models)
  if (!models.length) {
    printUsage()
    throw new Error('No models provided. Use --models, --input, or --all-missing.')
  }

  const sliced = models.slice(options.offset, options.offset + options.limit)
  await fs.mkdir(options.outDir, { recursive: true })

  const results = []
  const total = sliced.length

  for (let i = 0; i < sliced.length; i += 1) {
    const model = sliced[i]
    const progress = `${i + 1}/${total}`
    const searchUrl = buildSearchUrl(model)

    try {
      const html = await fetchText(searchUrl)
      const pdfUrl = extractPdfUrl(html, searchUrl)
      if (!pdfUrl) throw new Error('SPEC PDF iframe not found')

      const sourceFilename = getPdfFilename(pdfUrl, model)
      const filename = options.canonicalName ? getCanonicalFilename(model) : sourceFilename
      const destination = path.join(options.outDir, filename)

      if (!options.overwrite) {
        try {
          await fs.access(destination)
          console.log(`[${progress}] SKIP ${model} -> ${filename} (already exists)`)
          results.push({ model, status: 'skipped', pdfUrl, file: destination })
          if (options.delayMs > 0) await sleep(options.delayMs)
          continue
        } catch {
          // proceed download
        }
      }

      const sourcePath = path.join(options.outDir, sourceFilename)
      if (options.canonicalName && sourcePath !== destination && !options.overwrite) {
        try {
          await fs.access(sourcePath)
          await fs.copyFile(sourcePath, destination)
          console.log(`[${progress}] LINK ${model} -> ${filename} (from ${sourceFilename})`)
          results.push({ model, status: 'aliased', pdfUrl, file: destination, source: sourcePath })
          if (options.delayMs > 0) await sleep(options.delayMs)
          continue
        } catch {
          // source not present locally, fallback to download
        }
      }

      if (options.dryRun) {
        console.log(`[${progress}] URL  ${model} -> ${pdfUrl} => ${filename}`)
        results.push({ model, status: 'dry-run', pdfUrl, file: destination })
        if (options.delayMs > 0) await sleep(options.delayMs)
        continue
      }

      const binary = await downloadBinary(pdfUrl)
      await fs.writeFile(destination, binary)
      console.log(`[${progress}] OK   ${model} -> ${filename}`)
      results.push({ model, status: 'downloaded', pdfUrl, file: destination })
    } catch (error) {
      console.log(`[${progress}] FAIL ${model} -> ${error.message}`)
      results.push({ model, status: 'failed', error: error.message })
    }

    if (options.delayMs > 0) await sleep(options.delayMs)
  }

  const downloaded = results.filter((item) => item.status === 'downloaded').length
  const aliased = results.filter((item) => item.status === 'aliased').length
  const skipped = results.filter((item) => item.status === 'skipped').length
  const failed = results.filter((item) => item.status === 'failed').length

  console.log('\nSummary')
  console.log(`- Total: ${total}`)
  console.log(`- Downloaded: ${downloaded}`)
  console.log(`- Aliased: ${aliased}`)
  console.log(`- Skipped: ${skipped}`)
  console.log(`- Failed: ${failed}`)

  if (failed > 0) {
    console.log('\nFailed models:')
    results
      .filter((item) => item.status === 'failed')
      .forEach((item) => console.log(`- ${item.model}: ${item.error}`))
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(`\nError: ${error.message}`)
  process.exit(1)
})
