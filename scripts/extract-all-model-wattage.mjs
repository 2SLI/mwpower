import fs from 'node:fs/promises'
import path from 'node:path'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'

const ROOT_DIR = process.cwd()
const PDF_DIR = path.join(ROOT_DIR, 'public', 'catalog', 'meanwell')
const OUT_DIR = path.join(ROOT_DIR, 'output')
const OUT_CSV = path.join(OUT_DIR, 'all-model-wattage.csv')
const OUT_UNRESOLVED_CSV = path.join(OUT_DIR, 'all-model-wattage-unresolved.csv')
const OUT_SUMMARY = path.join(OUT_DIR, 'all-model-wattage-summary.json')

const NON_MODEL_TOKENS = new Set([
  'MODEL',
  'MODELS',
  'RATED',
  'POWER',
  'OUTPUT',
  'VOLTAGE',
  'CURRENT',
  'RANGE',
  'LINE',
  'LOAD',
  'TYP',
  'MAX',
  'MIN',
  'NOTE',
  'NOTES',
  'FEATURES',
  'SPECIFICATION',
  'SERIES',
  'INPUT',
  'PROTECTION',
  'DIMENSION',
  'PACKING',
  'EMC',
  'EMI',
  'WORKING',
  'TEMP',
  'TEMPERATURE',
  'HUMIDITY',
  'NOISE',
  'RIPPLE',
  'WARRANTY',
  'SEARCH',
  'FILE',
  'NAME',
  'SINGLE',
  'DUAL',
  'TRIPLE',
  'QUAD',
  'I',
  'P',
  'O',
  'FG',
  'AC',
  'DC',
  'UL',
  'EN',
  'BS',
  'CISPR',
  'IEC',
  'RH',
  'VAC',
  'VDC',
  'W',
  'KW',
])

function toCsvValue(value) {
  const text = String(value ?? '')
  if (!text.includes(',') && !text.includes('"') && !text.includes('\n')) return text
  return `"${text.replaceAll('"', '""')}"`
}

function toCsv(rows) {
  return rows.map((row) => row.map((cell) => toCsvValue(cell)).join(',')).join('\n') + '\n'
}

function safeUpper(value) {
  return String(value ?? '').trim().toUpperCase()
}

function normalizeModelToken(token) {
  return safeUpper(token)
    .replace(/[–—]/g, '-')
    .replace(/^[^A-Z0-9]+/, '')
    .replace(/[^A-Z0-9)./_+-]+$/g, '')
}

function makeBaseCandidates(fileNameBase) {
  const rawUpper = safeUpper(fileNameBase).replace(/[–—]/g, '-')
  const noSpec = rawUpper.replace(/-SPEC$/i, '')
  const compact = noSpec.replace(/[^A-Z0-9]/g, '')
  const prefix = noSpec.includes('-') ? noSpec.slice(0, noSpec.lastIndexOf('-')) : noSpec
  const prefixCompact = prefix.replace(/[^A-Z0-9]/g, '')
  return { rawUpper, noSpec, compact, prefix, prefixCompact }
}

function isLikelyModelToken(token) {
  if (!token) return false
  if (NON_MODEL_TOKENS.has(token)) return false
  if (!/[A-Z]/.test(token) || !/\d/.test(token)) return false
  if (/^\d+([./-]\d+)*$/.test(token)) return false
  if (/^(?:[+-]?\d+(?:\.\d+)?)(?:W|KW)$/i.test(token)) return false
  if (/^(?:[+-]?\d+(?:\.\d+)?)(?:V|A|HZ|VAC|VDC|%|℃)$/i.test(token)) return false
  if (/^[A-Z]{1,3}$/.test(token)) return false
  return true
}

function matchBaseToken(token, baseCandidates) {
  if (!token) return false
  const compact = token.replace(/[^A-Z0-9]/g, '')
  if (!compact) return false

  if (compact.startsWith(baseCandidates.compact)) return true
  if (baseCandidates.prefixCompact && compact.startsWith(baseCandidates.prefixCompact)) return true
  if (baseCandidates.noSpec && token.startsWith(baseCandidates.noSpec)) return true
  if (baseCandidates.prefix && token.startsWith(baseCandidates.prefix)) return true
  return false
}

