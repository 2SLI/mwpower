import fs from 'node:fs/promises'
import path from 'node:path'
import { leafModelTreeFallback } from '../src/data/leafModelTreeFallback.js'

const ROOT_DIR = process.cwd()
const INPUT_CSV_PATH = path.join(ROOT_DIR, 'output', 'all-model-wattage.csv')
const OUTPUT_JS_PATH = path.join(ROOT_DIR, 'src', 'data', 'modelOptionWattageMap.js')
const ALLOWED_METHODS = new Set(['ordered', 'x-position', 'single-power-for-all', 'ordered-truncated'])

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
    .toUpperCase()
}

function hasBalancedParentheses(value = '') {
  let depth = 0
  for (const ch of String(value ?? '')) {
    if (ch === '(') depth += 1
    if (ch === ')') {
      depth -= 1
      if (depth < 0) return false
    }
  }
  return depth === 0
}

function parseCsv(text = '') {
  const rows = []
  let current = []
  let field = ''
  let inQuotes = false

  const pushField = () => {
    current.push(field)
    field = ''
  }

  const pushRow = () => {
    if (current.length === 1 && current[0] === '') {
      current = []
      return
    }
    rows.push(current)
    current = []
  }

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
      continue
    }

    if (ch === ',') {
      pushField()
      continue
    }

    if (ch === '\n') {
      pushField()
      pushRow()
      continue
    }

    if (ch === '\r') continue
    field += ch
  }

  if (field.length > 0 || current.length > 0) {
    pushField()
    pushRow()
  }

  if (rows.length === 0) return []
  const header = rows[0].map((item) => String(item ?? '').trim())
  return rows.slice(1).map((row) => {
    const record = {}
    header.forEach((key, index) => {
      record[key] = String(row[index] ?? '').trim()
    })
    return record
  })
}

function collectBaseModels(records) {
  const map = new Map()

  const addModel = (value) => {
    const raw = String(value ?? '').trim()
    if (!raw) return
    const canonical = normalizeModelName(raw)
    if (!canonical) return
    if (!/[A-Z]/.test(canonical) || !/\d/.test(canonical)) return
    if (!map.has(canonical)) map.set(canonical, raw)
  }

  records.forEach((record) => {
    if (Array.isArray(record?.models)) {
      record.models.forEach(addModel)
    }

    if (Array.isArray(record?.groups)) {
      record.groups.forEach((group) => {
        if (Array.isArray(group?.models)) group.models.forEach(addModel)
      })
    }
  })

  return map
}

function getMostFrequentWatt(wattCounts) {
  let chosenValue = null
  let chosenCount = -1

  wattCounts.forEach((count, value) => {
    if (count > chosenCount) {
      chosenCount = count
      chosenValue = value
      return
    }

    if (count === chosenCount && chosenValue !== null && value < chosenValue) {
      chosenValue = value
    }
  })

  return chosenValue
}

function getMostFrequentValue(valueCounts) {
  let chosenValue = ''
  let chosenCount = -1

  valueCounts.forEach((count, value) => {
    if (count > chosenCount) {
      chosenCount = count
      chosenValue = value
      return
    }

    if (count === chosenCount) {
      const left = String(value ?? '')
      const right = String(chosenValue ?? '')
      if (left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' }) < 0) {
        chosenValue = value
      }
    }
  })

  return chosenValue
}

function naturalCompare(a, b) {
  return String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true, sensitivity: 'base' })
}

function methodWeight(method = '') {
  const normalized = String(method ?? '').trim().toLowerCase()
  if (normalized === 'ordered') return 5
  if (normalized === 'x-position') return 4
  if (normalized === 'single-model-first-power') return 3
  if (normalized === 'ordered-truncated') return 2
  if (normalized === 'single-power-for-all') return 1
  return 0
}

function parseWattFromModelName(model = '') {
  const text = normalizeModelName(model)
  if (!text) return null

  const kMatch = text.match(/(\d+(?:\.\d+)?)K(?:[^A-Z0-9]|$)/)
  if (kMatch) {
    const value = Number(kMatch[1])
    if (Number.isFinite(value)) return value * 1000
  }

  const numberMatches = [...text.matchAll(/(\d+(?:\.\d+)?)/g)]
  if (numberMatches.length === 0) return null
  const value = Number(numberMatches[numberMatches.length - 1][1])
  if (!Number.isFinite(value)) return null
  return value
}

function chooseWeightedWatt(wattWeights = new Map()) {
  let chosenWatt = null
  let chosenWeight = -1

  wattWeights.forEach((weight, watt) => {
    if (weight > chosenWeight) {
      chosenWeight = weight
      chosenWatt = watt
      return
    }
    if (weight === chosenWeight && chosenWatt !== null && watt < chosenWatt) {
      chosenWatt = watt
    }
  })

  return chosenWatt
}

