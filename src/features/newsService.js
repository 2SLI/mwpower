import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { getAllNewsSorted, newsCategories as defaultNewsCategories, NEWS_ALL_CATEGORY } from '../data/newsContent'

const NEWS_COLLECTION = 'newsArticles'

function normalizeText(value = '') {
  return String(value ?? '').trim()
}

function normalizeDate(value = '') {
  const text = normalizeText(value)
  if (!text) return ''

  const match = text.match(/^(\d{4})[-/.](\d{2})[-/.](\d{2})$/)
  if (!match) return text
  return `${match[1]}-${match[2]}-${match[3]}`
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeText(item)).filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(/\r?\n/)
      .map((item) => normalizeText(item))
      .filter(Boolean)
  }

  return []
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
  const category = normalizeText(item.category)
  const date = normalizeDate(item.date)
  const title = normalizeText(item.title)
  if (!id || !category || !date || !title) return null

  return {
    id,
    category,
    date,
    title,
    summary: normalizeText(item.summary),
    author: normalizeText(item.author),
    email: normalizeText(item.email),
    image: normalizeText(item.image),
    imageCaption: normalizeText(item.imageCaption),
    paragraphs: normalizeStringArray(item.paragraphs),
    bullets: normalizeStringArray(item.bullets),
    articleUrl: normalizeText(item.articleUrl),
    isPublished: item.isPublished !== false,
    source: normalizeText(item.source || 'firestore'),
  }
}

function toNewsWritePayload(input = {}) {
  return {
    category: normalizeText(input.category),
    date: normalizeDate(input.date),
    title: normalizeText(input.title),
    summary: normalizeText(input.summary),
    author: normalizeText(input.author),
    email: normalizeText(input.email),
    image: normalizeText(input.image),
    imageCaption: normalizeText(input.imageCaption),
    paragraphs: normalizeStringArray(input.paragraphs),
    bullets: normalizeStringArray(input.bullets),
    articleUrl: normalizeText(input.articleUrl),
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
  } catch (error) {
    return { articles: [], source: 'error' }
  }
}

export async function loadNewsArticlesForPublic() {
  const localArticles = getAllNewsSorted()

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
  } catch (error) {
    return { articles: localArticles, source: 'local' }
  }
}

export async function createNewsArticle(input = {}) {
  const payload = toNewsWritePayload(input)
  if (!payload.category || !payload.date || !payload.title) {
    throw new Error('필수 항목(category, date, title)이 비어 있습니다.')
  }

  const created = await addDoc(collection(db, NEWS_COLLECTION), {
    ...payload,
    createdAt: serverTimestamp(),
  })

  return created.id
}

export async function updateNewsArticle(articleId, input = {}) {
  const id = normalizeText(articleId)
  if (!id) throw new Error('수정할 뉴스 ID가 없습니다.')

  const payload = toNewsWritePayload(input)
  if (!payload.category || !payload.date || !payload.title) {
    throw new Error('필수 항목(category, date, title)이 비어 있습니다.')
  }

  await updateDoc(doc(db, NEWS_COLLECTION, id), payload)
}

export async function removeNewsArticle(articleId) {
  const id = normalizeText(articleId)
  if (!id) return
  await deleteDoc(doc(db, NEWS_COLLECTION, id))
}

export function buildNewsCategories(articles = []) {
  const base = defaultNewsCategories.filter((item) => item !== NEWS_ALL_CATEGORY)
  const seen = new Set(base.map((item) => normalizeText(item)))
  const output = [...base]

  articles.forEach((item) => {
    const category = normalizeText(item?.category)
    if (!category || seen.has(category)) return
    seen.add(category)
    output.push(category)
  })

  return [NEWS_ALL_CATEGORY, ...output]
}

export function toMultilineText(values) {
  return normalizeStringArray(values).join('\n')
}
