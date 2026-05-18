import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { NEWS_FALLBACK_IMAGE, getAllNewsSorted } from '../data/newsContent'
import { meanwellNewsTranslationsKoByUrl } from '../data/newsTranslationsKo'
import { getNewsSourceLabel, isSupportedNewsLink, normalizeNewsLink } from './newsLink'

const NEWS_COLLECTION = 'newsArticles'
const DEFAULT_NEWS_TITLE = '새 뉴스'
const DEFAULT_NEWS_SUMMARY = ''

function normalizeText(value = '') {
  return String(value ?? '').trim()
}

function getTodayDateInSeoul() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return formatter.format(new Date())
}

function normalizeDate(value = '') {
  const text = normalizeText(value)
  if (!text) return ''

  const match = text.match(/^(\d{4})[-/.](\d{2})[-/.](\d{2})$/)
  if (!match) return text
  return `${match[1]}-${match[2]}-${match[3]}`
}

function hasKoreanText(value = '') {
  return /[가-힣]/.test(String(value ?? ''))
}

function getMeanwellNewsTranslation(articleUrl = '') {
  return meanwellNewsTranslationsKoByUrl[normalizeNewsLink(articleUrl)] ?? null
}

function toTimestamp(dateText) {
  const normalized = normalizeDate(dateText)
  if (!normalized) return 0
  const ts = new Date(`${normalized}T00:00:00+09:00`).getTime()
  return Number.isFinite(ts) ? ts : 0
}

function sortNewsArticles(items) {
  return [...items].sort((a, b) => {
    const diff = toTimestamp(b.date) - toTimestamp(a.date)
    if (diff !== 0) return diff
    return String(b.id ?? '').localeCompare(String(a.id ?? ''))
  })
}

function normalizeNewsArticle(item = {}, idFromDoc = '') {
  const id = normalizeText(item.id || idFromDoc)
  const articleUrl = normalizeNewsLink(item.articleUrl || item.externalUrl || item.url)
  if (!id || !articleUrl || !isSupportedNewsLink(articleUrl)) return null

  const date = normalizeDate(item.date || item.createdAtClient?.slice?.(0, 10)) || getTodayDateInSeoul()
  const originalTitle = normalizeText(item.originalTitle || item.title)
  const originalSummary = normalizeText(item.originalSummary || item.summary)
  const translation = getMeanwellNewsTranslation(articleUrl)
  const title = translation?.title || originalTitle || DEFAULT_NEWS_TITLE
  const summary = translation?.summary || originalSummary || DEFAULT_NEWS_SUMMARY
  const body = Array.isArray(translation?.body) ? translation.body.map(normalizeText).filter(Boolean) : []
  const keyPoints = Array.isArray(translation?.keyPoints) ? translation.keyPoints.map(normalizeText).filter(Boolean) : []
  const image = normalizeText(item.image || item.thumbnail) || NEWS_FALLBACK_IMAGE

  return {
    id,
    date,
    title,
    summary,
    originalTitle: originalTitle && originalTitle !== title && !hasKoreanText(originalTitle) ? originalTitle : '',
    originalSummary: originalSummary && originalSummary !== summary && !hasKoreanText(originalSummary) ? originalSummary : '',
    body,
    keyPoints,
    image,
    thumbnail: image,
    articleUrl,
    externalUrl: articleUrl,
    sourceLabel: normalizeText(item.sourceLabel) || getNewsSourceLabel(articleUrl),
    isPublished: item.isPublished !== false,
    source: normalizeText(item.source || 'firestore'),
  }
}

export function normalizeNewsItems(items = []) {
  return items
    .map((item, index) => normalizeNewsArticle(item, item?.id || `local-${index}`))
    .filter(Boolean)
}

function toNewsWritePayload(input = {}) {
  const articleUrl = normalizeNewsLink(input.articleUrl || input.externalUrl || input.url)

  return {
    date: normalizeDate(input.date) || getTodayDateInSeoul(),
    title: normalizeText(input.title) || DEFAULT_NEWS_TITLE,
    summary: normalizeText(input.summary) || DEFAULT_NEWS_SUMMARY,
    image: normalizeText(input.image || input.thumbnail),
    thumbnail: normalizeText(input.thumbnail || input.image),
    articleUrl,
    externalUrl: articleUrl,
    sourceLabel: getNewsSourceLabel(articleUrl),
    isPublished: input.isPublished !== false,
    updatedAt: serverTimestamp(),
  }
}

async function fetchFirestoreNewsArticles() {
  const snapshot = await getDocs(collection(db, NEWS_COLLECTION))
  return snapshot.docs
    .map((item) => normalizeNewsArticle({ id: item.id, ...item.data() }, item.id))
    .filter(Boolean)
}

export async function loadNewsArticlesForAdmin() {
  try {
    const firestoreArticles = await fetchFirestoreNewsArticles()
    return { articles: sortNewsArticles(firestoreArticles), source: 'firestore' }
  } catch {
    return { articles: [], source: 'error' }
  }
}

export async function loadNewsArticlesForPublic() {
  const localArticles = normalizeNewsItems(getAllNewsSorted())

  try {
    const firestoreArticles = await fetchFirestoreNewsArticles()
    const merged = new Map()

    firestoreArticles
      .filter((item) => item.isPublished !== false)
      .forEach((item) => {
        merged.set(item.id, item)
      })

    localArticles.forEach((item) => {
      if (!merged.has(item.id)) merged.set(item.id, item)
    })

    return {
      articles: sortNewsArticles(Array.from(merged.values())),
      source: firestoreArticles.length > 0 ? 'firestore+local' : 'local',
    }
  } catch {
    return { articles: localArticles, source: 'local' }
  }
}

export async function createNewsArticle(input = {}) {
  const payload = toNewsWritePayload(input)
  if (!payload.articleUrl) {
    throw new Error('필수 항목(articleUrl)이 비어 있습니다.')
  }

  const created = await addDoc(collection(db, NEWS_COLLECTION), {
    ...payload,
    createdAt: serverTimestamp(),
    createdAtClient: new Date().toISOString(),
  })

  return created.id
}

export async function updateNewsArticle(articleId, input = {}) {
  const id = normalizeText(articleId)
  if (!id) throw new Error('수정할 뉴스 ID가 없습니다.')

  const payload = toNewsWritePayload(input)
  if (!payload.articleUrl) {
    throw new Error('필수 항목(articleUrl)이 비어 있습니다.')
  }

  await updateDoc(doc(db, NEWS_COLLECTION, id), payload)
}

export async function removeNewsArticle(articleId) {
  const id = normalizeText(articleId)
  if (!id) return
  await deleteDoc(doc(db, NEWS_COLLECTION, id))
}
