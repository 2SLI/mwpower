import { NEWS_FALLBACK_IMAGE } from '../../data/newsContent'

export const NEWS_POPUP_SUPPRESS_KEY = 'mwpower_news_popup_suppress_until'

export function normalizeIndex(index, length) {
  return (index + length) % length
}

export function handleNewsImageError(event) {
  const image = event.currentTarget
  if (!image || image.dataset.fallbackApplied === 'true') return
  image.dataset.fallbackApplied = 'true'
  image.src = NEWS_FALLBACK_IMAGE
}

export function getSingleSearchToken(value = '') {
  const tokens = String(value ?? '')
    .split(/[,\uFF0C]/)
    .map((token) => String(token ?? '').trim())
    .filter(Boolean)

  return tokens.length === 1 ? tokens[0] : ''
}

export function normalizeShortcutToken(value = '') {
  return String(value ?? '').trim().toLowerCase()
}

export function getNewsArticleUrl(article = {}) {
  return String(article?.articleUrl || article?.externalUrl || '').trim()
}

export function isBlogArticle(article = {}) {
  const articleUrl = getNewsArticleUrl(article)
  try {
    const hostname = new URL(articleUrl).hostname.toLowerCase()
    return hostname === 'blog.naver.com' || hostname === 'www.blog.naver.com'
  } catch {
    return /blog\.naver\.com/i.test(String(article?.sourceLabel ?? ''))
  }
}
