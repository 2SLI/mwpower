import { getNewsSourceLabel, normalizeNewsLink } from './newsLink'
import { NEWS_FALLBACK_IMAGE } from '../data/newsContent'

const PREVIEW_TIMEOUT_MS = 9000

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

function withTimeout(promise, timeoutMs = PREVIEW_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error('Preview request timed out')), timeoutMs)
    }),
  ])
}

function normalizePreviewTargetUrl(articleUrl = '') {
  try {
    const url = new URL(articleUrl)
    const host = url.hostname.toLowerCase()

    if (host === 'blog.naver.com' || host === 'www.blog.naver.com') {
      const [, blogId = '', logNo = ''] = url.pathname.split('/')
      const queryBlogId = url.searchParams.get('blogId') || ''
      const queryLogNo = url.searchParams.get('logNo') || ''
      const resolvedBlogId = queryBlogId || blogId
      const resolvedLogNo = queryLogNo || logNo

      if (resolvedBlogId && resolvedLogNo && /^\d+$/.test(resolvedLogNo)) {
        return `https://m.blog.naver.com/${resolvedBlogId}/${resolvedLogNo}`
      }
    }
  } catch {
    return articleUrl
  }

  return articleUrl
}

function buildFallbackTitle(articleUrl = '') {
  const sourceLabel = getNewsSourceLabel(articleUrl)
  return sourceLabel && sourceLabel !== '외부 뉴스' ? `${sourceLabel} 게시글` : '블로그 게시글'
}

async function fetchMicrolinkPreview(articleUrl = '') {
  const targetUrl = normalizePreviewTargetUrl(articleUrl)
  const response = await withTimeout(fetch(`https://api.microlink.io/?url=${encodeURIComponent(targetUrl)}&screenshot=true`))
  if (!response.ok) throw new Error('Microlink preview request failed')

  const result = await response.json()
  const data = result?.data ?? {}

  return {
    articleUrl,
    title: pickText(data.title, data.publisher),
    summary: pickText(data.description),
    image: pickImage(data.image?.url, data.logo?.url, data.screenshot?.url),
    sourceLabel: getNewsSourceLabel(articleUrl),
  }
}

export async function fetchNewsLinkPreview(value = '') {
  const articleUrl = normalizeNewsLink(value)
  if (!articleUrl) return null

  try {
    const apiPreview = await fetchMicrolinkPreview(articleUrl)
    if (apiPreview?.title || apiPreview?.image) return apiPreview
  } catch {
    // Fall through to a usable link-only preview.
  }

  return {
    articleUrl,
    title: buildFallbackTitle(articleUrl),
    summary: '',
    image: NEWS_FALLBACK_IMAGE,
    sourceLabel: getNewsSourceLabel(articleUrl),
  }
}
