import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { leafModelTreeFallback } from '../src/data/leafModelTreeFallback.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TARGET_PATH = path.resolve(__dirname, '../src/data/featureTranslationsKo.js')

const preservePatterns = [
  /\b(?:AC\/DC|DC\/DC|DC\/AC|AC\/AC)\b/gi,
  /\b(?:CANBus|MODBus|PMBus|I2C|RS\s*-\s*485|USB(?:\s*-\s*[0-9A-Z]+)?|QC\d(?:\.\d)?|PD\d(?:\.\d)?)\b/gi,
  /\b(?:UL|TUV|CB|IEC|EN|KC|RCM|PSE|SIRIM|BIS|EAC|BSMI|CCC|EISA|DoE|NRCan|ErP|CoC|MOOP|MOPP|BF|FG|DNV|SEMI|HazLoc|C1D2|OVC)\b/gi,
  /\bIP\d{2}\b/gi,
  /\b[A-Z]{2,}[A-Z0-9]*(?:\s*-\s*[A-Z0-9]+)+(?:\s*\/\s*[A-Z0-9-]+)*\b/g,
]

function getUniqueFeatures() {
  const seen = new Set()
  const output = []

  for (const record of leafModelTreeFallback) {
    if (!Array.isArray(record?.features)) continue
    for (const value of record.features) {
      const text = String(value ?? '').trim()
      if (!text) continue
      if (seen.has(text)) continue
      seen.add(text)
      output.push(text)
    }
  }

  return output.sort((a, b) => a.localeCompare(b))
}

function protectTerms(text) {
  const tokens = []
  let output = text

  const protectOne = (match) => {
    const placeholder = `__MWP_TOKEN_${tokens.length}__`
    tokens.push(match)
    return placeholder
  }

  for (const pattern of preservePatterns) {
    output = output.replace(pattern, protectOne)
  }

  return { protectedText: output, tokens }
}

function restoreTerms(text, tokens) {
  let output = text
  tokens.forEach((token, index) => {
    output = output.replaceAll(`__MWP_TOKEN_${index}__`, token)
  })
  return output
}

async function translateText(sourceText) {
  const { protectedText, tokens } = protectTerms(sourceText)
  const query = encodeURIComponent(protectedText)
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=${query}`

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      const translated = (data?.[0] ?? []).map((item) => item?.[0] ?? '').join('').trim()
      if (!translated) return sourceText

      return restoreTerms(
        translated
          .replace(/\s+([,.)/])/g, '$1')
          .replace(/([(])\s+/g, '$1')
          .replace(/\s{2,}/g, ' ')
          .trim(),
        tokens
      )
    } catch (error) {
      if (attempt >= 3) {
        console.warn(`[translate] fallback to original: ${sourceText}`)
        return sourceText
      }
      await new Promise((resolve) => setTimeout(resolve, 350 * attempt))
    }
  }

  return sourceText
}

async function main() {
  const features = getUniqueFeatures()
  const mapping = {}

  console.log(`Translating ${features.length} unique feature strings...`)

  for (let index = 0; index < features.length; index += 1) {
    const source = features[index]
    const target = /[A-Za-z]/.test(source) ? await translateText(source) : source
    mapping[source] = target

    if ((index + 1) % 40 === 0 || index + 1 === features.length) {
      console.log(`  ${index + 1}/${features.length}`)
    }

    await new Promise((resolve) => setTimeout(resolve, 45))
  }

  const lines = [
    'export const featureTranslationsKo = ',
    `${JSON.stringify(mapping, null, 2)}`,
    '',
  ]

  await mkdir(path.dirname(TARGET_PATH), { recursive: true })
  await writeFile(TARGET_PATH, lines.join('\n'), 'utf8')
  console.log(`Saved: ${TARGET_PATH}`)
}

await main()