function looksLikeModelSuffixToken(token) {
  if (!token) return false
  if (NON_MODEL_TOKENS.has(token)) return false
  if (!/\d/.test(token)) return false
  if (!/^[A-Z0-9()./_+-]+$/.test(token)) return false
  if (/^\d+(?:\.\d+)?$/.test(token)) return true
  if (/^(?:[+-]?\d+(?:\.\d+)?)(?:W|KW|V|A|HZ|VAC|VDC|%|℃)$/i.test(token)) return false
  return true
}

function combineBaseWithSuffix(baseToken, suffixToken) {
  const base = normalizeModelToken(baseToken).replace(/[-/]+$/, '')
  const suffix = normalizeModelToken(suffixToken).replace(/^[-/]+/, '')
  if (!base || !suffix) return ''
  return `${base}-${suffix}`
}

function extractModelsFromText(text, baseCandidates, options = {}) {
  const allowUnmatched = Boolean(options.allowUnmatched)
  const upper = safeUpper(text)
  const pattern = /[A-Z0-9][A-Z0-9()./_+-]{1,}/g
  const tokens = []
  for (const m of upper.matchAll(pattern)) {
    const token = normalizeModelToken(m[0])
    if (!isLikelyModelToken(token)) continue
    tokens.push(token)
  }

  const seen = new Set()
  const ordered = []
  for (const token of tokens) {
    if (seen.has(token)) continue
    seen.add(token)
    ordered.push(token)
  }

  const matchedSeen = new Set()
  const unmatchedSeen = new Set()
  const matched = []
  const unmatched = []

  const pushMatched = (value) => {
    if (!value || matchedSeen.has(value)) return
    matchedSeen.add(value)
    matched.push(value)
  }

  const pushUnmatched = (value) => {
    if (!value || unmatchedSeen.has(value)) return
    unmatchedSeen.add(value)
    unmatched.push(value)
  }

  for (let i = 0; i < ordered.length; i += 1) {
    const token = ordered[i]
    const baseMatched = matchBaseToken(token, baseCandidates)
    if (baseMatched) pushMatched(token)
    else pushUnmatched(token)

    if (!baseMatched) continue
    const next = ordered[i + 1]
    if (!looksLikeModelSuffixToken(next)) continue
    if (matchBaseToken(next, baseCandidates)) continue

    const combined = combineBaseWithSuffix(token, next)
    if (!combined) continue
    if (!isLikelyModelToken(combined)) continue
    if (!matchBaseToken(combined, baseCandidates)) continue
    pushMatched(combined)
  }

  let filteredMatched = matched
  if (matched.length > 1) {
    const explicitBase = safeUpper(baseCandidates.noSpec)
    const hasSpecificVariants = matched.some((item) => item.startsWith(`${explicitBase}-`) && item !== explicitBase)
    if (hasSpecificVariants) {
      filteredMatched = matched.filter((item) => item !== explicitBase)
    }
  }

  if (filteredMatched.length) return filteredMatched
  return allowUnmatched ? unmatched : []
}

function extractPowerValues(text) {
  const result = []
  const upper = safeUpper(text).replace(/[–—]/g, '-')
  const pattern = /(\d+(?:\.\d+)?)\s*(K?W)\b/g
  for (const m of upper.matchAll(pattern)) {
    const raw = Number(m[1])
    if (!Number.isFinite(raw)) continue
    const unit = m[2]
    const value = unit === 'KW' ? raw * 1000 : raw
    result.push(value)
  }
  return result
}

function normalizeNumericText(value) {
  const text = String(value ?? '').trim()
  if (!text) return ''
  if (!text.includes('.')) return text
  return text.replace(/(\.\d*?)0+$/g, '$1').replace(/\.$/, '')
}

