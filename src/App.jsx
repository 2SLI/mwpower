import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { bannerImages } from './data/bannerImages'
import {
  addQuoteItem,
  clearQuoteItems,
  getQuoteItemSummary,
  readStoredOrderItems,
  readStoredQuoteItems,
  removeQuoteItem,
  updateQuoteItemQuantity,
  writeStoredOrderItems,
  writeStoredQuoteItems,
} from './features/quoteCart'

const HomeView = lazy(() => import('./views/HomeView').then((module) => ({ default: module.HomeView })))
const NewsView = lazy(() => import('./views/NewsView').then((module) => ({ default: module.NewsView })))
const ProductsView = lazy(() => import('./views/ProductsView').then((module) => ({ default: module.ProductsView })))
const ServiceView = lazy(() => import('./views/ServiceView').then((module) => ({ default: module.ServiceView })))
const ContactView = lazy(() => import('./views/ContactView').then((module) => ({ default: module.ContactView })))
const TechnicalContactView = lazy(() => import('./views/TechnicalContactView').then((module) => ({ default: module.TechnicalContactView })))
const QuoteRequestView = lazy(() => import('./views/QuoteRequestView').then((module) => ({ default: module.QuoteRequestView })))
const OrderListView = lazy(() => import('./views/OrderListView').then((module) => ({ default: module.OrderListView })))
const GuestOrderView = lazy(() => import('./views/GuestOrderView').then((module) => ({ default: module.GuestOrderView })))
const OrderCheckoutView = lazy(() => import('./views/OrderCheckoutView').then((module) => ({ default: module.OrderCheckoutView })))
const OrderCompleteView = lazy(() => import('./views/OrderCompleteView').then((module) => ({ default: module.OrderCompleteView })))
const OrderSearchView = lazy(() => import('./views/OrderSearchView').then((module) => ({ default: module.OrderSearchView })))
const LoginView = lazy(() => import('./views/LoginView').then((module) => ({ default: module.LoginView })))
const MyOrdersView = lazy(() => import('./views/MyOrdersView').then((module) => ({ default: module.MyOrdersView })))
const AdminView = lazy(() => import('./views/AdminView').then((module) => ({ default: module.AdminView })))

const VIEW_PATHS = {
  home: '/',
  products: '/products',
  news: '/news',
  service: '/service',
  'order-list': '/order-list',
  'order-form': '/order',
  'order-checkout': '/order-checkout',
  'order-complete': '/order-complete',
  'order-search': '/order-search',
  login: '/login',
  'my-orders': '/mypage',
  'quote-request': '/quote-request',
  'contact-product': '/contact/product',
  'contact-tech': '/contact/tech',
}

