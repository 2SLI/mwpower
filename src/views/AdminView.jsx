import { useEffect, useMemo, useRef, useState } from 'react'
import { collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { NEWS_FALLBACK_IMAGE } from '../data/newsContent'
import { AdminChrome } from '../features/admin/components/AdminChrome'
import { AdminInquiriesPanel } from '../features/admin/components/AdminInquiriesPanel'
import { AdminLoginGate } from '../features/admin/components/AdminLoginGate'
import { AdminNewsPanel } from '../features/admin/components/AdminNewsPanel'
import { AdminOrdersPanel } from '../features/admin/components/AdminOrdersPanel'
import { AdminQuotesPanel } from '../features/admin/components/AdminQuotesPanel'
import { db } from '../firebase'
import { createNewsArticle, loadNewsArticlesForAdmin, removeNewsArticle, updateNewsArticle } from '../features/newsService'
import { inferNewsCategory, normalizeNewsCategory } from '../features/newsCategory'
import { getNewsSourceLabel, normalizeNewsLink } from '../features/newsLink'
import { fetchNewsLinkPreview } from '../features/newsPreview'
import { getQuoteItemSummary, normalizeQuoteItems } from '../features/quoteCart'

const ADMIN_SESSION_KEY = 'mwpower_admin_authenticated'
const ADMIN_PASSWORD = String(import.meta.env.VITE_ADMIN_PASSWORD ?? '').trim()

const NEWS_FORM_INITIAL = {
  articleUrl: '',
  image: '',
  title: '',
  summary: '',
  date: '',
  category: '',
  isPublished: true,
}

function normalizeText(value = '') {
  return String(value ?? '').trim()
}

function handleNewsImageError(event) {
  const image = event.currentTarget
  if (!image || image.dataset.fallbackApplied === 'true') return
  image.dataset.fallbackApplied = 'true'
  image.src = NEWS_FALLBACK_IMAGE
}

function resolveInquiryType(item) {
  const inquiryType = normalizeText(item?.inquiryType).toLowerCase()
  if (inquiryType === 'product' || inquiryType === 'technical') return inquiryType

  const source = normalizeText(item?.source).toLowerCase()
  if (source.includes('technical')) return 'technical'
  return 'product'
}

function formatDateTime(value, fallback = '-') {
  if (!value) return fallback
  try {
    if (typeof value?.toDate === 'function') return value.toDate().toLocaleString('ko-KR')
    if (typeof value === 'string') {
      const date = new Date(value)
      if (!Number.isNaN(date.getTime())) return date.toLocaleString('ko-KR')
    }
  } catch {
    return fallback
  }
  return fallback
}

function mapInquiryDocument(docSnap) {
  const data = docSnap.data() ?? {}
  return {
    id: docSnap.id,
    name: normalizeText(data.name),
    email: normalizeText(data.email),
    phone: normalizeText(data.phone),
    message: normalizeText(data.message),
    source: normalizeText(data.source),
    inquiryType: resolveInquiryType(data),
    createdAt: data.createdAt ?? null,
    createdAtClient: normalizeText(data.createdAtClient),
    status: normalizeText(data.status || 'new').toLowerCase(),
    resolvedAt: data.resolvedAt ?? null,
  }
}

function sortByCreatedAtDesc(items) {
  return [...items].sort((a, b) => {
    const at = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAtClient || 0).getTime()
    const bt = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAtClient || 0).getTime()
    return (Number.isFinite(bt) ? bt : 0) - (Number.isFinite(at) ? at : 0)
  })
}

function mapQuoteRequestDocument(docSnap) {
  const data = docSnap.data() ?? {}
  const items = normalizeQuoteItems(data.items)
  const summary = getQuoteItemSummary(items)

  return {
    id: docSnap.id,
    companyName: normalizeText(data.companyName),
    contactName: normalizeText(data.contactName),
    email: normalizeText(data.email),
    phone: normalizeText(data.phone),
    message: normalizeText(data.message),
    source: normalizeText(data.source),
    requestType: normalizeText(data.requestType),
    createdAt: data.createdAt ?? null,
    createdAtClient: normalizeText(data.createdAtClient),
    status: normalizeText(data.status || 'new').toLowerCase(),
    resolvedAt: data.resolvedAt ?? null,
    items,
    itemCount: Number.isFinite(Number(data.itemCount)) ? Number(data.itemCount) : summary.lineCount,
    totalQuantity: Number.isFinite(Number(data.totalQuantity)) ? Number(data.totalQuantity) : summary.totalQuantity,
  }
}

