import { useEffect, useMemo, useRef, useState } from 'react'
import { collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { formatNewsDate } from '../data/newsContent'
import { db } from '../firebase'
import { createNewsArticle, loadNewsArticlesForAdmin, removeNewsArticle, updateNewsArticle } from '../features/newsService'
import { getNewsSourceLabel, normalizeNewsLink } from '../features/newsLink'
import { fetchNewsLinkPreview } from '../features/newsPreview'
import { formatQuoteItemPath, getQuoteItemSummary, normalizeQuoteItems } from '../features/quoteCart'

const ADMIN_SESSION_KEY = 'mwpower_admin_authenticated'
const ADMIN_PASSWORD = String(import.meta.env.VITE_ADMIN_PASSWORD ?? '').trim()

const NEWS_FORM_INITIAL = {
  articleUrl: '',
  image: '',
  title: '',
  summary: '',
  date: '',
  isPublished: true,
}

function normalizeText(value = '') {
  return String(value ?? '').trim()
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
    isPublished: article.isPublished !== false,
  }
}

export function AdminView() {
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState('inquiries')

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
      sourceLabel: normalizedNewsFormLink ? getNewsSourceLabel(normalizedNewsFormLink) : '',
    }),
    [newsForm, normalizedNewsFormLink]
  )

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
    document.title = '관리자 | 민웰파워'
    const saved = typeof window !== 'undefined' ? window.sessionStorage.getItem(ADMIN_SESSION_KEY) : null
    if (saved === 'true') setIsAuthenticated(true)
  }, [])

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

    let hydratedForm = newsForm
    if (normalizedNewsFormLink && (!normalizeText(newsForm.title) || !normalizeText(newsForm.image) || !normalizeText(newsForm.summary))) {
      const preview = await loadNewsPreviewFromLink({ force: true })
      if (preview) {
        hydratedForm = {
          ...newsForm,
          articleUrl: preview.articleUrl || newsForm.articleUrl,
          image: normalizeText(newsForm.image) || preview.image || '',
          title: normalizeText(newsForm.title) || preview.title || '',
          summary: normalizeText(newsForm.summary) || preview.summary || '',
        }
      }
    }

    const payload = {
      articleUrl: normalizedNewsFormLink,
      image: normalizeText(hydratedForm.image),
      title: normalizeText(hydratedForm.title),
      summary: normalizeText(hydratedForm.summary),
      date: normalizeText(hydratedForm.date),
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
      <div className="grid min-h-screen place-items-center bg-slate-100 px-4 py-10">
        <section className="w-full max-w-[460px] rounded-2xl border border-[#e8b2b9] bg-white p-5 shadow-[0_18px_40px_rgba(185,28,28,0.12)]">
          <p className="m-0 text-[11px] font-black uppercase tracking-[0.08em] text-[#b42323]">Admin</p>
          <h1 className="mb-0 mt-1 text-[28px] font-black tracking-[-0.02em] text-slate-900">관리자 로그인</h1>
          <p className="mb-0 mt-1 text-sm font-semibold text-slate-500">문의함, 견적함, 뉴스 관리를 위해 인증이 필요합니다.</p>

          <form className="mt-5 grid gap-3" onSubmit={handleAuthSubmit}>
            <label className="grid gap-1.5 text-sm font-bold text-slate-700" htmlFor="admin-password-input">
              비밀번호
              <input
                id="admin-password-input"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  if (authError) setAuthError('')
                }}
                className="h-11 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-[#c9252f] focus:ring-2 focus:ring-[#f8d7db]"
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
              />
            </label>
            {authError ? <p className="m-0 rounded-lg bg-[#fff1f2] px-3 py-2 text-sm font-semibold text-[#b42323]">{authError}</p> : null}

            <button type="submit" className="h-11 rounded-lg border border-[#c9252f] bg-[#c9252f] text-sm font-extrabold text-white transition hover:bg-[#b81f29]">
              관리자 로그인
            </button>
            <a href="/" className="text-center text-sm font-bold text-slate-600 underline-offset-2 hover:underline">
              메인으로 이동
            </a>
          </form>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 py-6 text-slate-700">
      <div className="mx-auto grid w-full max-w-[1240px] gap-4">
        <header className="rounded-2xl border border-[#e7c4c9] bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="m-0 text-[11px] font-black uppercase tracking-[0.08em] text-[#b42323]">Admin Console</p>
              <h1 className="m-0 mt-1 text-[30px] font-black tracking-[-0.02em] text-slate-900">문의/견적/뉴스 관리</h1>
            </div>
            <div className="flex items-center gap-2">
              <a href="/" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                메인 이동
              </a>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-[#c9252f] bg-[#c9252f] px-3 py-2 text-sm font-extrabold text-white hover:bg-[#b81f29]"
              >
                로그아웃
              </button>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('inquiries')}
              className={`rounded-full px-4 py-2 text-sm font-extrabold ${
                activeTab === 'inquiries' ? 'bg-[#c9252f] text-white' : 'border border-slate-300 bg-white text-slate-700'
              }`}
            >
              문의함
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('quotes')}
              className={`rounded-full px-4 py-2 text-sm font-extrabold ${
                activeTab === 'quotes' ? 'bg-[#c9252f] text-white' : 'border border-slate-300 bg-white text-slate-700'
              }`}
            >
              견적함
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('news')}
              className={`rounded-full px-4 py-2 text-sm font-extrabold ${
                activeTab === 'news' ? 'bg-[#c9252f] text-white' : 'border border-slate-300 bg-white text-slate-700'
              }`}
            >
              뉴스
            </button>
          </div>
        </section>

        {activeTab === 'inquiries' ? (
          <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="m-0 text-xl font-black text-slate-900">문의함</h2>
              <button type="button" onClick={loadInquiries} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                새로고침
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setInquiryFilter('all')}
                className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${
                  inquiryFilter === 'all' ? 'bg-[#c9252f] text-white' : 'border border-slate-300 bg-white text-slate-700'
                }`}
              >
                전체
              </button>
              <button
                type="button"
                onClick={() => setInquiryFilter('product')}
                className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${
                  inquiryFilter === 'product' ? 'bg-[#c9252f] text-white' : 'border border-slate-300 bg-white text-slate-700'
                }`}
              >
                제품문의
              </button>
              <button
                type="button"
                onClick={() => setInquiryFilter('technical')}
                className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${
                  inquiryFilter === 'technical' ? 'bg-[#c9252f] text-white' : 'border border-slate-300 bg-white text-slate-700'
                }`}
              >
                기술문의
              </button>
            </div>

            {isLoadingInquiries ? <p className="m-0 text-sm font-semibold text-slate-500">문의 데이터를 불러오는 중입니다...</p> : null}
            {inquiryError ? <p className="m-0 text-sm font-semibold text-[#b42323]">{inquiryError}</p> : null}

            <div className="grid gap-3 lg:grid-cols-[360px_minmax(0,1fr)]">
              <div className="max-h-[66vh] overflow-y-auto rounded-xl border border-slate-200">
                {filteredInquiries.length === 0 ? (
                  <p className="m-0 px-4 py-8 text-center text-sm font-semibold text-slate-500">표시할 문의가 없습니다.</p>
                ) : (
                  <ul className="m-0 list-none p-0">
                    {filteredInquiries.map((item) => (
                      <li key={item.id} className="border-b border-slate-200 last:border-b-0">
                        <button
                          type="button"
                          className={`grid w-full gap-1 px-3 py-2.5 text-left ${
                            activeInquiryId === item.id ? 'bg-[#fff3f4]' : 'bg-white hover:bg-slate-50'
                          }`}
                          onClick={() => setActiveInquiryId(item.id)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <strong className="text-sm font-extrabold text-slate-800">{item.name || '(이름 없음)'}</strong>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-black ${
                                item.status === 'done' ? 'bg-[#e9f9ef] text-[#0f6d3d]' : 'bg-[#fff3f4] text-[#b42323]'
                              }`}
                            >
                              {item.status === 'done' ? '처리완료' : '신규'}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-slate-600">{item.inquiryType === 'technical' ? '기술문의' : '제품문의'}</span>
                          <span className="text-xs text-slate-500">{formatDateTime(item.createdAt, item.createdAtClient || '-')}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                {!activeInquiry ? (
                  <p className="m-0 text-sm font-semibold text-slate-500">왼쪽 목록에서 문의를 선택해주세요.</p>
                ) : (
                  <div className="grid gap-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="m-0 text-lg font-black text-slate-900">문의 상세</h3>
                      <button
                        type="button"
                        onClick={() => handleInquiryStatusToggle(activeInquiry)}
                        className={`rounded-lg px-3 py-2 text-sm font-extrabold ${
                          activeInquiry.status === 'done'
                            ? 'border border-slate-300 bg-white text-slate-700'
                            : 'border border-[#c9252f] bg-[#c9252f] text-white'
                        }`}
                      >
                        {activeInquiry.status === 'done' ? '신규로 되돌리기' : '처리완료로 표시'}
                      </button>
                    </div>

                    <div className="grid gap-1 rounded-lg bg-slate-50 p-3 text-sm">
                      <p className="m-0">
                        <strong>유형:</strong> {activeInquiry.inquiryType === 'technical' ? '기술문의' : '제품문의'}
                      </p>
                      <p className="m-0">
                        <strong>이름:</strong> {activeInquiry.name || '-'}
                      </p>
                      <p className="m-0">
                        <strong>이메일:</strong> {activeInquiry.email || '-'}
                      </p>
                      <p className="m-0">
                        <strong>연락처:</strong> {activeInquiry.phone || '-'}
                      </p>
                      <p className="m-0">
                        <strong>접수일:</strong> {formatDateTime(activeInquiry.createdAt, activeInquiry.createdAtClient || '-')}
                      </p>
                      <p className="m-0">
                        <strong>처리일:</strong> {formatDateTime(activeInquiry.resolvedAt, '-')}
                      </p>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="m-0 mb-2 text-sm font-black text-slate-700">문의 내용</p>
                      <p className="m-0 whitespace-pre-wrap text-sm leading-6 text-slate-700">{activeInquiry.message || '(내용 없음)'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : activeTab === 'quotes' ? (
          <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="m-0 text-xl font-black text-slate-900">견적함</h2>
              <button type="button" onClick={loadQuoteRequests} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                새로고침
              </button>
            </div>

            {isLoadingQuotes ? <p className="m-0 text-sm font-semibold text-slate-500">견적요청 데이터를 불러오는 중입니다...</p> : null}
            {quoteError ? <p className="m-0 text-sm font-semibold text-[#b42323]">{quoteError}</p> : null}

            <div className="grid gap-3 lg:grid-cols-[360px_minmax(0,1fr)]">
              <div className="max-h-[66vh] overflow-y-auto rounded-xl border border-slate-200">
                {quoteRequests.length === 0 ? (
                  <p className="m-0 px-4 py-8 text-center text-sm font-semibold text-slate-500">표시할 견적요청이 없습니다.</p>
                ) : (
                  <ul className="m-0 list-none p-0">
                    {quoteRequests.map((item) => (
                      <li key={item.id} className="border-b border-slate-200 last:border-b-0">
                        <button
                          type="button"
                          className={`grid w-full gap-1 px-3 py-2.5 text-left ${
                            activeQuoteId === item.id ? 'bg-[#fff3f4]' : 'bg-white hover:bg-slate-50'
                          }`}
                          onClick={() => setActiveQuoteId(item.id)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <strong className="text-sm font-extrabold text-slate-800">{item.companyName || item.contactName || '(회사명 없음)'}</strong>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-black ${
                                item.status === 'done' ? 'bg-[#e9f9ef] text-[#0f6d3d]' : 'bg-[#fff3f4] text-[#b42323]'
                              }`}
                            >
                              {item.status === 'done' ? '처리완료' : '신규'}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-slate-600">
                            {item.contactName || '담당자 미입력'} · {item.itemCount}개 품목 / 총 {item.totalQuantity}개
                          </span>
                          <span className="text-xs text-slate-500">{formatDateTime(item.createdAt, item.createdAtClient || '-')}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                {!activeQuoteRequest ? (
                  <p className="m-0 text-sm font-semibold text-slate-500">왼쪽 목록에서 견적요청을 선택해주세요.</p>
                ) : (
                  <div className="grid gap-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="m-0 text-lg font-black text-slate-900">견적요청 상세</h3>
                      <button
                        type="button"
                        onClick={() => handleQuoteStatusToggle(activeQuoteRequest)}
                        className={`rounded-lg px-3 py-2 text-sm font-extrabold ${
                          activeQuoteRequest.status === 'done'
                            ? 'border border-slate-300 bg-white text-slate-700'
                            : 'border border-[#c9252f] bg-[#c9252f] text-white'
                        }`}
                      >
                        {activeQuoteRequest.status === 'done' ? '신규로 되돌리기' : '처리완료로 표시'}
                      </button>
                    </div>

                    <div className="grid gap-1 rounded-lg bg-slate-50 p-3 text-sm">
                      <p className="m-0">
                        <strong>회사명:</strong> {activeQuoteRequest.companyName || '-'}
                      </p>
                      <p className="m-0">
                        <strong>담당자:</strong> {activeQuoteRequest.contactName || '-'}
                      </p>
                      <p className="m-0">
                        <strong>이메일:</strong> {activeQuoteRequest.email || '-'}
                      </p>
                      <p className="m-0">
                        <strong>연락처:</strong> {activeQuoteRequest.phone || '-'}
                      </p>
                      <p className="m-0">
                        <strong>접수일:</strong> {formatDateTime(activeQuoteRequest.createdAt, activeQuoteRequest.createdAtClient || '-')}
                      </p>
                      <p className="m-0">
                        <strong>처리일:</strong> {formatDateTime(activeQuoteRequest.resolvedAt, '-')}
                      </p>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="m-0 text-sm font-black text-slate-700">주문목록</p>
                        <span className="rounded-full bg-[#fff3f4] px-2.5 py-1 text-xs font-black text-[#b42323]">
                          {activeQuoteRequest.itemCount}개 품목 / 총 {activeQuoteRequest.totalQuantity}개
                        </span>
                      </div>

                      {activeQuoteRequest.items.length === 0 ? (
                        <p className="m-0 mt-3 text-sm text-slate-500">저장된 품목이 없습니다.</p>
                      ) : (
                        <ul className="m-0 mt-3 grid list-none gap-2 p-0">
                          {activeQuoteRequest.items.map((item) => (
                            <li key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                              <div className="grid gap-3 sm:grid-cols-[88px_minmax(0,1fr)]">
                                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                  {item.thumbnailUrl ? (
                                    <img src={item.thumbnailUrl} alt={item.displayModel} className="aspect-[4/3] h-full w-full object-cover" loading="lazy" />
                                  ) : (
                                    <div className="grid aspect-[4/3] h-full w-full place-items-center text-[10px] font-black text-slate-400">NO IMAGE</div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <strong className="text-sm font-extrabold text-slate-900">{item.displayModel}</strong>
                                    <span className="text-xs font-black text-[#b42323]">{item.quantity}개</span>
                                  </div>
                                  <p className="m-0 mt-1 text-xs font-semibold text-slate-500">{formatQuoteItemPath(item) || '제품 정보 없음'}</p>
                                  {item.note ? <p className="m-0 mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">메모: {item.note}</p> : null}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="m-0 mb-2 text-sm font-black text-slate-700">요청 메모</p>
                      <p className="m-0 whitespace-pre-wrap text-sm leading-6 text-slate-700">{activeQuoteRequest.message || '(내용 없음)'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : (
          <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="m-0 text-xl font-black text-slate-900">뉴스 관리</h2>
                <p className="m-0 mt-1 text-sm font-semibold text-slate-500">블로그나 티스토리 링크와 썸네일, 제목을 등록하면 홈과 뉴스 페이지에 미리보기 형태로 반영됩니다.</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={loadNews} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  새로고침
                </button>
                <button
                  type="button"
                  onClick={resetNewsForm}
                  className="rounded-lg border border-[#c9252f] bg-[#c9252f] px-3 py-2 text-sm font-extrabold text-white hover:bg-[#b81f29]"
                >
                  새 뉴스 등록
                </button>
              </div>
            </div>

            {isLoadingNews ? <p className="m-0 text-sm font-semibold text-slate-500">뉴스 데이터를 불러오는 중입니다...</p> : null}
            {newsError ? <p className="m-0 text-sm font-semibold text-[#b42323]">{newsError}</p> : null}

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
              <div className="max-h-[66vh] overflow-y-auto rounded-xl border border-slate-200">
                {newsItems.length === 0 ? (
                  <p className="m-0 px-4 py-8 text-center text-sm font-semibold text-slate-500">등록된 뉴스가 없습니다.</p>
                ) : (
                  <ul className="m-0 list-none p-0">
                    {newsItems.map((item) => (
                      <li key={item.id} className="border-b border-slate-200 p-3 last:border-b-0">
                        <div className="flex gap-3">
                          <div className="h-[84px] w-[148px] shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                            {item.thumbnail || item.image ? (
                              <img src={item.thumbnail || item.image} alt={item.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="grid h-full w-full place-items-center text-xs font-black text-slate-400">NO PREVIEW</div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="m-0 mt-1 text-sm font-extrabold text-slate-900">{item.title}</h3>
                                <p className="m-0 mt-1 text-xs font-semibold text-slate-500">
                                  {formatNewsDate(item.date)} · {item.sourceLabel || getNewsSourceLabel(item.articleUrl) || '외부 뉴스'}
                                </p>
                                <p className="m-0 mt-1 text-[11px] text-slate-400">ID: {item.id}</p>
                              </div>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-black ${
                                  item.isPublished ? 'bg-[#e9f9ef] text-[#0f6d3d]' : 'bg-[#fff3f4] text-[#b42323]'
                                }`}
                              >
                                {item.isPublished ? '공개' : '비공개'}
                              </span>
                            </div>
                            <p className="m-0 mt-2 text-xs leading-5 text-slate-500">{item.summary || '요약이 없으면 카드에는 제목만 표시됩니다.'}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {item.articleUrl ? (
                                <a
                                  href={item.articleUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-extrabold text-slate-700 hover:bg-slate-50"
                                >
                                  원문 확인
                                </a>
                              ) : (
                                <span className="rounded-md border border-[#f0c2c8] bg-[#fff7f8] px-2.5 py-1 text-xs font-black text-[#b42323]">뉴스 링크 없음</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleNewsEdit(item)}
                            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-extrabold text-slate-700 hover:bg-slate-50"
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNewsDelete(item)}
                            className="rounded-md border border-[#e4a1a9] bg-[#fff5f6] px-2.5 py-1 text-xs font-extrabold text-[#b42323] hover:bg-[#ffe9ec]"
                          >
                            삭제
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <form className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3" onSubmit={handleNewsSubmit}>
                <h3 className="m-0 text-base font-black text-slate-900">{editingNewsId ? '뉴스 수정' : '뉴스 등록'}</h3>
                <p className="m-0 text-xs leading-5 text-slate-500">블로그나 티스토리 링크와 썸네일 이미지를 입력하면 카드형 뉴스 미리보기로 노출됩니다.</p>

                <label className="grid gap-1 text-xs font-bold text-slate-700">
                  뉴스 링크*
                  <input
                    value={newsForm.articleUrl}
                    onChange={(event) => handleNewsFormChange('articleUrl', event.target.value)}
                    onBlur={() => loadNewsPreviewFromLink({ force: true, overwrite: true })}
                    className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm outline-none focus:border-[#c9252f]"
                    placeholder="https://blog.naver.com/... 또는 https://*.tistory.com/..."
                  />
                </label>
                {newsForm.articleUrl ? (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className={`m-0 text-[11px] font-bold ${normalizedNewsFormLink ? 'text-[#0f6d3d]' : 'text-[#b42323]'}`}>
                      {normalizedNewsFormLink ? `등록 출처: ${getNewsSourceLabel(normalizedNewsFormLink)}` : '유효한 블로그/뉴스 링크를 입력해주세요.'}
                    </p>
                    {normalizedNewsFormLink ? (
                      <button
                        type="button"
                        onClick={() => loadNewsPreviewFromLink({ force: true, overwrite: true })}
                        disabled={isLoadingNewsPreview}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-extrabold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        {isLoadingNewsPreview ? '가져오는 중...' : '미리보기 가져오기'}
                      </button>
                    ) : null}
                  </div>
                ) : null}
                {newsPreviewError ? <p className="m-0 text-[11px] font-bold text-[#b42323]">{newsPreviewError}</p> : null}

                {normalizedNewsFormLink ? (
                  <a
                    href={newsFormPreview.articleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grid overflow-hidden rounded-lg border border-slate-200 bg-white text-inherit no-underline"
                  >
                    <div className="aspect-[16/9] bg-slate-100">
                      {newsFormPreview.image ? (
                        <img src={newsFormPreview.image} alt={newsFormPreview.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-xs font-black text-slate-400">
                          {isLoadingNewsPreview ? 'LOADING PREVIEW' : 'NO PREVIEW IMAGE'}
                        </div>
                      )}
                    </div>
                    <div className="grid gap-1 p-3">
                      <p className="m-0 text-[11px] font-black uppercase tracking-[0.06em] text-[#b42323]">{newsFormPreview.sourceLabel || '외부 뉴스'}</p>
                      <strong className="line-clamp-2 text-sm font-black leading-5 text-slate-900">{newsFormPreview.title}</strong>
                      {newsFormPreview.summary ? <p className="m-0 line-clamp-2 text-xs leading-5 text-slate-500">{newsFormPreview.summary}</p> : null}
                    </div>
                  </a>
                ) : null}

                <label className="grid gap-1 text-xs font-bold text-slate-700">
                  썸네일 이미지 URL
                  <input
                    value={newsForm.image}
                    onChange={(event) => handleNewsFormChange('image', event.target.value)}
                    className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm outline-none focus:border-[#c9252f]"
                    placeholder="https://example.com/news-thumbnail.jpg"
                  />
                </label>

                <label className="grid gap-1 text-xs font-bold text-slate-700">
                  제목
                  <input
                    value={newsForm.title}
                    onChange={(event) => handleNewsFormChange('title', event.target.value)}
                    className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm outline-none focus:border-[#c9252f]"
                    placeholder="뉴스 카드에 표시할 제목"
                  />
                </label>

                <label className="grid gap-1 text-xs font-bold text-slate-700">
                  등록일
                  <input
                    type="date"
                    value={newsForm.date}
                    onChange={(event) => handleNewsFormChange('date', event.target.value)}
                    className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm outline-none focus:border-[#c9252f]"
                  />
                </label>

                <label className="grid gap-1 text-xs font-bold text-slate-700">
                  요약
                  <textarea
                    value={newsForm.summary}
                    onChange={(event) => handleNewsFormChange('summary', event.target.value)}
                    className="min-h-[108px] rounded-md border border-slate-300 bg-white px-2 py-2 text-sm outline-none focus:border-[#c9252f]"
                    placeholder="카드와 상세 미리보기에 표시할 요약"
                  />
                </label>

                <label className="mt-1 inline-flex items-center gap-2 text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={newsForm.isPublished}
                    onChange={(event) => handleNewsFormChange('isPublished', event.target.checked)}
                    className="h-4 w-4 accent-[#c9252f]"
                  />
                  공개 상태
                </label>

                <div className="mt-1 flex gap-2">
                  <button
                    type="submit"
                    disabled={isSavingNews}
                    className="h-10 flex-1 rounded-md border border-[#c9252f] bg-[#c9252f] text-sm font-extrabold text-white disabled:opacity-60"
                  >
                    {isSavingNews ? '저장 중...' : editingNewsId ? '수정 저장' : '뉴스 등록'}
                  </button>
                  <button
                    type="button"
                    onClick={resetNewsForm}
                    className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700"
                  >
                    초기화
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