function extractVoltageValues(text) {
  const result = []
  const upper = safeUpper(text).replace(/[–—]/g, '-')
  const pattern = /(\d+(?:\.\d+)?)\s*V\b/g
  for (const m of upper.matchAll(pattern)) {
    const raw = normalizeNumericText(m[1])
    if (!raw) continue
    result.push(raw)
  }
  return result
}

function toRowsFromPageItems(items) {
  const byY = new Map()
  for (const item of items) {
    const y = Math.round(item.transform[5] * 10) / 10
    const x = item.transform[4]
    const str = String(item.str ?? '').trim()
    if (!str) continue
    if (!byY.has(y)) byY.set(y, [])
    byY.get(y).push({ x, str })
  }

  return [...byY.entries()]
    .map(([y, rowItems]) => {
      const sortedItems = rowItems.sort((a, b) => a.x - b.x)
      const text = sortedItems.map((it) => it.str).join(' ').replace(/\s+/g, ' ').trim()
      return { y, items: sortedItems, text }
    })
    .sort((a, b) => b.y - a.y)
}

function chooseModelRow(rows, baseCandidates) {
  let best = null
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]
    const hasModelKeyword = /\bMODEL\b/i.test(row.text)
    const hasOrderKeyword = /\bORDER\s*NO\.?\b/i.test(row.text)
    let models = extractModelsFromText(row.text, baseCandidates)
    let usedNeighborRow = false

    if ((hasModelKeyword || hasOrderKeyword) && models.length <= 1) {
      const stopPattern =
        /\b(?:DC\s*VOLTAGE|RATED\s*CURRENT|RATED\s*POWER|OUTPUT(?:\s+NUMBER)?|CURRENT\s*RANGE|SPECIFICATION|INPUT|FEATURE|NOTE)\b/i
      const mergedTexts = [row.text]
      for (let j = i + 1; j < rows.length && j <= i + 8; j += 1) {
        const nextText = rows[j]?.text ?? ''
        if (!nextText) continue
        if (stopPattern.test(nextText)) break
        mergedTexts.push(nextText)
      }

      if (mergedTexts.length > 1) {
        const mergedModels = extractModelsFromText(mergedTexts.join(' '), baseCandidates)
        if (mergedModels.length > models.length) {
          models = mergedModels
          usedNeighborRow = true
        }
      }

      const neighborOffsets = [1, 2, -1]
      for (const offset of neighborOffsets) {
        const neighbor = rows[i + offset]
        if (!neighbor) continue
        const candidate = extractModelsFromText(neighbor.text, baseCandidates)
        if (candidate.length <= models.length) continue
        models = candidate
        usedNeighborRow = true
        if (models.length > 1) break
      }
    }

    let score = 0
    if (hasModelKeyword) score += 12
    if (hasOrderKeyword) score += 10
    score += Math.min(models.length, 20) * 2
    if (models.length === 0) score -= 12
    if (usedNeighborRow) score += 8
    if (matchBaseToken(safeUpper(row.text), baseCandidates)) score += 2
    if (/^\s*FILE NAME[:\s]/i.test(row.text)) score -= 8
    if (/SINGLE OUTPUT|DUAL OUTPUT|TRIPLE OUTPUT|QUAD OUTPUT/i.test(row.text)) score -= 4
    if (/FEATURE|NOTE|WARRANTY|PACKING|DIMENSION|DERATING/i.test(row.text)) score -= 3

    if (!best || score > best.score) {
      best = { score, index: i, row, models }
    }
  }
  return best
}

function chooseVoltageRow(rows, modelRowIndex) {
  let best = null
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]
    const voltages = extractVoltageValues(row.text)
    if (voltages.length === 0) continue

    let score = voltages.length * 2
    if (/\bDC VOLTAGE\b/i.test(row.text)) score += 14
    if (/\bVOLTAGE\b/i.test(row.text)) score += 5

    if (/ADJ|TOLERANCE|RANGE|SETUP|HOLD UP|INPUT|OUTPUT/i.test(row.text)) score -= 3
    if (/FILE NAME|DIMENSION|NOTE|FEATURE/i.test(row.text)) score -= 6

    if (Number.isInteger(modelRowIndex)) {
      const distance = Math.abs(modelRowIndex - i)
      score += Math.max(0, 5 - distance)
    }

    if (!best || score > best.score) {
      best = { score, index: i, row, voltages }
    }
  }
  return best
}

