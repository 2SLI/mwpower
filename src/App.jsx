import { useEffect, useMemo, useRef, useState } from 'react'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { HomeView } from './views/HomeView'
import { NewsView } from './views/NewsView'
import { ProductsView } from './views/ProductsView'
import { ServiceView } from './views/ServiceView'
import { ContactView } from './views/ContactView'
import { TechnicalContactView } from './views/TechnicalContactView'
import { QuoteRequestView } from './views/QuoteRequestView'
import { AdminView } from './views/AdminView'
import { bannerImages } from './data/bannerImages'
import {
  addQuoteItem,
  clearQuoteItems,
  getQuoteItemSummary,
  readStoredQuoteItems,
  removeQuoteItem,
  updateQuoteItemQuantity,
  writeStoredQuoteItems,
} from './features/quoteCart'

const VIEW_PATHS = {
  home: '/',
  products: '/products',
  news: '/news',
  service: '/service',
  'quote-request': '/quote-request',
  'contact-product': '/contact/product',
  'contact-tech': '/contact/tech',
}

const PATH_VIEW_ALIASES = {
  '/': 'home',
  '/products': 'products',
  '/news': 'news',
  '/service': 'service',
  '/quote': 'quote-request',
  '/quote-request': 'quote-request',
  '/contact': 'contact-product',
  '/contact-product': 'contact-product',
  '/contact/product': 'contact-product',
  '/contact-tech': 'contact-tech',
  '/contact/tech': 'contact-tech',
}

function normalizeView(view) {
  if (view === 'contact') return 'contact-product'
  if (view === 'news' || view === 'products' || view === 'service' || view === 'quote-request' || view === 'contact-product' || view === 'contact-tech') return view
  return 'home'
}

function normalizePathname(pathname = '/') {
  const raw = String(pathname ?? '/').trim().toLowerCase()
  if (!raw || raw === '/') return '/'
  return raw.replace(/\/+$/g, '') || '/'
}

