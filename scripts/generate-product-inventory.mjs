import fs from 'node:fs'
import path from 'node:path'
import xlsx from 'xlsx'
import { leafModelTreeFallback } from '../src/data/leafModelTreeFallback.js'
import { modelOptionWattageMap } from '../src/data/modelOptionWattageMap.js'

const ROOT_DIR = process.cwd()
const CSV_INPUT_NAME = 'SMPS 재고 - SMPS 재고.csv'
const XLSX_INPUT_NAME = 'smps_product.xlsx'
const OUTPUT_PATH = path.join(ROOT_DIR, 'src', 'data', 'productInventory.js')

function findInventoryInputPath() {
  const csvFileName = fs
    .readdirSync(ROOT_DIR)
    .find((fileName) => fileName.normalize('NFC') === CSV_INPUT_NAME)

  if (csvFileName) return path.join(ROOT_DIR, csvFileName)
  return path.join(ROOT_DIR, XLSX_INPUT_NAME)
}

const INPUT_PATH = findInventoryInputPath()

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

function normalizeQuantity(value) {
  if (value === '-' || value === '－') return 0
  if (value == null || value === '') return null

  const text = String(value).replace(/,/g, '').trim()
  if (!text || text === '-') return 0

  const parsed = Number(text)
  if (!Number.isFinite(parsed)) return null
  return Math.max(0, parsed)
}

function collectCatalogBaseKeys() {
  const keys = new Set()

  const addModel = (modelName) => {
    const key = normalizeLabel(modelName)
    if (key) keys.add(key)
  }

  leafModelTreeFallback.forEach((record) => {
    if (Array.isArray(record?.models)) record.models.forEach(addModel)
    if (Array.isArray(record?.groups)) {
      record.groups.forEach((group) => {
        if (Array.isArray(group?.models)) group.models.forEach(addModel)
      })
    }
  })

  Object.keys(modelOptionWattageMap).forEach(addModel)

  return [...keys].sort((a, b) => b.length - a.length)
}

function findBaseKey(modelKey, baseKeys) {
  if (!modelKey) return ''
  const exact = baseKeys.find((key) => key === modelKey)
  if (exact) return exact
  return baseKeys.find((key) => modelKey.startsWith(`${key}-`) || modelKey.startsWith(key)) ?? ''
}

function readInventoryRows() {
  if (!fs.existsSync(INPUT_PATH)) {
    throw new Error(`Inventory workbook not found: ${INPUT_PATH}`)
  }

  const isCsv = path.extname(INPUT_PATH).toLowerCase() === '.csv'
  const workbook = isCsv
    ? xlsx.read(fs.readFileSync(INPUT_PATH, 'utf8'), { type: 'string', cellDates: false })
    : xlsx.readFile(INPUT_PATH, { cellDates: false })
  const sheetName = workbook.SheetNames.includes('SMPS 재고') ? 'SMPS 재고' : workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  const dateText = String(sheet?.C2?.w ?? sheet?.C2?.v ?? sheet?.D2?.w ?? sheet?.D2?.v ?? '').trim()
  const refreshText = String(sheet?.C3?.w ?? sheet?.C3?.v ?? sheet?.D3?.w ?? sheet?.D3?.v ?? '').trim()

  const recordsByKey = new Map()

  rows.forEach((row) => {
    const model = normalizeModelName(row[1] ?? row[0])
    if (!model || model === '모델명' || model.includes('시리즈') || model.includes('재고')) return
    if (!/[A-Z]/.test(model) || !/[0-9]/.test(model)) return

    const quantity = normalizeQuantity(row[2] ?? row[1])
    const modelKey = normalizeLabel(model)
    if (!modelKey) return

    const previous = recordsByKey.get(modelKey)
    if (!previous) {
      recordsByKey.set(modelKey, { model, quantity })
      return
    }

    previous.quantity =
      previous.quantity == null || quantity == null ? previous.quantity ?? quantity : previous.quantity + quantity
  })

  return {
    sheetName,
    dateText,
    refreshText,
    records: [...recordsByKey.values()].sort((a, b) =>
      a.model.localeCompare(b.model, undefined, { numeric: true, sensitivity: 'base' })
    ),
  }
}

function buildInventoryData() {
  const { sheetName, dateText, refreshText, records } = readInventoryRows()
  const baseKeys = collectCatalogBaseKeys()
  const byModelKey = {}
  const optionModelsByBaseKey = {}
  const unmatchedModels = []

  records.forEach((record) => {
    const key = normalizeLabel(record.model)
    const baseKey = findBaseKey(key, baseKeys)
    const normalizedRecord = {
      model: record.model,
      quantity: record.quantity,
      inStock: Number(record.quantity) > 0,
      baseKey,
    }

    byModelKey[key] = normalizedRecord

    if (baseKey) {
      if (!optionModelsByBaseKey[baseKey]) optionModelsByBaseKey[baseKey] = []
      optionModelsByBaseKey[baseKey].push(record.model)
      return
    }

    unmatchedModels.push(record.model)
  })

  Object.keys(optionModelsByBaseKey).forEach((baseKey) => {
    optionModelsByBaseKey[baseKey] = [...new Set(optionModelsByBaseKey[baseKey])].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    )
  })

  return {
    summary: {
      sourceFile: path.basename(INPUT_PATH).normalize('NFC'),
      sheetName,
      updatedLabel: [dateText, refreshText].filter(Boolean).join(' '),
      totalModels: records.length,
      unmatchedModels,
      generatedAt: new Date().toISOString(),
    },
    byModelKey,
    optionModelsByBaseKey,
  }
}

const inventory = buildInventoryData()
const content = `export const productInventorySummary = ${JSON.stringify(inventory.summary, null, 2)}

export const productInventoryByModelKey = ${JSON.stringify(inventory.byModelKey, null, 2)}

export const inventoryOptionModelsByBaseKey = ${JSON.stringify(inventory.optionModelsByBaseKey, null, 2)}
`

fs.writeFileSync(OUTPUT_PATH, content, 'utf8')
console.log(`Generated ${OUTPUT_PATH}`)
console.log(`Inventory models: ${inventory.summary.totalModels}`)
console.log(`Unmatched models: ${inventory.summary.unmatchedModels.length}`)