function choosePowerRow(rows, modelRowIndex) {
  let best = null
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]
    const powers = extractPowerValues(row.text)
    if (powers.length === 0) continue

    let score = powers.length * 2
    if (/\bRATED POWER\b/i.test(row.text)) score += 16
    if (/\bOUTPUT POWER\b/i.test(row.text)) score += 12
    if (/\bMAX\.?\s*POWER\b/i.test(row.text)) score += 10
    if (/\bPOWER\b/i.test(row.text)) score += 4

    if (/RIPPLE|NOISE|LEAKAGE|DERATING|DIMENSION|WARRANTY|SEARCH|FILE NAME/i.test(row.text)) score -= 8
    if (/SINGLE OUTPUT|DUAL OUTPUT|TRIPLE OUTPUT|QUAD OUTPUT/i.test(row.text)) score -= 4

    if (Number.isInteger(modelRowIndex)) {
      const distance = Math.abs(modelRowIndex - i)
      score += Math.max(0, 6 - distance)
    }

    if (!best || score > best.score) {
      best = { score, index: i, row, powers }
    }
  }
  return best
}

function getPositionsFromRowItems(rowItems, models) {
  const output = []
  const upperItems = rowItems.map((it) => ({ x: it.x, str: safeUpper(it.str) }))
  for (const model of models) {
    const idx = upperItems.findIndex((it) => it.str === model || it.str.includes(model))
    if (idx >= 0) output.push({ model, x: upperItems[idx].x })
  }
  return output
}

function getPowerPositionsFromRowItems(rowItems) {
  const output = []
  for (const item of rowItems) {
    const values = extractPowerValues(item.str)
    for (const value of values) {
      output.push({ x: item.x, watt: value })
    }
  }
  return output
}

function mapModelsToPower(models, powers, modelRow, powerRow) {
  if (!models.length || !powers.length) return []
  if (models.length === powers.length) {
    return models.map((model, i) => ({ model, watt: powers[i], method: 'ordered' }))
  }
  if (powers.length === 1) {
    return models.map((model) => ({ model, watt: powers[0], method: 'single-power-for-all' }))
  }
  if (models.length === 1) {
    return [{ model: models[0], watt: powers[0], method: 'single-model-first-power' }]
  }

  if (modelRow && powerRow) {
    const modelPositions = getPositionsFromRowItems(modelRow.items, models)
    const powerPositions = getPowerPositionsFromRowItems(powerRow.items)
    if (modelPositions.length && powerPositions.length) {
      const used = new Set()
      const mapped = []
      for (const mp of modelPositions) {
        let best = null
        for (let i = 0; i < powerPositions.length; i += 1) {
          if (used.has(i)) continue
          const pp = powerPositions[i]
          const distance = Math.abs(mp.x - pp.x)
          if (!best || distance < best.distance) {
            best = { idx: i, watt: pp.watt, distance }
          }
        }
        if (best) {
          used.add(best.idx)
          mapped.push({ model: mp.model, watt: best.watt, method: 'x-position' })
        }
      }
      if (mapped.length) return mapped
    }
  }

  const min = Math.min(models.length, powers.length)
  return models.slice(0, min).map((model, i) => ({ model, watt: powers[i], method: 'ordered-truncated' }))
}

function deriveFallbackPowerFromFilename(fileNameBase) {
  const normalized = safeUpper(fileNameBase).replace(/-SPEC$/i, '')
  const match = normalized.match(/-(\d+(?:\.\d+)?)(?:[A-Z].*)?$/)
  if (!match) return null
  const value = Number(match[1])
  if (!Number.isFinite(value)) return null
  return value
}

