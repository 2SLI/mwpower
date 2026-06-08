function normalizeLabel(value = '') {
  const text = typeof value === 'string' ? value : String(value ?? '')
  return text
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

export function collectUniqueOptionValues(values = []) {
  const output = []
  const seen = new Set()
  values.forEach((value) => {
    const text = String(value ?? '').trim()
    const key = normalizeLabel(text)
    if (!key || seen.has(key)) return
    seen.add(key)
    output.push(text)
  })
  return output
}

export const COMBINED_OPTION_TYPE_STOP_WORDS = new Set([
  'ALL',
  'AND',
  'APPLYING',
  'BATTERY',
  'BY',
  'CLASS',
  'COMMUNICATION',
  'CONTROL',
  'DIRECT',
  'DIMMING',
  'FOR',
  'FUNCTION',
  'GTIN',
  'HAZARDOUS',
  'HTTPS',
  'IN',
  'INPUT',
  'LEVEL',
  'MODEL',
  'MW',
  'NONE',
  'NORMAL',
  'NOTE',
  'OPTION',
  'OUTPUT',
  'PLEASE',
  'PROTOCOL',
  'REQUEST',
  'STOCK',
  'THE',
  'TYPE',
  'WITH',
])

export const ELG_150_FUNCTION_TOKENS = new Set(['A', 'B', 'AB', 'DA', 'D2', 'DX'])
export const ELG_150_DEFAULT_WIRING_TOKENS = ['3Y']

export function normalizeCombinedTypeToken(value = '') {
  return String(value ?? '').trim().replace(/[–—]/g, '-').replace(/\s+/g, '').toUpperCase()
}

export function formatCombinedTypeToken(value = '') {
  const upper = normalizeCombinedTypeToken(value)
  if (!upper) return ''
  if (COMBINED_OPTION_TYPE_STOP_WORDS.has(upper)) return ''
  if (upper === 'BLANK') return 'Blank'
  if (!/^[A-Z0-9]{1,4}$/.test(upper)) return ''
  if (upper === 'DX') return 'Dx'
  return upper
}

export function collectTypeTokensFromOptionItem(item) {
  const rawValues = []

  if (Array.isArray(item?.additionalOptions)) rawValues.push(...item.additionalOptions)
  if (Array.isArray(item?.protocolOptions)) rawValues.push(...item.protocolOptions)

  const singleAdditional = String(item?.additionalOption ?? item?.protocolOption ?? '').trim()
  if (singleAdditional) rawValues.push(singleAdditional)

  return collectUniqueOptionValues(rawValues.map((value) => formatCombinedTypeToken(value)).filter(Boolean))
}

export function hasTokenSuffixInLabel(label = '', token = '') {
  const normalizedToken = normalizeLabel(token).toUpperCase()
  if (!normalizedToken) return false
  const escapedToken = normalizedToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?:-|\\d|\\))${escapedToken}$`).test(String(label ?? '').toUpperCase())
}

export function isElg150Model(value = '') {
  return /^ELG-150(?:-|$)/i.test(String(value ?? '').trim())
}

export function buildElg150CombinedLabels({ baseLabel = '', typeTokens = [] }) {
  const functionTokens = []
  const wiringTokens = []
  const extraTokens = []
  let hasBlankFunction = false

  typeTokens.forEach((token) => {
    const normalizedToken = normalizeLabel(token).toUpperCase()
    if (!normalizedToken) return

    if (normalizedToken === 'BLANK') {
      hasBlankFunction = true
      return
    }

    if (ELG_150_FUNCTION_TOKENS.has(normalizedToken)) {
      functionTokens.push(token)
      return
    }

    if (/^\d+[A-Z]{1,3}$/.test(normalizedToken)) {
      wiringTokens.push(token)
      return
    }

    extraTokens.push(token)
  })

  const functionVariants = []

  if (hasBlankFunction || functionTokens.length === 0) functionVariants.push(baseLabel)

  functionTokens.forEach((token) => {
    if (hasTokenSuffixInLabel(baseLabel, token)) {
      functionVariants.push(baseLabel)
      return
    }
    functionVariants.push(`${baseLabel}${token}`)
  })

  const normalizedWiringTokens = collectUniqueOptionValues([...wiringTokens, ...ELG_150_DEFAULT_WIRING_TOKENS])
  const normalizedExtraTokens = collectUniqueOptionValues(extraTokens)
  const labels = []

  collectUniqueOptionValues(functionVariants).forEach((variant) => {
    labels.push(variant)

    normalizedWiringTokens.forEach((token) => {
      if (hasTokenSuffixInLabel(variant, token)) {
        labels.push(variant)
        return
      }
      labels.push(`${variant}-${token}`)
    })

    normalizedExtraTokens.forEach((token) => {
      if (hasTokenSuffixInLabel(variant, token)) {
        labels.push(variant)
        return
      }
      labels.push(`${variant}-${token}`)
    })
  })

  return labels
}

export function buildVoltageOptionLabel({ optionModel = '', dcVoltage = '', selectedModel = '' }) {
  const optionModelText = String(optionModel ?? '').trim()
  const selectedModelText = String(selectedModel ?? '').trim()
  const selectedHyphenCount = (selectedModelText.match(/-/g) ?? []).length
  const selectedBase = selectedHyphenCount >= 2 ? selectedModelText.replace(/-\d+(?:\.\d+)?$/, '') : selectedModelText
  const selectedBaseUpper = String(selectedBase ?? '').toUpperCase()
  const optionModelUpper = optionModelText.toUpperCase()

  if (optionModelText && selectedBaseUpper && optionModelUpper.startsWith(selectedBaseUpper) && optionModelUpper !== selectedBaseUpper) {
    return optionModelText
  }

  if (
    optionModelText &&
    (!selectedBaseUpper || (optionModelUpper.startsWith(`${selectedBaseUpper}-`) && optionModelUpper !== selectedBaseUpper))
  ) {
    return optionModelText
  }

  const voltageText = String(dcVoltage ?? '').trim()
  if (!voltageText) return optionModelText

  const escapedVoltage = String(voltageText).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (optionModelText && new RegExp(`-${escapedVoltage}(?:[A-Z]{0,4})$`, 'i').test(optionModelText)) {
    return optionModelText
  }

  if (selectedBase) return `${selectedBase}-${voltageText}`
  return voltageText
}

export function buildCombinedOptionModelLabels({ options = [], selectedModel = '' }) {
  const labels = []

  options.forEach((item) => {
    const baseLabel =
      buildVoltageOptionLabel({
        optionModel: item?.model,
        dcVoltage: item?.dcVoltage,
        selectedModel,
      }) ||
      String(item?.model ?? '').trim() ||
      String(selectedModel ?? '').trim()

    if (!baseLabel) return

    const typeTokens = collectTypeTokensFromOptionItem(item)
    if (typeTokens.length === 0) {
      labels.push(baseLabel)
      return
    }

    const shouldApplyElg150Rule =
      isElg150Model(baseLabel) || isElg150Model(item?.model) || isElg150Model(selectedModel)

    if (shouldApplyElg150Rule) {
      labels.push(...buildElg150CombinedLabels({ baseLabel, typeTokens }))
      return
    }

    let hasBlank = false
    typeTokens.forEach((token) => {
      if (normalizeLabel(token) === 'blank') {
        hasBlank = true
        return
      }
      if (hasTokenSuffixInLabel(baseLabel, token)) {
        labels.push(baseLabel)
        return
      }
      labels.push(`${baseLabel}-${token}`)
    })

    if (hasBlank) labels.push(baseLabel)
  })

  return collectUniqueOptionValues(labels).sort((a, b) =>
    String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true, sensitivity: 'base' })
  )
}
