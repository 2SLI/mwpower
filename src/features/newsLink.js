const BLOCKED_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtu.be'])

function normalizeText(value = '') {
  return String(value ?? '').trim()
}

function isBlockedHost(host = '') {
  const text = normalizeText(host).toLowerCase()
  return BLOCKED_HOSTS.has(text)
}

export function normalizeNewsLink(value = '') {
  const text = normalizeText(value)
  if (!text) return ''

  const candidate = text.startsWith('http://') || text.startsWith('https://') ? text : `https://${text}`

  try {
    const url = new URL(candidate)
    const protocol = url.protocol.toLowerCase()
    const host = url.hostname.toLowerCase()
    if ((protocol !== 'http:' && protocol !== 'https:') || !host || isBlockedHost(host)) return ''
    return url.toString()
  } catch {
    return ''
  }
}

export function isSupportedNewsLink(value = '') {
  return normalizeNewsLink(value).length > 0
}

export function getNewsSourceLabel(value = '') {
  const normalizedLink = normalizeNewsLink(value)
  if (!normalizedLink) return '외부 뉴스'

  try {
    return new URL(normalizedLink).hostname.replace(/^www\./i, '')
  } catch {
    return '외부 뉴스'
  }
}