function dedupeModelRows(rows) {
  const seen = new Set()
  const output = []
  for (const row of rows) {
    const key = `${row.pdf}|${row.model}`
    if (seen.has(key)) continue
    seen.add(key)
    output.push(row)
  }
  return output
}

async function listPdfFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const nested = await listPdfFiles(fullPath)
      files.push(...nested)
      continue
    }
    if (/\.pdf$/i.test(entry.name)) files.push(fullPath)
  }
  return files
}

async function readPageRows(pdfDoc, pageNumber) {
  const page = await pdfDoc.getPage(pageNumber)
  const content = await page.getTextContent()
  return toRowsFromPageItems(content.items)
}

async function chooseBestSelections(pdf, baseCandidates) {
  const maxPages = Math.min(pdf.numPages, 3)
  let best = null

  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
    const rows = await readPageRows(pdf, pageNumber)
    const modelSelection = chooseModelRow(rows, baseCandidates)
    const powerSelection = choosePowerRow(rows, modelSelection?.index)
    const voltageSelection = chooseVoltageRow(rows, modelSelection?.index)

    const modelCount = modelSelection?.models?.length ?? 0
    const powerCount = powerSelection?.powers?.length ?? 0
    const voltageCount = voltageSelection?.voltages?.length ?? 0
    const countAligned = modelCount > 1 && modelCount === powerCount

    let score = 0
    score += modelSelection?.score ?? -30
    score += powerSelection?.score ?? -30
    score += voltageSelection?.score ?? 0
    score += Math.min(modelCount, 12)
    score += Math.min(powerCount, 12)
    if (countAligned) score += 10
    if (modelCount === 1 && powerCount > 1 && powerCount === voltageCount) score += 4

    if (!best || score > best.score) {
      best = {
        score,
        rows,
        pageNumber,
        modelSelection,
        powerSelection,
        voltageSelection,
      }
    }
  }

  return best
}