function isFinitePositive(value) {
  return Number.isFinite(value) && value > 0
}

function normalizeMatchVariant(value = '') {
  return String(value ?? '')
    .replace(/\([^)]*\)/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

function getMatchVariants(canonicalModel = '') {
  const variants = []
  const seen = new Set()

  const push = (value) => {
    const text = String(value ?? '').trim()
    if (!text || seen.has(text)) return
    seen.add(text)
    variants.push(text)
  }

  push(canonicalModel)
  push(normalizeMatchVariant(canonicalModel))
  return variants
}

function findBaseMatch(canonicalModel, baseModelSet, sortedBaseCandidates) {
  if (!canonicalModel) return null

  for (const variant of getMatchVariants(canonicalModel)) {
    let hyphenCandidate = ''
    let cursor = variant

    while (cursor.includes('-')) {
      cursor = cursor.slice(0, cursor.lastIndexOf('-'))
      if (baseModelSet.has(cursor)) {
        hyphenCandidate = cursor
        break
      }
    }

    if (hyphenCandidate) {
      return { base: hyphenCandidate, matchedModel: variant }
    }

    for (const base of sortedBaseCandidates) {
      if (!variant.startsWith(base)) continue
      if (variant.length <= base.length) continue

      const suffix = variant.slice(base.length)
      if (!suffix) continue
      if (!/^[A-Z0-9(][A-Z0-9()./+:-]*$/.test(suffix)) continue
      if (!hasBalancedParentheses(suffix)) continue
      return { base, matchedModel: variant }
    }
  }

  return null
}

async function main() {
  const csvText = await fs.readFile(INPUT_CSV_PATH, 'utf8')
  const parsedRows = parseCsv(csvText)
  const baseModels = collectBaseModels(leafModelTreeFallback)
  const baseModelSet = new Set(baseModels.keys())
  const baseCandidatesByLength = [...baseModelSet].sort((a, b) => b.length - a.length)

  const modelWattStats = new Map()

  parsedRows.forEach((row) => {
    const method = String(row?.Method ?? '').trim().toLowerCase()
    if (!ALLOWED_METHODS.has(method)) return

    const rawModel = String(row?.Model ?? '').trim()
    if (!rawModel) return

    const canonicalModel = normalizeModelName(rawModel)
    if (!canonicalModel) return
    if (!/[A-Z]/.test(canonicalModel) || !/\d/.test(canonicalModel)) return
    if (canonicalModel.length < 4) return
    if (!/^[A-Z0-9()./+:-]+$/.test(canonicalModel)) return
    if (!hasBalancedParentheses(canonicalModel)) return
    if (canonicalModel.includes('SPEC')) return

    const watt = Number(row?.['Watt(W)'] ?? '')
    if (!Number.isFinite(watt) || watt <= 0) return

    const dcVoltage = String(row?.['DC Voltage(V)'] ?? '').trim()

    const current = modelWattStats.get(canonicalModel) ?? {
      displayModel: rawModel,
      wattCounts: new Map(),
      dcVoltageCounts: new Map(),
    }

    if (rawModel.length > current.displayModel.length) {
      current.displayModel = rawModel
    }

    current.wattCounts.set(watt, (current.wattCounts.get(watt) ?? 0) + 1)
    if (dcVoltage) {
      current.dcVoltageCounts.set(dcVoltage, (current.dcVoltageCounts.get(dcVoltage) ?? 0) + 1)
    }
    modelWattStats.set(canonicalModel, current)
  })

  const optionMap = new Map()
  const baseDirectWattWeights = new Map()

  modelWattStats.forEach((stats, canonicalModel) => {
    if (baseModelSet.has(canonicalModel)) return

    const baseMatch = findBaseMatch(canonicalModel, baseModelSet, baseCandidatesByLength)
    if (!baseMatch) return

    const baseCandidate = baseMatch.base
    const matchedModel = baseMatch.matchedModel
    const hasHyphenSuffix = matchedModel.startsWith(`${baseCandidate}-`)
    const suffix = hasHyphenSuffix
      ? matchedModel.slice(baseCandidate.length + 1)
      : matchedModel.slice(baseCandidate.length)
    if (!suffix) return
    if (hasHyphenSuffix) {
      if (!/^[A-Z0-9](?:[A-Z0-9().+-]*[A-Z0-9)])?$/.test(suffix)) return
    } else if (!/^[A-Z0-9(][A-Z0-9()./+:-]*$/.test(suffix)) {
      return
    }
    if (!hasBalancedParentheses(suffix)) return

    const watt = getMostFrequentWatt(stats.wattCounts)
    if (!Number.isFinite(watt)) return

    const dcVoltage = String(getMostFrequentValue(stats.dcVoltageCounts) ?? '').trim()
    const optionModel = hasHyphenSuffix ? `${baseCandidate}-${suffix}` : `${baseCandidate}${suffix}`

    if (!optionMap.has(baseCandidate)) optionMap.set(baseCandidate, [])
    optionMap.get(baseCandidate).push({
      model: optionModel,
      watt,
      dcVoltage,
    })
  })

  parsedRows.forEach((row) => {
    const rawModel = String(row?.Model ?? '').trim()
    if (!rawModel) return
    const canonicalModel = normalizeModelName(rawModel)
    if (!canonicalModel || !baseModelSet.has(canonicalModel)) return

    const watt = Number(row?.['Watt(W)'] ?? '')
    if (!Number.isFinite(watt) || watt <= 0) return

    const weight = methodWeight(row?.Method)
    if (weight <= 0) return

    if (!baseDirectWattWeights.has(canonicalModel)) {
      baseDirectWattWeights.set(canonicalModel, new Map())
    }

    const weightMap = baseDirectWattWeights.get(canonicalModel)
    weightMap.set(watt, (weightMap.get(watt) ?? 0) + weight)
  })

  baseModels.forEach((baseDisplay, baseCanonical) => {
    const existing = optionMap.get(baseCanonical)
    if (Array.isArray(existing) && existing.length > 0) return

    const weightedWatt = chooseWeightedWatt(baseDirectWattWeights.get(baseCanonical))
    const parsedWatt = parseWattFromModelName(baseCanonical)

    let fallbackWatt = null
    if (isFinitePositive(weightedWatt) && isFinitePositive(parsedWatt)) {
      const diffRatio = Math.abs(weightedWatt - parsedWatt) / parsedWatt
      fallbackWatt = diffRatio > 0.2 ? parsedWatt : weightedWatt
    } else if (isFinitePositive(weightedWatt)) {
      fallbackWatt = weightedWatt
    } else {
      fallbackWatt = parsedWatt
    }

    if (!isFinitePositive(fallbackWatt)) return

    optionMap.set(baseCanonical, [{ model: normalizeModelName(baseDisplay), watt: fallbackWatt, dcVoltage: '' }])
  })

  const output = {}

  ;[...optionMap.keys()]
    .sort((a, b) => naturalCompare(baseModels.get(a) ?? a, baseModels.get(b) ?? b))
    .forEach((baseCanonical) => {
      const baseDisplay = baseModels.get(baseCanonical) ?? baseCanonical
      const normalizedBase = normalizeLabel(baseDisplay)
      const options = optionMap.get(baseCanonical) ?? []

      const dedupedByModel = new Map()
      options.forEach((item) => {
        const key = normalizeModelName(item.model)
        if (!key) return
        if (!dedupedByModel.has(key)) {
          dedupedByModel.set(key, { ...item })
          return
        }
        const prev = dedupedByModel.get(key)
        if (!prev.dcVoltage && item.dcVoltage) prev.dcVoltage = item.dcVoltage

        if (Number(item.watt) < Number(prev.watt)) {
          dedupedByModel.set(key, {
            ...item,
            dcVoltage: item.dcVoltage || prev.dcVoltage || '',
          })
        }
      })

      const sortedOptions = [...dedupedByModel.values()]
        .sort((a, b) => naturalCompare(a.model, b.model))
        .map((item) => {
          const result = {
            model: item.model,
            watt: Number(item.watt),
          }
          const dcVoltage = String(item.dcVoltage ?? '').trim()
          if (dcVoltage) result.dcVoltage = dcVoltage
          return result
        })

      if (sortedOptions.length > 0) {
        output[normalizedBase] = sortedOptions

        const aliasBase = normalizeLabel(String(baseDisplay).replace(/\([^)]*\)/g, ''))
        if (aliasBase && aliasBase !== normalizedBase && !output[aliasBase]) {
          output[aliasBase] = sortedOptions
        }
      }
    })

  const sourceRowCount = parsedRows.length
  const mappedBaseCount = Object.keys(output).length
  const mappedOptionCount = Object.values(output).reduce((sum, list) => sum + list.length, 0)

  const fileContents = `// Auto-generated by scripts/generate-model-option-wattage-map.mjs\n// Source: output/all-model-wattage.csv\nexport const modelOptionWattageMap = ${JSON.stringify(output, null, 2)}\n`

  await fs.writeFile(OUTPUT_JS_PATH, fileContents, 'utf8')

  console.log(`Wrote ${path.relative(ROOT_DIR, OUTPUT_JS_PATH)}`)
  console.log(`Source rows: ${sourceRowCount}`)
  console.log(`Mapped base models: ${mappedBaseCount}`)
  console.log(`Mapped option rows: ${mappedOptionCount}`)
}

await main()