function normalizeNewsFormFromArticle(article) {
  if (!article) return NEWS_FORM_INITIAL
  return {
    articleUrl: normalizeText(article.articleUrl || article.externalUrl),
    image: normalizeText(article.image || article.thumbnail),
    title: normalizeText(article.title),
    summary: normalizeText(article.summary),
    date: normalizeText(article.date),
    category: normalizeNewsCategory(article.category) || inferNewsCategory(article),
    isPublished: article.isPublished !== false,
  }
}

export function AdminView({ pathname = '/admin' }) {
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState(() => (String(pathname).startsWith('/admin/orders') ? 'orders' : 'inquiries'))

  const [inquiries, setInquiries] = useState([])
  const [inquiryFilter, setInquiryFilter] = useState('all')
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(false)
  const [inquiryError, setInquiryError] = useState('')
  const [activeInquiryId, setActiveInquiryId] = useState(null)

  const [quoteRequests, setQuoteRequests] = useState([])
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false)
  const [quoteError, setQuoteError] = useState('')
  const [activeQuoteId, setActiveQuoteId] = useState(null)

  const [newsItems, setNewsItems] = useState([])
  const [isLoadingNews, setIsLoadingNews] = useState(false)
  const [newsError, setNewsError] = useState('')
  const [editingNewsId, setEditingNewsId] = useState(null)
  const [newsForm, setNewsForm] = useState(NEWS_FORM_INITIAL)
  const [isSavingNews, setIsSavingNews] = useState(false)
  const [isLoadingNewsPreview, setIsLoadingNewsPreview] = useState(false)
  const [newsPreviewError, setNewsPreviewError] = useState('')
  const lastAutoPreviewLinkRef = useRef('')

  const hasConfiguredPassword = ADMIN_PASSWORD.length > 0

  const filteredInquiries = useMemo(() => {
    if (inquiryFilter === 'all') return inquiries
    return inquiries.filter((item) => item.inquiryType === inquiryFilter)
  }, [inquiries, inquiryFilter])

  const activeInquiry = useMemo(
    () => filteredInquiries.find((item) => item.id === activeInquiryId) ?? null,
    [filteredInquiries, activeInquiryId]
  )

  const activeQuoteRequest = useMemo(
    () => quoteRequests.find((item) => item.id === activeQuoteId) ?? null,
    [quoteRequests, activeQuoteId]
  )

  const normalizedNewsFormLink = useMemo(() => normalizeNewsLink(newsForm.articleUrl), [newsForm.articleUrl])
  const newsFormPreview = useMemo(
    () => ({
      articleUrl: normalizedNewsFormLink,
      image: normalizeText(newsForm.image),
      title: normalizeText(newsForm.title) || (normalizedNewsFormLink ? `${getNewsSourceLabel(normalizedNewsFormLink)} 게시글` : '뉴스 미리보기'),
      summary: normalizeText(newsForm.summary),
      date: normalizeText(newsForm.date),
      category: normalizeNewsCategory(newsForm.category) || inferNewsCategory(newsForm),
      sourceLabel: normalizedNewsFormLink ? getNewsSourceLabel(normalizedNewsFormLink) : '',
    }),
    [newsForm, normalizedNewsFormLink]
  )
  const selectedNewsFormCategory = normalizeNewsCategory(newsForm.category) || inferNewsCategory(newsFormPreview)

  const loadInquiries = async () => {
    setIsLoadingInquiries(true)
    setInquiryError('')

    try {
      const snapshot = await getDocs(query(collection(db, 'contactInquiries'), orderBy('createdAt', 'desc')))
      const items = sortByCreatedAtDesc(snapshot.docs.map(mapInquiryDocument))
      setInquiries(items)
      setActiveInquiryId((prev) => (items.some((item) => item.id === prev) ? prev : items[0]?.id ?? null))
    } catch (error) {
      try {
        const snapshot = await getDocs(collection(db, 'contactInquiries'))
        const items = sortByCreatedAtDesc(snapshot.docs.map(mapInquiryDocument))
        setInquiries(items)
        setActiveInquiryId((prev) => (items.some((item) => item.id === prev) ? prev : items[0]?.id ?? null))
        setInquiryError('정렬 조회가 실패하여 기본 조회 결과를 표시합니다.')
      } catch (innerError) {
        setInquiryError('문의 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
        setInquiries([])
        setActiveInquiryId(null)
      }
    } finally {
      setIsLoadingInquiries(false)
    }
  }

  const loadQuoteRequests = async () => {
    setIsLoadingQuotes(true)
    setQuoteError('')

    try {
      const snapshot = await getDocs(query(collection(db, 'quoteRequests'), orderBy('createdAt', 'desc')))
      const items = sortByCreatedAtDesc(snapshot.docs.map(mapQuoteRequestDocument))
      setQuoteRequests(items)
      setActiveQuoteId((prev) => (items.some((item) => item.id === prev) ? prev : items[0]?.id ?? null))
    } catch (error) {
      try {
        const snapshot = await getDocs(collection(db, 'quoteRequests'))
        const items = sortByCreatedAtDesc(snapshot.docs.map(mapQuoteRequestDocument))
        setQuoteRequests(items)
        setActiveQuoteId((prev) => (items.some((item) => item.id === prev) ? prev : items[0]?.id ?? null))
        setQuoteError('정렬 조회가 실패하여 기본 조회 결과를 표시합니다.')
      } catch (innerError) {
        setQuoteError('견적요청 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
        setQuoteRequests([])
        setActiveQuoteId(null)
      }
    } finally {
      setIsLoadingQuotes(false)
    }
  }

  const loadNews = async () => {
    setIsLoadingNews(true)
    setNewsError('')

    const result = await loadNewsArticlesForAdmin()
    if (result.source === 'error') {
      setNewsItems([])
      setNewsError('뉴스 데이터를 불러오지 못했습니다. Firestore 권한/연결 상태를 확인해주세요.')
      setIsLoadingNews(false)
      return
    }

    setNewsItems(Array.isArray(result.articles) ? result.articles : [])
    setIsLoadingNews(false)
  }

  useEffect(() => {
    document.title = '관리자 | MWPOWER'
    const saved = typeof window !== 'undefined' ? window.sessionStorage.getItem(ADMIN_SESSION_KEY) : null
    if (saved === 'true') setIsAuthenticated(true)
  }, [])

  useEffect(() => {
    if (String(pathname).startsWith('/admin/orders')) setActiveTab('orders')
  }, [pathname])

  useEffect(() => {
    if (!isAuthenticated) return
    loadInquiries()
    loadQuoteRequests()
    loadNews()
  }, [isAuthenticated])

  const handleAuthSubmit = (event) => {
    event.preventDefault()

    if (!hasConfiguredPassword) {
      setAuthError('관리자 비밀번호가 설정되지 않았습니다. .env.local 파일을 확인해주세요.')
      return
    }

    if (password !== ADMIN_PASSWORD) {
      setAuthError('비밀번호가 올바르지 않습니다.')
      return
    }

    setIsAuthenticated(true)
    setAuthError('')
    setPassword('')
    window.sessionStorage.setItem(ADMIN_SESSION_KEY, 'true')
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setPassword('')
    setAuthError('')
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY)
  }

  const handleInquiryStatusToggle = async (inquiry) => {
    const nextStatus = inquiry.status === 'done' ? 'new' : 'done'
    try {
      await updateDoc(doc(db, 'contactInquiries', inquiry.id), {
        status: nextStatus,
        resolvedAt: nextStatus === 'done' ? serverTimestamp() : null,
        reviewedAt: serverTimestamp(),
      })
      await loadInquiries()
    } catch (error) {
      setInquiryError('문의 상태를 업데이트하지 못했습니다.')
    }
  }

  const handleQuoteStatusToggle = async (quoteRequest) => {
    const nextStatus = quoteRequest.status === 'done' ? 'new' : 'done'
    try {
      await updateDoc(doc(db, 'quoteRequests', quoteRequest.id), {
        status: nextStatus,
        resolvedAt: nextStatus === 'done' ? serverTimestamp() : null,
        reviewedAt: serverTimestamp(),
      })
      await loadQuoteRequests()
    } catch (error) {
      setQuoteError('견적요청 상태를 업데이트하지 못했습니다.')
    }
  }

  const handleNewsFormChange = (key, value) => {
    if (key === 'articleUrl') {
      setNewsPreviewError('')
      lastAutoPreviewLinkRef.current = ''
      setNewsForm((prev) => ({
        ...prev,
        articleUrl: value,
        image: '',
        title: '',
        summary: '',
        date: '',
      }))
      return
    }
    setNewsForm((prev) => ({ ...prev, [key]: value }))
  }

  const applyNewsPreview = (preview, { overwrite = false } = {}) => {
    if (!preview) return

    setNewsForm((prev) => ({
      ...prev,
      articleUrl: preview.articleUrl || prev.articleUrl,
      image: overwrite ? preview.image || normalizeText(prev.image) : normalizeText(prev.image) || preview.image || '',
      title: overwrite ? preview.title || normalizeText(prev.title) : normalizeText(prev.title) || preview.title || '',
      summary: overwrite ? preview.summary || normalizeText(prev.summary) : normalizeText(prev.summary) || preview.summary || '',
      category: normalizeNewsCategory(prev.category) || inferNewsCategory(preview),
    }))
  }

  const loadNewsPreviewFromLink = async ({ force = false, overwrite = false } = {}) => {
    if (!normalizedNewsFormLink || isLoadingNewsPreview) return null
    if (!force && lastAutoPreviewLinkRef.current === normalizedNewsFormLink) return null

    setIsLoadingNewsPreview(true)
    setNewsPreviewError('')

    try {
      const preview = await fetchNewsLinkPreview(normalizedNewsFormLink)
      applyNewsPreview(preview, { overwrite })
      lastAutoPreviewLinkRef.current = normalizedNewsFormLink
      if (!preview?.title && !preview?.image) setNewsPreviewError('미리보기 정보를 자동으로 가져오지 못했습니다. 링크만으로도 등록은 가능합니다.')
      return preview
    } catch {
      setNewsPreviewError('미리보기 정보를 자동으로 가져오지 못했습니다. 링크만으로도 등록은 가능합니다.')
      return null
    } finally {
      setIsLoadingNewsPreview(false)
    }
  }

  useEffect(() => {
    if (!normalizedNewsFormLink || activeTab !== 'news') return undefined

    const timer = window.setTimeout(() => {
      loadNewsPreviewFromLink({ overwrite: true })
    }, 650)

    return () => window.clearTimeout(timer)
  }, [normalizedNewsFormLink, activeTab])

  const handleNewsEdit = (article) => {
    setEditingNewsId(article.id)
    setNewsForm(normalizeNewsFormFromArticle(article))
    setActiveTab('news')
    setNewsError('')
  }

  const resetNewsForm = () => {
    setEditingNewsId(null)
    setNewsForm(NEWS_FORM_INITIAL)
    setNewsPreviewError('')
    lastAutoPreviewLinkRef.current = ''
  }

  const handleNewsSubmit = async (event) => {
    event.preventDefault()
    if (isSavingNews) return

    const preview = normalizedNewsFormLink ? await loadNewsPreviewFromLink({ force: true, overwrite: true }) : null
    const hydratedForm = preview
      ? {
          ...newsForm,
          articleUrl: preview.articleUrl || newsForm.articleUrl,
          image: preview.image || '',
          title: preview.title || '',
          summary: preview.summary || '',
        }
      : newsForm

    if (preview) {
      setNewsForm((prev) => ({
        ...prev,
        articleUrl: preview.articleUrl || prev.articleUrl,
        image: preview.image || '',
        title: preview.title || '',
        summary: preview.summary || '',
      }))
    }

    const payload = {
      articleUrl: normalizedNewsFormLink,
      image: normalizeText(hydratedForm.image),
      title: normalizeText(hydratedForm.title),
      summary: normalizeText(hydratedForm.summary),
      date: normalizeText(hydratedForm.date),
      category: normalizeNewsCategory(hydratedForm.category) || inferNewsCategory(hydratedForm),
      isPublished: hydratedForm.isPublished,
    }

    if (!payload.articleUrl) {
      setNewsError('유효한 뉴스 링크를 입력해주세요.')
      return
    }

    setIsSavingNews(true)
    setNewsError('')

    try {
      if (editingNewsId) {
        await updateNewsArticle(editingNewsId, payload)
      } else {
        await createNewsArticle(payload)
      }
      await loadNews()
      resetNewsForm()
    } catch (error) {
      setNewsError('뉴스 저장 중 오류가 발생했습니다. 입력값을 확인해주세요.')
    } finally {
      setIsSavingNews(false)
    }
  }

  const handleNewsDelete = async (article) => {
    const confirmed = window.confirm(`"${article.title}" 뉴스를 삭제하시겠습니까?`)
    if (!confirmed) return

    try {
      await removeNewsArticle(article.id)
      await loadNews()
      if (editingNewsId === article.id) resetNewsForm()
    } catch (error) {
      setNewsError('뉴스 삭제에 실패했습니다.')
    }
  }

  if (!isAuthenticated) {
    return (
      <AdminLoginGate
        password={password}
        authError={authError}
        onPasswordChange={(value) => {
          setPassword(value)
          if (authError) setAuthError('')
        }}
        onSubmit={handleAuthSubmit}
      />
    )
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'orders' && typeof window !== 'undefined') {
      window.history.pushState({ view: 'admin-orders' }, '', '/admin/orders')
    }
  }

  let activePanel = null
  if (activeTab === 'inquiries') {
    activePanel = (
      <AdminInquiriesPanel
        inquiries={inquiries}
        filteredInquiries={filteredInquiries}
        activeInquiry={activeInquiry}
        activeInquiryId={activeInquiryId}
        inquiryFilter={inquiryFilter}
        isLoading={isLoadingInquiries}
        error={inquiryError}
        formatDateTime={formatDateTime}
        onRefresh={loadInquiries}
        onFilterChange={setInquiryFilter}
        onSelectInquiry={setActiveInquiryId}
        onStatusToggle={handleInquiryStatusToggle}
      />
    )
  } else if (activeTab === 'quotes') {
    activePanel = (
      <AdminQuotesPanel
        quoteRequests={quoteRequests}
        activeQuoteRequest={activeQuoteRequest}
        activeQuoteId={activeQuoteId}
        isLoading={isLoadingQuotes}
        error={quoteError}
        formatDateTime={formatDateTime}
        onRefresh={loadQuoteRequests}
        onSelectQuote={setActiveQuoteId}
        onStatusToggle={handleQuoteStatusToggle}
      />
    )
  } else if (activeTab === 'orders') {
    activePanel = <AdminOrdersPanel pathname={pathname} />
  } else {
    activePanel = (
      <AdminNewsPanel
        newsItems={newsItems}
        newsForm={newsForm}
        newsFormPreview={newsFormPreview}
        selectedNewsFormCategory={selectedNewsFormCategory}
        normalizedNewsFormLink={normalizedNewsFormLink}
        editingNewsId={editingNewsId}
        isLoadingNews={isLoadingNews}
        isSavingNews={isSavingNews}
        isLoadingNewsPreview={isLoadingNewsPreview}
        newsError={newsError}
        newsPreviewError={newsPreviewError}
        onRefresh={loadNews}
        onResetForm={resetNewsForm}
        onFormChange={handleNewsFormChange}
        onPreviewLoad={loadNewsPreviewFromLink}
        onSubmit={handleNewsSubmit}
        onEdit={handleNewsEdit}
        onDelete={handleNewsDelete}
        onImageError={handleNewsImageError}
      />
    )
  }

  return (
    <AdminChrome activeTab={activeTab} onTabChange={handleTabChange} onLogout={handleLogout}>
      {activePanel}
    </AdminChrome>
  )
}