async function extractForPdf(filePath) {
  const fileName = path.basename(filePath)
  const fileNameBase = fileName.replace(/\.pdf$/i, '')
  const baseCandidates = makeBaseCandidates(fileNameBase)

  const bytes = new Uint8Array(await fs.readFile(filePath))
  const loadingTask = pdfjs.getDocument({
    data: bytes,
    isEvalSupported: false,
    useSystemFonts: true,
  })
  const pdf = await loadingTask.promise

  const bestSelections = await chooseBestSelections(pdf, baseCandidates)
  const modelSelection = bestSelections?.modelSelection ?? null
  const powerSelection = bestSelections?.powerSelection ?? null
  const voltageSelection = bestSelections?.voltageSelection ?? null

  let extractedModels = [...(modelSelection?.models ?? [])]
  let extractedPowers = powerSelection?.powers ?? []
  const extractedVoltages = voltageSelection?.voltages ?? []
  const modelRowText = modelSelection?.row?.text ?? ''
  const modelRowHasModelKeyword = /\bMODEL\b/i.test(modelRowText)
  const modelRowHasOrderKeyword = /\bORDER\s*NO\.?\b/i.test(modelRowText)

  const canSynthesizeFromVoltage =
    extractedPowers.length > 1 &&
    extractedVoltages.length > 1 &&
    extractedPowers.length === extractedVoltages.length &&
    extractedModels.length <= 1 &&
    (!modelRowHasModelKeyword || modelRowHasOrderKeyword)

  if (canSynthesizeFromVoltage) {
    extractedModels = extractedVoltages.map((value) => `${baseCandidates.noSpec}-${value}`)
  }

  if (!extractedPowers.length) {
    const fallbackPower = deriveFallbackPowerFromFilename(fileNameBase)
    if (fallbackPower !== null) extractedPowers = [fallbackPower]
  }

  if (!extractedModels.length) {
    extractedModels.push(baseCandidates.noSpec)
  }

  const mapped = mapModelsToPower(extractedModels, extractedPowers, modelSelection?.row, powerSelection?.row)
  if (!mapped.length) {
    return {
      ok: false,
      fileName,
      reason: 'No mappable model/power pairs',
      modelCount: extractedModels.length,
      powerCount: extractedPowers.length,
      sampleModelRow: modelSelection?.row?.text ?? '',
      samplePowerRow: powerSelection?.row?.text ?? '',
    }
  }

  const rowsOut = mapped.map((item) => ({
    pdf: fileName,
    model: item.model,
    watt: item.watt,
    method: item.method,
  }))

  return {
    ok: true,
    fileName,
    rows: rowsOut,
    modelCount: extractedModels.length,
    powerCount: extractedPowers.length,
  }
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true })

  const pdfFiles = (await listPdfFiles(PDF_DIR)).sort((a, b) => a.localeCompare(b))
  const successRows = []
  const unresolved = []

  for (let i = 0; i < pdfFiles.length; i += 1) {
    const pdfPath = pdfFiles[i]
    const progress = `[${i + 1}/${pdfFiles.length}]`
    const relativePath = path.relative(ROOT_DIR, pdfPath)

    try {
      const result = await extractForPdf(pdfPath)
      if (result.ok) {
        successRows.push(...result.rows)
        console.log(`${progress} OK ${result.fileName} -> ${result.rows.length} rows`)
      } else {
        unresolved.push({
          pdf: result.fileName,
          reason: result.reason,
          modelCount: result.modelCount,
          powerCount: result.powerCount,
          sampleModelRow: result.sampleModelRow,
          samplePowerRow: result.samplePowerRow,
        })
        console.log(`${progress} FAIL ${result.fileName} -> ${result.reason}`)
      }
    } catch (error) {
      unresolved.push({
        pdf: path.basename(relativePath),
        reason: error?.message ?? String(error),
        modelCount: 0,
        powerCount: 0,
        sampleModelRow: '',
        samplePowerRow: '',
      })
      console.log(`${progress} ERROR ${path.basename(relativePath)} -> ${error?.message ?? String(error)}`)
    }
  }

  const deduped = dedupeModelRows(successRows)
    .sort((a, b) => {
      if (a.model !== b.model) return a.model.localeCompare(b.model)
      return a.pdf.localeCompare(b.pdf)
    })

  const outputRows = [['PDF', 'Model', 'Watt(W)', 'Method']]
  deduped.forEach((item) => outputRows.push([item.pdf, item.model, item.watt, item.method]))
  await fs.writeFile(OUT_CSV, toCsv(outputRows), 'utf8')

  const unresolvedRows = [['PDF', 'Reason', 'DetectedModels', 'DetectedPowers', 'ModelRowSample', 'PowerRowSample']]
  unresolved.forEach((item) => {
    unresolvedRows.push([
      item.pdf,
      item.reason,
      item.modelCount,
      item.powerCount,
      item.sampleModelRow,
      item.samplePowerRow,
    ])
  })
  await fs.writeFile(OUT_UNRESOLVED_CSV, toCsv(unresolvedRows), 'utf8')

  const summary = {
    pdfCount: pdfFiles.length,
    extractedPairs: deduped.length,
    unresolvedPdfCount: unresolved.length,
    outputCsv: path.relative(ROOT_DIR, OUT_CSV),
    unresolvedCsv: path.relative(ROOT_DIR, OUT_UNRESOLVED_CSV),
    createdAt: new Date().toISOString(),
  }
  await fs.writeFile(OUT_SUMMARY, `${JSON.stringify(summary, null, 2)}\n`, 'utf8')

  console.log('')
  console.log(`Done.`)
  console.log(`PDF files: ${summary.pdfCount}`)
  console.log(`Extracted rows: ${summary.extractedPairs}`)
  console.log(`Unresolved PDFs: ${summary.unresolvedPdfCount}`)
  console.log(`CSV: ${summary.outputCsv}`)
  console.log(`Unresolved: ${summary.unresolvedCsv}`)
}

await main()