const PATH_VIEW_ALIASES = {
  '/': 'home',
  '/products': 'products',
  '/news': 'news',
  '/service': 'service',
  '/order-list': 'order-list',
  '/order-search': 'order-search',
  '/order-checkout': 'order-checkout',
  '/login': 'login',
  '/mypage': 'my-orders',
  '/my-orders': 'my-orders',
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
  if (
    view === 'news' ||
    view === 'products' ||
    view === 'service' ||
    view === 'order-list' ||
    view === 'order-form' ||
    view === 'order-checkout' ||
    view === 'order-complete' ||
    view === 'order-search' ||
    view === 'login' ||
    view === 'my-orders' ||
    view === 'quote-request' ||
    view === 'contact-product' ||
    view === 'contact-tech'
  ) {
    return view
  }
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

const SOCIAL_PREVIEW_IMAGE_URL = 'https://mwpower.co.kr/logo/mwpower_logo.png'
const QUOTE_MODAL_FALLBACK_VIEW = 'products'
const STORE_BASE_PATH = '/store'
const SHOP_ONLY_VIEWS = new Set(['order-list', 'order-form', 'order-checkout', 'order-complete', 'order-search', 'login', 'my-orders'])
const OFFICIAL_ONLY_VIEWS = new Set(['news', 'service', 'quote-request', 'contact-product', 'contact-tech'])

function isStorePathname(pathname = '/') {
  const normalized = normalizePathname(pathname)
  return normalized === STORE_BASE_PATH || normalized.startsWith(`${STORE_BASE_PATH}/`)
}

function stripStoreBasePath(pathname = '/') {
  const normalized = normalizePathname(pathname)
  if (normalized === STORE_BASE_PATH) return '/'
  if (normalized.startsWith(`${STORE_BASE_PATH}/`)) return normalized.slice(STORE_BASE_PATH.length) || '/'
  return normalized
}

function addStoreBasePath(pathname = '/') {
  const normalized = normalizePathname(pathname)
  if (normalized === '/') return STORE_BASE_PATH
  return `${STORE_BASE_PATH}${normalized}`
}

function getAllowedViewForSite(view, isShopSite) {
  const normalized = normalizeView(view)
  if (isShopSite && normalized === 'order-search') return 'my-orders'
  if (isShopSite) return OFFICIAL_ONLY_VIEWS.has(normalized) ? 'products' : normalized
  if (!SHOP_ONLY_VIEWS.has(normalized)) return normalized
  return 'quote-request'
}

function getOrderItemStockLimit(item = {}) {
  const storedStock = Number(item.stockQuantity)
  if (Number.isFinite(storedStock)) return Math.max(0, storedStock)
  return null
}

function clampOrderItemQuantity(item = {}, quantity = 1) {
  const requestedQuantity = Math.max(1, Math.floor(Number(quantity) || 1))
  const stockLimit = getOrderItemStockLimit(item)
  if (!Number.isFinite(stockLimit) || stockLimit < 1) return requestedQuantity
  return Math.min(requestedQuantity, stockLimit)
}

function getPathForView(view, isShopSite = false) {
  const path = VIEW_PATHS[normalizeView(view)] ?? VIEW_PATHS.home
  return isShopSite ? addStoreBasePath(path) : path
}

function getViewForPathname(pathname = '/') {
  const normalized = stripStoreBasePath(pathname)
  if (normalized.startsWith('/news/')) return 'news'
  if (normalized.startsWith('/order-complete/')) return 'order-complete'
  if (normalized.startsWith('/order/')) return 'order-form'
  return PATH_VIEW_ALIASES[normalized] ?? 'home'
}

function isKnownAppPath(pathname = '/') {
  const raw = normalizePathname(pathname)
  const normalized = stripStoreBasePath(pathname)
  return raw === '/admin' || raw.startsWith('/admin/') || normalized.startsWith('/news/') || normalized.startsWith('/order-complete/') || normalized.startsWith('/order/') || Boolean(PATH_VIEW_ALIASES[normalized])
}

function getCanonicalPathForPathname(pathname = '/', view = getViewForPathname(pathname), isShopSite = false) {
  const normalized = stripStoreBasePath(pathname)
  if (view === 'news' && normalized.startsWith('/news/')) return isShopSite ? addStoreBasePath(normalized) : normalized
  if (view === 'order-complete' && normalized.startsWith('/order-complete/')) return isShopSite ? addStoreBasePath(normalized) : normalized
  if (view === 'order-form' && normalized.startsWith('/order/')) return isShopSite ? addStoreBasePath(normalized) : normalized
  return getPathForView(view, isShopSite)
}

function normalizeBackgroundView(view) {
  const normalized = normalizeView(view)
  return normalized === 'quote-request' || normalized === 'order-list' ? QUOTE_MODAL_FALLBACK_VIEW : normalized
}

function getRouteParamFromPath(pathname = '/', prefix = '') {
  const normalized = stripStoreBasePath(pathname)
  const cleanPrefix = normalizePathname(prefix)
  if (!normalized.startsWith(`${cleanPrefix}/`)) return ''
  const raw = normalized.slice(cleanPrefix.length + 1).split('/')[0] ?? ''
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

export default function App() {
  const isShopSite = typeof window === 'undefined' ? false : isStorePathname(window.location.pathname)
  const initialPathname = typeof window === 'undefined' ? '/' : normalizePathname(window.location.pathname)
  const initialHistoryState = typeof window === 'undefined' ? null : window.history.state
  const initialView = getAllowedViewForSite(getViewForPathname(initialPathname), isShopSite)
  const initialQuoteBackgroundView = normalizeBackgroundView(initialHistoryState?.backgroundView || initialView)
  const [activeView, setActiveView] = useState(() => initialView)
  const [productSearchRequest, setProductSearchRequest] = useState(null)
  const [productPresetRequest, setProductPresetRequest] = useState(null)
  const [newsRequest, setNewsRequest] = useState(null)
  const [orderItems, setOrderItems] = useState(() => readStoredOrderItems())
  const [quoteItems, setQuoteItems] = useState(() => readStoredQuoteItems())
  const [pathname, setPathname] = useState(initialPathname)
  const [quoteBackgroundView, setQuoteBackgroundView] = useState(initialQuoteBackgroundView)
  const [guestOrderQuantity, setGuestOrderQuantity] = useState(() => Math.max(1, Math.floor(Number(initialHistoryState?.quantity) || 1)))
  const [authUser, setAuthUser] = useState(null)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/')
  const isOrderListOpen = activeView === 'order-list'
  const isQuoteRequestOpen = activeView === 'quote-request'
  const isModalViewOpen = isOrderListOpen || isQuoteRequestOpen
  const visibleView = isModalViewOpen ? quoteBackgroundView : activeView
  const shouldHideFloatingActions =
    activeView === 'contact-product' ||
    activeView === 'contact-tech' ||
    activeView === 'order-form' ||
    activeView === 'order-checkout' ||
    activeView === 'order-complete' ||
    activeView === 'order-search' ||
    activeView === 'login' ||
    activeView === 'my-orders' ||
    isModalViewOpen
  const orderSummary = useMemo(() => getQuoteItemSummary(orderItems), [orderItems])
  const quoteSummary = useMemo(() => getQuoteItemSummary(quoteItems), [quoteItems])
  const lastNonQuoteViewRef = useRef(normalizeBackgroundView(visibleView))

  useEffect(() => {
    if (isModalViewOpen) return
    lastNonQuoteViewRef.current = normalizeBackgroundView(visibleView)
  }, [isModalViewOpen, visibleView])

  useEffect(() => {
    let alive = true
    let unsubscribe = null

    import('./features/authService').then(({ subscribeAuthState }) => {
      if (!alive) return
      unsubscribe = subscribeAuthState((user) => {
        setAuthUser(user)
        setIsAuthReady(true)
      })
    })

    return () => {
      alive = false
      unsubscribe?.()
    }
  }, [])

  useEffect(() => {
    if (!isShopSite || !isAuthReady || authUser) return
    if (activeView === 'order-form' || activeView === 'order-checkout') {
      handleNavigate('login', { replace: true })
    }
  }, [isShopSite, isAuthReady, authUser, activeView])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const syncPath = () => {
      const nextPath = normalizePathname(window.location.pathname)

      if (nextPath === '/admin' || nextPath.startsWith('/admin/')) {
        setPathname(nextPath)
        return
      }

      const requestedView = getViewForPathname(nextPath)
      const nextView = getAllowedViewForSite(requestedView, isShopSite)
      const canonicalPath = getCanonicalPathForPathname(nextPath, nextView, isShopSite)
      const currentHistoryState = window.history.state && typeof window.history.state === 'object' ? window.history.state : {}
      const fallbackBackgroundView = normalizeBackgroundView(currentHistoryState.backgroundView || lastNonQuoteViewRef.current || QUOTE_MODAL_FALLBACK_VIEW)
      const nextBackgroundView = nextView === 'quote-request' || nextView === 'order-list' ? fallbackBackgroundView : normalizeBackgroundView(nextView)
      const nextHistoryState = { ...currentHistoryState, view: nextView }

      if (nextView === 'quote-request' || nextView === 'order-list') {
        nextHistoryState.backgroundView = nextBackgroundView
      } else {
        if ('backgroundView' in nextHistoryState) delete nextHistoryState.backgroundView
        if ('modalEntry' in nextHistoryState) delete nextHistoryState.modalEntry
      }

      if (
        !isKnownAppPath(nextPath) ||
        nextPath !== canonicalPath ||
        ((nextView === 'quote-request' || nextView === 'order-list') && normalizeBackgroundView(currentHistoryState.backgroundView) !== nextBackgroundView)
      ) {
        window.history.replaceState(nextHistoryState, '', canonicalPath)
      }

      setPathname(canonicalPath)
      setQuoteBackgroundView(nextBackgroundView)
      setActiveView(nextView)
      if (nextView === 'order-form') {
        setGuestOrderQuantity(Math.max(1, Math.floor(Number(currentHistoryState.quantity) || 1)))
      }
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
        title: 'MWPOWER | MEAN WELL 정품 SMPS 공급업체',
        description: 'MWPOWER는 MEAN WELL 정품 SMPS와 전원공급장치 제품 정보, 기술지원, 정품확인, 상담 서비스를 제공합니다.',
      },
      products: {
        title: '상품 카테고리 | MWPOWER',
        description: 'MEAN WELL 제품 카테고리, 시리즈, 모델별 정보를 확인하고 스펙 문서를 조회할 수 있습니다.',
      },
      news: {
        title: '뉴스 | MWPOWER',
        description: 'MWPOWER의 제품 소식, 적용 사례, 블로그 콘텐츠를 뉴스 형식으로 확인하세요.',
      },
      service: {
        title: '기술/정품 서비스 | MWPOWER',
        description: '민웰 정품 확인 방법과 기술 서비스 안내를 제공합니다.',
      },
      'order-list': {
        title: '장바구니 | MWPOWER Store',
        description: '담아둔 MEAN WELL 정품 SMPS 품목과 수량을 확인하는 MWPOWER Store 장바구니입니다.',
      },
      'order-form': {
        title: isShopSite ? '회원 주문서 | MWPOWER Store' : '비회원 주문서 | MWPOWER',
        description: isShopSite
          ? '로그인한 회원이 MWPOWER Store 상품을 무통장입금 방식으로 주문할 수 있습니다.'
          : 'MWPOWER 상품을 로그인 없이 무통장입금 방식으로 주문할 수 있습니다.',
      },
      'order-checkout': {
        title: '주문서 작성 | MWPOWER Store',
        description: isShopSite
          ? '장바구니에 담긴 MWPOWER Store 상품을 로그인 후 주문할 수 있습니다.'
          : '주문목록에 담긴 MWPOWER 상품을 로그인 없이 주문할 수 있습니다.',
      },
      'order-complete': {
        title: '주문 완료 | MWPOWER Store',
        description: 'MWPOWER Store 주문 접수 내역과 입금 계좌 정보를 확인하세요.',
      },
      'order-search': {
        title: '주문 조회 | MWPOWER',
        description: '주문번호와 연락처로 MWPOWER 주문 상태를 조회하세요.',
      },
      login: {
        title: '로그인 | MWPOWER',
        description: 'Google 계정으로 MWPOWER에 로그인합니다.',
      },
      'my-orders': {
        title: '마이페이지 | MWPOWER Store',
        description: '로그인한 계정의 회원 정보와 MWPOWER Store 주문내역을 확인합니다.',
      },
      'quote-request': {
        title: 'B2B 견적요청 | MWPOWER',
        description: '견적목록 기반으로 여러 품목과 수량을 한 번에 접수하는 MWPOWER B2B 견적요청 페이지입니다.',
      },
      'contact-product': {
        title: '제품문의 | MWPOWER',
        description: isShopSite
          ? 'MWPOWER 제품 사양, 재고, 공급 일정 관련 문의를 접수하세요.'
          : 'MWPOWER 제품 사양과 공급 일정 관련 문의를 접수하세요.',
      },
      'contact-tech': {
        title: '기술문의 | MWPOWER',
        description: 'MWPOWER 기술 지원, 적용 검토, 대체 모델 관련 문의를 접수하세요.',
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
  }, [activeView, isAdminRoute, isShopSite])

  useEffect(() => {
    writeStoredOrderItems(orderItems)
  }, [orderItems])

  useEffect(() => {
    writeStoredQuoteItems(quoteItems)
  }, [quoteItems])

  function handleNavigate(view, options = {}) {
    const nextView = getAllowedViewForSite(view, isShopSite)
    const nextPath = getPathForView(nextView, isShopSite)
    const useReplace = options.replace === true
    const historyMethod = useReplace ? 'replaceState' : 'pushState'

    if (nextView === 'quote-request' || nextView === 'order-list') {
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

  function handleCloseModalView() {
    const fallbackView = normalizeBackgroundView(quoteBackgroundView || lastNonQuoteViewRef.current || QUOTE_MODAL_FALLBACK_VIEW)
    handleNavigate(fallbackView, { replace: true, scrollTop: false })
  }

  function handleNavigateProductsFromQuote() {
    handleNavigate('products', { replace: true })
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

  function handleOpenStoreProductPreset(preset = {}) {
    const majorId = String(preset.majorId ?? '').trim()
    if (!majorId) return

    const nextPath = getPathForView('products', true)
    setProductPresetRequest({ ...preset, at: Date.now() })
    setActiveView('products')
    setPathname(nextPath)
    setQuoteBackgroundView('products')
    lastNonQuoteViewRef.current = 'products'

    if (typeof window !== 'undefined') {
      const currentPath = normalizePathname(window.location.pathname)
      if (currentPath !== nextPath) {
        window.history.pushState({ view: 'products' }, '', nextPath)
      }
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }

  function handleOpenNewsArticle(articleId) {
    const id = String(articleId ?? '').trim()
    if (!id) return
    const nextPath = `/news/${encodeURIComponent(id)}`
    setNewsRequest({ articleId: id, at: Date.now() })
    setActiveView('news')
    setPathname(nextPath)
    setQuoteBackgroundView('news')
    lastNonQuoteViewRef.current = 'news'

    if (typeof window !== 'undefined') {
      const currentPath = normalizePathname(window.location.pathname)
      if (currentPath !== nextPath) {
        window.history.pushState({ view: 'news', articleId: id }, '', nextPath)
      }
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }

  function handleStartGuestOrder(productId, quantity = 1) {
    if (!isShopSite) {
      handleNavigate('quote-request', { scrollTop: false, backgroundView: visibleView })
      return
    }
    if (!authUser) {
      handleNavigate('login')
      return
    }
    const id = String(productId ?? '').trim()
    if (!id) return
    const orderQuantity = Math.max(1, Math.floor(Number(quantity) || 1))
    const nextPath = `${isShopSite ? STORE_BASE_PATH : ''}/order/${encodeURIComponent(id)}`
    setActiveView('order-form')
    setPathname(nextPath)
    setQuoteBackgroundView('order-form')
    setGuestOrderQuantity(orderQuantity)
    lastNonQuoteViewRef.current = 'order-form'

    if (typeof window !== 'undefined') {
      const currentPath = normalizePathname(window.location.pathname)
      if (currentPath !== normalizePathname(nextPath)) {
        window.history.pushState({ view: 'order-form', productId: id, quantity: orderQuantity }, '', nextPath)
      } else {
        window.history.replaceState({ ...(window.history.state ?? {}), view: 'order-form', productId: id, quantity: orderQuantity }, '', nextPath)
      }
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }

  function handleOrderComplete(orderNumber) {
    const id = String(orderNumber ?? '').trim()
    if (!id) return
    const nextPath = `${isShopSite ? STORE_BASE_PATH : ''}/order-complete/${encodeURIComponent(id)}`
    setActiveView('order-complete')
    setPathname(nextPath)
    setQuoteBackgroundView('order-complete')
    lastNonQuoteViewRef.current = 'order-complete'

    if (typeof window !== 'undefined') {
      window.history.pushState({ view: 'order-complete', orderNumber: id }, '', nextPath)
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }

  function handleCheckoutOrderList() {
    if (!isShopSite) return
    if (orderItems.length === 0) return
    if (!authUser) {
      handleCloseModalView()
      handleNavigate('login')
      return
    }
    handleCloseModalView()
    const nextPath = getPathForView('order-checkout', isShopSite)
    setActiveView('order-checkout')
    setPathname(nextPath)
    setQuoteBackgroundView('order-checkout')
    lastNonQuoteViewRef.current = 'order-checkout'

    if (typeof window !== 'undefined') {
      window.history.pushState({ view: 'order-checkout' }, '', nextPath)
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }

  function handleAddOrderItem(item) {
    if (!isShopSite) {
      handleAddQuoteItem(item)
      return
    }
    const nextItem = {
      ...item,
      quantity: clampOrderItemQuantity(item, item.quantity),
    }
    setOrderItems((prev) => addQuoteItem(prev, nextItem))
    handleNavigate('order-list', { scrollTop: false, backgroundView: visibleView })
  }

  function handleAddQuoteItem(item) {
    setQuoteItems((prev) => addQuoteItem(prev, item))
    handleNavigate('quote-request', { scrollTop: false, backgroundView: visibleView })
  }

  function handleUpdateOrderItemQuantity(itemId, quantity) {
    setOrderItems((prev) => {
      const targetItem = prev.find((item) => item.id === itemId)
      return updateQuoteItemQuantity(prev, itemId, clampOrderItemQuantity(targetItem, quantity))
    })
  }

  function handleUpdateQuoteItemQuantity(itemId, quantity) {
    setQuoteItems((prev) => updateQuoteItemQuantity(prev, itemId, quantity))
  }

  function handleRemoveOrderItem(itemId) {
    setOrderItems((prev) => removeQuoteItem(prev, itemId))
  }

  function handleRemoveQuoteItem(itemId) {
    setQuoteItems((prev) => removeQuoteItem(prev, itemId))
  }

  function handleClearOrderItems() {
    setOrderItems(clearQuoteItems())
  }

  function handleClearQuoteItems() {
    setQuoteItems(clearQuoteItems())
  }

  async function handleSignOut() {
    const { logoutUser } = await import('./features/authService')
    await logoutUser()
    if (activeView === 'my-orders') handleNavigate('login')
  }

  function renderVisibleView() {
    switch (visibleView) {
      case 'news':
        return (
          <NewsView
            isActive
            onNavigate={handleNavigate}
            onOpenNewsArticle={handleOpenNewsArticle}
            externalNewsRequest={newsRequest}
            pathname={pathname}
          />
        )
      case 'products':
        return (
          <ProductsView
            isActive
            isShopSite={isShopSite}
            externalSearchRequest={productSearchRequest}
            externalPresetRequest={productPresetRequest}
            onAddOrderItem={handleAddOrderItem}
            onAddQuoteItem={handleAddQuoteItem}
            onStartGuestOrder={handleStartGuestOrder}
            onOpenStoreProductPreset={handleOpenStoreProductPreset}
            quoteItemCount={quoteSummary.totalQuantity}
            orderItemCount={orderSummary.totalQuantity}
          />
        )
      case 'service':
        return <ServiceView isActive />
      case 'order-form':
        return (
          <GuestOrderView
            isActive
            productId={getRouteParamFromPath(pathname, '/order')}
            initialQuantity={guestOrderQuantity}
            authUser={authUser}
            onNavigateProducts={() => handleNavigate('products')}
            onOrderComplete={handleOrderComplete}
          />
        )
      case 'order-complete':
        return (
          <OrderCompleteView
            isActive
            orderNumber={getRouteParamFromPath(pathname, '/order-complete')}
            onNavigateOrderSearch={() => handleNavigate(isShopSite ? 'my-orders' : 'order-search')}
          />
        )
      case 'order-checkout':
        return (
          <OrderCheckoutView
            isActive
            items={orderItems}
            authUser={authUser}
            onNavigateProducts={() => handleNavigate('products')}
            onOrderComplete={handleOrderComplete}
            onClearItems={handleClearOrderItems}
          />
        )
      case 'order-search':
        return <OrderSearchView isActive />
      case 'login':
        return <LoginView isActive authUser={authUser} onNavigateMyOrders={() => handleNavigate('my-orders')} />
      case 'my-orders':
        return <MyOrdersView isActive authUser={authUser} onNavigateLogin={() => handleNavigate('login')} />
      case 'contact-product':
        return <ContactView isActive isShopSite={isShopSite} />
      case 'contact-tech':
        return <TechnicalContactView isActive />
      case 'home':
      default:
        return (
          <HomeView
            isActive
            isShopSite={isShopSite}
            bannerImages={bannerImages}
            onNavigate={handleNavigate}
            onOpenProductPreset={handleOpenProductPreset}
            onOpenProductSearch={handleProductSearch}
            onOpenNewsArticle={handleOpenNewsArticle}
            orderItemCount={orderSummary.totalQuantity}
          />
        )
    }
  }

  const routeFallback = <div className="min-h-[420px] bg-slate-100" aria-hidden="true"></div>

  if (isAdminRoute) {
    return (
      <Suspense fallback={routeFallback}>
        <AdminView pathname={pathname} />
      </Suspense>
    )
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

        {isShopSite ? (
          <a
            href="#"
            className="relative grid h-[46px] w-[46px] place-items-center rounded-full bg-[#d53232] max-[640px]:h-10 max-[640px]:w-10"
            aria-label="Cart"
            onClick={(event) => {
              event.preventDefault()
              handleNavigate('order-list', { scrollTop: false })
            }}
          >
            <i className="fa-solid fa-cart-shopping text-[17px] text-white" aria-hidden="true"></i>
            {orderSummary.totalQuantity > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#ffd84d] px-1 text-[10px] font-black leading-[18px] text-slate-900">
                {orderSummary.totalQuantity > 99 ? '99+' : orderSummary.totalQuantity}
              </span>
            ) : null}
          </a>
        ) : (
          <>
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
          </>
        )}
      </div>

      <div className="min-h-screen bg-slate-100 text-slate-600">
        <Header
          activeView={activeView}
          isShopSite={isShopSite}
          authUser={authUser}
          onNavigate={handleNavigate}
          onProductSearch={handleProductSearch}
          onProductRouteSelect={handleOpenProductPreset}
          onSignOut={handleSignOut}
          quoteItemCount={quoteSummary.totalQuantity}
          orderItemCount={orderSummary.totalQuantity}
        />
        <main className="pt-[92px] max-[1280px]:pt-[62px]">
          <Suspense fallback={routeFallback}>
            {renderVisibleView()}
            {isOrderListOpen ? (
              <OrderListView
                isOpen
                items={orderItems}
                onClose={handleCloseModalView}
                onNavigateProducts={handleNavigateProductsFromQuote}
                onCheckout={handleCheckoutOrderList}
                onUpdateQuantity={handleUpdateOrderItemQuantity}
                onRemoveItem={handleRemoveOrderItem}
                onClearItems={handleClearOrderItems}
              />
            ) : null}
            {isQuoteRequestOpen ? (
              <QuoteRequestView
                isOpen
                items={quoteItems}
                onClose={handleCloseModalView}
                onNavigateProducts={handleNavigateProductsFromQuote}
                onUpdateQuantity={handleUpdateQuoteItemQuantity}
                onRemoveItem={handleRemoveQuoteItem}
                onClearItems={handleClearQuoteItems}
              />
            ) : null}
          </Suspense>
        </main>
        <Footer isShopSite={isShopSite} />
      </div>
    </>
  )
}