function setMetaByName(name, content) {
  if (!name || !content) return
  let tag = document.querySelector(`meta[name="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function setMetaByProperty(property, content) {
  if (!property || !content) return
  let tag = document.querySelector(`meta[property="${property}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('property', property)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

const SOCIAL_PREVIEW_IMAGE_URL = 'https://meanwellpower-103ae.web.app/logo/mwpower_logo.png'
const QUOTE_MODAL_FALLBACK_VIEW = 'products'

function getPathForView(view) {
  return VIEW_PATHS[normalizeView(view)] ?? VIEW_PATHS.home
}

function getViewForPathname(pathname = '/') {
  const normalized = normalizePathname(pathname)
  return PATH_VIEW_ALIASES[normalized] ?? 'home'
}

function isKnownAppPath(pathname = '/') {
  const normalized = normalizePathname(pathname)
  return normalized === '/admin' || Boolean(PATH_VIEW_ALIASES[normalized])
}

function normalizeBackgroundView(view) {
  const normalized = normalizeView(view)
  return normalized === 'quote-request' ? QUOTE_MODAL_FALLBACK_VIEW : normalized
}

export default function App() {
  const initialPathname = typeof window === 'undefined' ? '/' : normalizePathname(window.location.pathname)
  const initialHistoryState = typeof window === 'undefined' ? null : window.history.state
  const initialView = getViewForPathname(initialPathname)
  const initialQuoteBackgroundView = normalizeBackgroundView(initialHistoryState?.backgroundView || initialView)
  const [activeView, setActiveView] = useState(() => initialView)
  const [productSearchRequest, setProductSearchRequest] = useState(null)
  const [productPresetRequest, setProductPresetRequest] = useState(null)
  const [newsRequest, setNewsRequest] = useState(null)
  const [quoteItems, setQuoteItems] = useState(() => readStoredQuoteItems())
  const [pathname, setPathname] = useState(initialPathname)
  const [quoteBackgroundView, setQuoteBackgroundView] = useState(initialQuoteBackgroundView)
  const isAdminRoute = pathname === '/admin'
  const isQuoteRequestOpen = activeView === 'quote-request'
  const visibleView = isQuoteRequestOpen ? quoteBackgroundView : activeView
  const shouldHideFloatingActions = activeView === 'contact-product' || activeView === 'contact-tech' || isQuoteRequestOpen
  const quoteSummary = useMemo(() => getQuoteItemSummary(quoteItems), [quoteItems])
  const lastNonQuoteViewRef = useRef(normalizeBackgroundView(visibleView))

  useEffect(() => {
    if (isQuoteRequestOpen) return
    lastNonQuoteViewRef.current = normalizeBackgroundView(visibleView)
  }, [isQuoteRequestOpen, visibleView])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const syncPath = () => {
      const nextPath = normalizePathname(window.location.pathname)

      if (nextPath === '/admin') {
        setPathname(nextPath)
        return
      }

      const nextView = getViewForPathname(nextPath)
      const canonicalPath = getPathForView(nextView)
      const currentHistoryState = window.history.state && typeof window.history.state === 'object' ? window.history.state : {}
      const fallbackBackgroundView = normalizeBackgroundView(currentHistoryState.backgroundView || lastNonQuoteViewRef.current || QUOTE_MODAL_FALLBACK_VIEW)
      const nextBackgroundView = nextView === 'quote-request' ? fallbackBackgroundView : normalizeBackgroundView(nextView)
      const nextHistoryState = { ...currentHistoryState, view: nextView }

      if (nextView === 'quote-request') {
        nextHistoryState.backgroundView = nextBackgroundView
      } else {
        if ('backgroundView' in nextHistoryState) delete nextHistoryState.backgroundView
        if ('modalEntry' in nextHistoryState) delete nextHistoryState.modalEntry
      }

      if (
        !isKnownAppPath(nextPath) ||
        nextPath !== canonicalPath ||
        (nextView === 'quote-request' && normalizeBackgroundView(currentHistoryState.backgroundView) !== nextBackgroundView)
      ) {
        window.history.replaceState(nextHistoryState, '', canonicalPath)
      }

      setPathname(canonicalPath)
      setQuoteBackgroundView(nextBackgroundView)
      setActiveView(nextView)
      lastNonQuoteViewRef.current = nextBackgroundView
    }

    syncPath()
    window.addEventListener('popstate', syncPath)
    return () => window.removeEventListener('popstate', syncPath)
  }, [])

  useEffect(() => {
    if (isAdminRoute) return

    const pageMeta = {
      home: {
        title: '민웰파워 | MEAN WELL 정품 공급업체',
        description: '민웰파워 사이트. MEAN WELL 전원공급장치 제품 정보와 기술지원, 정품확인, 상담 서비스를 제공합니다.',
      },
      products: {
        title: '상품 카테고리 | 민웰파워',
        description: 'MEAN WELL 제품 카테고리, 시리즈, 모델별 정보를 확인하고 스펙 문서를 조회할 수 있습니다.',
      },
      news: {
        title: '뉴스 | 민웰파워',
        description: '민웰파워 기술 노트, 제품 공지, 신제품 출시 소식을 확인하세요.',
      },
      service: {
        title: '기술/정품 서비스 | 민웰파워',
        description: '민웰 정품 확인 방법과 기술 서비스 안내를 제공합니다.',
      },
      'quote-request': {
        title: 'B2B 견적요청 | 민웰파워',
        description: '주문목록 기반으로 여러 품목과 수량을 한 번에 접수하는 민웰파워 B2B 견적요청 페이지입니다.',
      },
      'contact-product': {
        title: '제품문의 | 민웰파워',
        description: '민웰파워 제품 사양, 재고, 공급 일정 관련 문의를 접수하세요.',
      },
      'contact-tech': {
        title: '기술문의 | 민웰파워',
        description: '민웰파워 기술 지원, 적용 검토, 대체 모델 관련 문의를 접수하세요.',
      },
    }

    const current = pageMeta[activeView] ?? pageMeta.home
    document.title = current.title
    setMetaByName('description', current.description)
    setMetaByProperty('og:title', current.title)
    setMetaByProperty('og:description', current.description)
    setMetaByProperty('og:image', SOCIAL_PREVIEW_IMAGE_URL)
    setMetaByName('twitter:title', current.title)
    setMetaByName('twitter:description', current.description)
    setMetaByName('twitter:image', SOCIAL_PREVIEW_IMAGE_URL)
  }, [activeView, isAdminRoute])

  useEffect(() => {
    writeStoredQuoteItems(quoteItems)
  }, [quoteItems])

  function handleNavigate(view, options = {}) {
    const nextView = normalizeView(view)
    const nextPath = getPathForView(nextView)
    const useReplace = options.replace === true
    const historyMethod = useReplace ? 'replaceState' : 'pushState'

    if (nextView === 'quote-request') {
      const nextBackgroundView = normalizeBackgroundView(options.backgroundView || visibleView || lastNonQuoteViewRef.current || QUOTE_MODAL_FALLBACK_VIEW)
      setQuoteBackgroundView(nextBackgroundView)
      setActiveView(nextView)
      setPathname(nextPath)
      lastNonQuoteViewRef.current = nextBackgroundView

      if (typeof window !== 'undefined') {
        const currentPath = normalizePathname(window.location.pathname)
        const currentBackgroundView = normalizeBackgroundView(window.history.state?.backgroundView)
        if (useReplace || currentPath !== nextPath || currentBackgroundView !== nextBackgroundView || activeView !== nextView) {
          window.history[historyMethod]({ view: nextView, backgroundView: nextBackgroundView, modalEntry: true }, '', nextPath)
        }
      }

      return
    }

    const nextBackgroundView = normalizeBackgroundView(nextView)
    setActiveView(nextView)
    setPathname(nextPath)
    setQuoteBackgroundView(nextBackgroundView)
    lastNonQuoteViewRef.current = nextBackgroundView

    if (typeof window !== 'undefined') {
      const currentPath = normalizePathname(window.location.pathname)
      if (useReplace || currentPath !== nextPath) {
        window.history[historyMethod]({ view: nextView }, '', nextPath)
      }

      if (options.scrollTop !== false) {
        window.scrollTo({ top: 0, behavior: 'auto' })
      }
    }
  }

  function handleCloseQuoteRequest() {
    const fallbackView = normalizeBackgroundView(quoteBackgroundView || lastNonQuoteViewRef.current || QUOTE_MODAL_FALLBACK_VIEW)

    if (typeof window !== 'undefined') {
      const currentPath = normalizePathname(window.location.pathname)
      const currentHistoryState = window.history.state && typeof window.history.state === 'object' ? window.history.state : {}
      if (currentPath === VIEW_PATHS['quote-request'] && currentHistoryState.modalEntry) {
        window.history.back()
        return
      }
    }

    handleNavigate(fallbackView, { replace: true, scrollTop: false })
  }

  function handleProductSearch(keyword) {
    const term = String(keyword ?? '').trim()
    if (!term) return
    setProductSearchRequest({ keyword: term, at: Date.now() })
    handleNavigate('products')
  }

  function handleOpenProductPreset(preset = {}) {
    const majorId = String(preset.majorId ?? '').trim()
    if (!majorId) return
    setProductPresetRequest({ ...preset, at: Date.now() })
    handleNavigate('products')
  }

  function handleOpenNewsArticle(articleId, category) {
    const id = String(articleId ?? '').trim()
    if (!id) return
    setNewsRequest({ articleId: id, category: String(category ?? ''), at: Date.now() })
    handleNavigate('news')
  }

  function handleAddQuoteItem(item) {
    setQuoteItems((prev) => addQuoteItem(prev, item))
  }

  function handleUpdateQuoteItemQuantity(itemId, quantity) {
    setQuoteItems((prev) => updateQuoteItemQuantity(prev, itemId, quantity))
  }

  function handleRemoveQuoteItem(itemId) {
    setQuoteItems((prev) => removeQuoteItem(prev, itemId))
  }

  function handleClearQuoteItems() {
    setQuoteItems(clearQuoteItems())
  }

  if (isAdminRoute) {
    return <AdminView />
  }

  return (
    <>
      <div className={`fixed right-2.5 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-2 max-[640px]:right-2 ${shouldHideFloatingActions ? 'is-hidden' : ''}`}>
        <button
          type="button"
          className="grid h-[46px] w-[46px] place-items-center rounded-full bg-slate-700 max-[640px]:h-10 max-[640px]:w-10"
          aria-label="Back to top"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        >
          <i className="fa-solid fa-arrow-up text-[18px] text-white" aria-hidden="true"></i>
        </button>

        <a
          href="#"
          className="relative grid h-[46px] w-[46px] place-items-center rounded-full bg-[#b9252d] max-[640px]:h-10 max-[640px]:w-10"
          aria-label="B2B quote request"
          onClick={(event) => {
            event.preventDefault()
            handleNavigate('quote-request', { scrollTop: false })
          }}
        >
          <i className="fa-regular fa-clipboard text-[18px] text-white" aria-hidden="true"></i>
          {quoteSummary.totalQuantity > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#ffd84d] px-1 text-[10px] font-black leading-[18px] text-slate-900">
              {quoteSummary.totalQuantity > 99 ? '99+' : quoteSummary.totalQuantity}
            </span>
          ) : null}
        </a>

        <a
          href="#"
          className="inquiry-fab grid h-[46px] w-[46px] place-items-center rounded-full bg-[#ea332d] max-[640px]:h-10 max-[640px]:w-10"
          aria-label="Sales inquiry"
          onClick={(event) => {
            event.preventDefault()
            handleNavigate('contact-product')
          }}
        >
          <i className="fa-solid fa-envelope text-[18px] text-white" aria-hidden="true"></i>
        </a>
      </div>

      <div className="min-h-screen bg-slate-100 text-slate-600">
        <Header
          activeView={activeView}
          onNavigate={handleNavigate}
          onProductSearch={handleProductSearch}
          quoteItemCount={quoteSummary.totalQuantity}
        />
        <main className="pt-[92px] max-[1280px]:pt-[62px]">
          <HomeView
            isActive={visibleView === 'home'}
            bannerImages={bannerImages}
            onNavigate={handleNavigate}
            onOpenProductPreset={handleOpenProductPreset}
            onOpenProductSearch={handleProductSearch}
            onOpenNewsArticle={handleOpenNewsArticle}
          />
          <NewsView isActive={visibleView === 'news'} onNavigate={handleNavigate} externalNewsRequest={newsRequest} />
          <ProductsView
            isActive={visibleView === 'products'}
            externalSearchRequest={productSearchRequest}
            externalPresetRequest={productPresetRequest}
            onAddQuoteItem={handleAddQuoteItem}
            quoteItemCount={quoteSummary.totalQuantity}
          />
          <ServiceView isActive={visibleView === 'service'} />
          <QuoteRequestView
            isOpen={isQuoteRequestOpen}
            items={quoteItems}
            onClose={handleCloseQuoteRequest}
            onUpdateQuantity={handleUpdateQuoteItemQuantity}
            onRemoveItem={handleRemoveQuoteItem}
            onClearItems={handleClearQuoteItems}
          />
          <ContactView isActive={visibleView === 'contact-product'} />
          <TechnicalContactView isActive={visibleView === 'contact-tech'} />
        </main>
        <Footer />
      </div>
    </>
  )
}
