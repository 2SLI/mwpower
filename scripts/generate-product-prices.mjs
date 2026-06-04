import fs from 'node:fs'
import path from 'node:path'
import xlsx from 'xlsx'

const ROOT_DIR = process.cwd()
const INPUT_FILENAME = '민웰파워 상품 목록 0519.xlsx'
const INPUT_PATH = path.join(ROOT_DIR, INPUT_FILENAME)
const OUTPUT_PATH = path.join(ROOT_DIR, 'src', 'data', 'productPrices.js')

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

function normalizeModelName(value = '') {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, '')
    .trim()
    .toUpperCase()
}

function normalizePrice(value) {
  if (value == null || value === '') return null
  const parsed = Number(String(value).replace(/[,\s원]/g, ''))
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return Math.round(parsed)
}

function extractModelName(productName = '') {
  const text = String(productName ?? '').normalize('NFKC').trim()
  if (!text || text.includes('[예약건]')) return ''

  const smpsMatch = text.match(/\bSMPS\s+([A-Z0-9][A-Z0-9.+/()_-]*)/i)
  if (smpsMatch?.[1]) return normalizeModelName(smpsMatch[1])

  const meanwellMatch = text.match(/민웰\s+([A-Z0-9][A-Z0-9.+/()_-]*)/i)
  if (meanwellMatch?.[1]) {
    const model = normalizeModelName(meanwellMatch[1])
    return model === 'SMPS' ? '' : model
  }

  return ''
}

function readPriceRows() {
  if (!fs.existsSync(INPUT_PATH)) {
    if (fs.existsSync(OUTPUT_PATH)) {
      console.warn(`Price workbook not found; keeping existing generated prices: ${INPUT_PATH}`)
      return null
    }
    throw new Error(`Price workbook and generated prices not found: ${INPUT_PATH}`)
  }

  const workbook = xlsx.readFile(INPUT_PATH, { cellDates: false })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' })
  const recordsByKey = new Map()
  const skippedRows = []
  const duplicateRows = []

  rows.forEach((row, index) => {
    const productName = row['상품명']
    const model = extractModelName(productName)
    const price = normalizePrice(row['판매가'])

    if (!model || price == null) {
      skippedRows.push({
        rowNumber: index + 2,
        productName,
        price: row['판매가'],
      })
      return
    }

    const key = normalizeLabel(model)
    if (recordsByKey.has(key)) {
      duplicateRows.push({
        rowNumber: index + 2,
        model,
        previousPrice: recordsByKey.get(key).price,
        price,
        productName,
      })
    }

    recordsByKey.set(key, {
      model,
      price,
      status: String(row['판매상태'] ?? '').trim(),
      sellerProductCode: String(row['판매자상품코드'] ?? '').trim(),
    })
  })

  return {
    sheetName,
    records: [...recordsByKey.entries()].sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })),
    skippedRows,
    duplicateRows,
    totalRows: rows.length,
  }
}

function buildPriceData() {
  const priceRows = readPriceRows()
  if (!priceRows) return null

  const { sheetName, records, skippedRows, duplicateRows, totalRows } = priceRows
  const byModelKey = {}

  records.forEach(([key, record]) => {
    byModelKey[key] = record.price
  })

  return {
    summary: {
      sourceFile: INPUT_FILENAME,
      sheetName,
      totalRows,
      totalModels: records.length,
      skippedRows,
      duplicateRows,
      generatedAt: new Date().toISOString(),
    },
    byModelKey,
  }
}

const priceData = buildPriceData()
if (!priceData) process.exit(0)

const content = `export const productPriceSummary = ${JSON.stringify(priceData.summary, null, 2)}

export const productPriceByModelKey = ${JSON.stringify(priceData.byModelKey, null, 2)}

export const DEFAULT_PRODUCT_PRICE = 0
`

fs.writeFileSync(OUTPUT_PATH, content, 'utf8')
console.log(`Generated ${OUTPUT_PATH}`)
console.log(`Price models: ${priceData.summary.totalModels}`)
console.log(`Skipped rows: ${priceData.summary.skippedRows.length}`)
console.log(`Duplicate rows: ${priceData.summary.duplicateRows.length}`)
