import { getNewsSourceLabel, normalizeNewsLink } from './newsLink'

function normalizeText(value = '') {
  return String(value ?? '').trim()
}

function pickText(...values) {
  return values.map((value) => normalizeText(value)).find(Boolean) || ''
}

function pickImage(...values) {
  return values
    .map((value) => normalizeText(value))
    .find((value) => /^https?:\/\//i.test(value)) || ''
}

function buildFallbackTitle(articleUrl = '') {
  const sourceLabel = getNewsSourceLabel(articleUrl)
  return sourceLabel && sourceLabel !== '외부 뉴스' ? `${sourceLabel} 게시글` : '블로그 게시글'
}

export async function fetchNewsLinkPreview(value = '') {
  const articleUrl = normalizeNewsLink(value)
  if (!articleUrl) return null

  try {
    const response = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(articleUrl)}`)
    if (!response.ok) throw new Error('Preview request failed')

    const result = await response.json()
    const data = result?.data ?? {}

    return {
      articleUrl,
      title: pickText(data.title, data.publisher, buildFallbackTitle(articleUrl)),
      summary: pickText(data.description),
      image: pickImage(data.image?.url, data.logo?.url),
      sourceLabel: getNewsSourceLabel(articleUrl),
    }
  } catch {
    return {
      articleUrl,
      title: buildFallbackTitle(articleUrl),
      summary: '',
      image: '',
      sourceLabel: getNewsSourceLabel(articleUrl),
    }
  }
}
