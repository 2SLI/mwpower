import { lazy, Suspense, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { lockBodyScroll } from '../utils/bodyScrollLock'

const ProductSearchModal = lazy(() => import('./ProductSearchModal').then((module) => ({ default: module.ProductSearchModal })))

const navItems = [
  { key: 'products', label: '제품', view: 'products' },
  { key: 'news', label: '뉴스', view: 'news' },
  { key: 'service', label: '서비스', view: 'service' },
  { key: 'order-list', label: '주문목록', view: 'order-list' },
  { key: 'quote-request', label: '견적요청', view: 'quote-request' },
  { key: 'contact-product', label: '제품문의', view: 'contact-product' },
  { key: 'contact-tech', label: '기술문의', view: 'contact-tech' },
]

const shopNavItems = [
  { key: 'products', label: '상품', view: 'products' },
  { key: 'order-list', label: '장바구니', view: 'order-list' },
]

const LOGO_SRC = '/logo/mwpower_logo.png'
const LOGO_ALT = 'MWPOWER 로고'

function getSiteSwitchHref(isShopSite = true) {
  return isShopSite ? '/' : '/store'
}

function NavLink({ item, isActive, onNavigate, badgeCount = 0, compact = false }) {
  const isExternal = Boolean(item.href)

  return (
    <a
      href={item.href ?? '#'}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className={`main-nav-link relative px-5 font-semibold tracking-[-0.01em] text-[#0e2238] max-[1280px]:px-3 max-[1280px]:text-sm ${
        compact ? 'text-[15px] leading-[62px]' : 'text-[clamp(14px,0.95vw,19px)] leading-[92px] max-[1280px]:leading-[62px]'
      } ${
        isActive ? 'active' : ''
      }`}
      onClick={(event) => {
        if (isExternal) return
        event.preventDefault()
        onNavigate(item.view)
      }}
    >
      <span>{item.label}</span>
      {badgeCount > 0 ? (
        <span className="ml-2 inline-flex min-w-[20px] items-center justify-center rounded-full bg-[#ffe26c] px-1.5 py-0.5 text-[10px] font-black leading-none text-slate-900">
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      ) : null}
    </a>
  )
}

export function Header({ activeView, isShopSite = true, authUser = null, onNavigate, onProductSearch, onProductRouteSelect, onSignOut, orderItemCount = 0, quoteItemCount = 0 }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const visibleNavItems = isShopSite ? shopNavItems : navItems.filter((item) => item.key !== 'order-list')
  const siteSwitchHref = getSiteSwitchHref(isShopSite)
  const siteSwitchLabel = isShopSite ? 'MWPOWER' : 'MWPOWER STORE'

  useEffect(() => {
    setIsMenuOpen(false)
  }, [activeView])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const query = window.matchMedia('(max-width: 980px)')
    const sync = () => {
      if (!query.matches) setIsMenuOpen(false)
    }

    sync()

    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', sync)
      return () => query.removeEventListener('change', sync)
    }

    query.addListener(sync)
    return () => query.removeListener(sync)
  }, [])

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== 'Escape') return
      setIsSearchOpen(false)
      setIsMenuOpen(false)
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  useEffect(() => {
    if (!isMenuOpen) return undefined
    return lockBodyScroll()
  }, [isMenuOpen])

  const handleInternalMenuClick = (view) => {
    onNavigate(view)
    setIsMenuOpen(false)
  }

  const mobileMenuPortal =
    isMenuOpen && typeof document !== 'undefined'
      ? createPortal(
          <div className="fixed inset-0 z-[1000] px-3 py-3 max-[640px]:px-2.5 max-[640px]:py-2.5">
            <button
              type="button"
              className="absolute inset-0 bg-black/[0.12]"
              onClick={() => setIsMenuOpen(false)}
              aria-label="메뉴 닫기"
            ></button>

            <aside
              id="mobile-header-menu"
              className="absolute bottom-3 right-3 top-3 z-[1010] flex w-[min(72vw,320px)] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_28px_60px_rgba(2,8,23,0.28)] max-[640px]:bottom-2.5 max-[640px]:right-2.5 max-[640px]:top-2.5 max-[640px]:w-[min(74vw,308px)]"
              aria-label="Header menu"
            >
              <header className="relative overflow-hidden bg-[linear-gradient(135deg,#e53a33_0%,#c6252e_55%,#8d161f_100%)] px-5 pb-5 pr-16 pt-6 text-white">
                <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/[0.12]"></div>
                <button
                  type="button"
                  className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/[0.12] text-2xl leading-none text-white transition hover:bg-white/20"
                  onClick={() => setIsMenuOpen(false)}
                  aria-label="메뉴 닫기"
                >
                  <span aria-hidden="true">×</span>
                </button>
                <p className="m-0 text-[10px] font-black tracking-[0.14em] text-rose-100">MENU</p>
                <h2 className="m-0 mt-2">
                  <img src={LOGO_SRC} alt={LOGO_ALT} className="h-[56px] w-[56px] object-contain" />
                </h2>
                <p className="mb-0 mt-2 text-xs font-semibold text-rose-100">{isShopSite ? '상품 검색과 주문 메뉴를 빠르게 이동하세요.' : '제품/서비스 메뉴를 빠르게 이동하세요.'}</p>
                {isShopSite ? (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-black text-white">
                    <span>주문목록</span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-[#b92a31]">{orderItemCount > 99 ? '99+' : orderItemCount}</span>
                  </div>
                ) : null}
              </header>

              <div className="flex-1 overflow-y-auto bg-white px-3 py-3.5">
                <ul className="m-0 list-none space-y-1.5 p-0">
                  {visibleNavItems.map((item) => {
                    const baseClass =
                      'flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left text-sm font-bold text-slate-700 transition hover:border-[#d45252] hover:bg-[#fff5f5] hover:text-[#c83434]'

                    if (item.href) {
                      return (
                        <li key={`drawer-${item.label}`}>
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={baseClass}
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <span>{item.label}</span>
                            <span aria-hidden="true">↗</span>
                          </a>
                        </li>
                      )
                    }

                    return (
                      <li key={`drawer-${item.view ?? item.label}`}>
                        <button
                          type="button"
                          className={`${baseClass} ${item.key === activeView ? 'border-[#d94a4a] bg-[#fff0f0] text-[#c42f2f]' : ''}`}
                          onClick={() => handleInternalMenuClick(item.view)}
                        >
                          <span className="flex items-center gap-2">
                            <span>{item.label}</span>
                            {item.key === 'order-list' && orderItemCount > 0 ? (
                              <span className="rounded-full bg-[#ffe26c] px-2 py-0.5 text-[10px] font-black leading-none text-slate-900">
                                {orderItemCount > 99 ? '99+' : orderItemCount}
                              </span>
                            ) : null}
                            {item.key === 'quote-request' && quoteItemCount > 0 ? (
                              <span className="rounded-full bg-[#ffe26c] px-2 py-0.5 text-[10px] font-black leading-none text-slate-900">
                                {quoteItemCount > 99 ? '99+' : quoteItemCount}
                              </span>
                            ) : null}
                          </span>
                          <span aria-hidden="true">›</span>
                        </button>
                      </li>
                    )
                  })}
                  {isShopSite ? (
                    <li>
                      <button
                        type="button"
                        className={`flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left text-sm font-bold transition hover:border-[#d45252] hover:bg-[#fff5f5] hover:text-[#c83434] ${
                          activeView === 'my-orders' ? 'border-[#d94a4a] bg-[#fff0f0] text-[#c42f2f]' : 'text-slate-700'
                        }`}
                        onClick={() => handleInternalMenuClick(authUser ? 'my-orders' : 'login')}
                      >
                        <span>{authUser ? '내 주문내역' : '로그인'}</span>
                        <span aria-hidden="true">›</span>
                      </button>
                    </li>
                  ) : null}
                  {isShopSite && authUser ? (
                    <li>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left text-sm font-bold text-slate-500 transition hover:bg-slate-50"
                        onClick={() => {
                          onSignOut?.()
                          setIsMenuOpen(false)
                        }}
                      >
                        <span>로그아웃</span>
                        <span aria-hidden="true">×</span>
                      </button>
                    </li>
                  ) : null}
                  <li>
                    <a
                      href={siteSwitchHref}
                      className="flex w-full items-center justify-between rounded-xl border border-[#d53232] bg-[#d53232] px-3.5 py-3 text-left text-sm font-black text-white transition hover:bg-[#bd2929]"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="inline-flex items-center gap-2">
                        <i className="fa-solid fa-globe text-xs" aria-hidden="true"></i>
                        <span>{siteSwitchLabel}</span>
                      </span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  </li>
                </ul>
              </div>

            </aside>
          </div>,
          document.body
        )
      : null

  return (
    <header className={`fixed inset-x-0 top-0 z-[500] border-b ${isShopSite ? 'border-slate-200/80 bg-white/90 backdrop-blur-xl' : 'border-[#ebe7e9] bg-[#fdfbfc]'}`}>
      <div className="relative flex h-[92px] w-full items-center justify-between pl-7 pr-6 max-[1280px]:h-[62px] max-[980px]:pl-4 max-[980px]:pr-4 max-[640px]:pl-2.5 max-[640px]:pr-2.5">
        <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 max-[640px]:block">
          <p className="m-0 text-[18px] font-black tracking-[-0.02em] text-black">MWPOWER</p>
        </div>

        <div className="flex min-w-0 items-center gap-7 max-[1280px]:gap-3">
          <a
            href="#"
            className="flex h-[74px] w-[74px] shrink-0 items-center justify-center bg-transparent max-[1280px]:h-[52px] max-[1280px]:w-[52px] max-[640px]:h-[42px] max-[640px]:w-[42px]"
            aria-label="MEAN WELL"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('home')
            }}
          >
            <img src={LOGO_SRC} alt={LOGO_ALT} className="h-full w-full object-contain" />
          </a>

          <nav className="main-nav ml-0 flex flex-wrap items-center max-[980px]:hidden">
            {visibleNavItems.map((item) => (
              <NavLink
                key={`${item.label}-${item.view}`}
                item={item}
                isActive={item.key === activeView}
                onNavigate={onNavigate}
                badgeCount={item.key === 'order-list' ? orderItemCount : item.key === 'quote-request' ? quoteItemCount : 0}
                compact={false}
              />
            ))}
            {isShopSite ? (
              <NavLink
                item={{ key: authUser ? 'my-orders' : 'login', label: authUser ? '내 주문' : '로그인', view: authUser ? 'my-orders' : 'login' }}
                isActive={(authUser ? 'my-orders' : 'login') === activeView}
                onNavigate={onNavigate}
                compact={false}
              />
            ) : null}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 text-[#1a2433] max-[640px]:gap-1">
          <a
            href={siteSwitchHref}
            className="mr-2 inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-[#d53232] px-4 text-xs font-black text-white transition hover:bg-[#bd2929] max-[980px]:hidden"
            aria-label={`${siteSwitchLabel}로 이동`}
          >
            <i className="fa-solid fa-globe text-[12px]" aria-hidden="true"></i>
            <span>{siteSwitchLabel}</span>
          </a>
          {isShopSite && authUser ? (
            <button
              type="button"
              className="hidden rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:border-[#d63b42] hover:text-[#c62f36] min-[981px]:inline-flex"
              onClick={() => onSignOut?.()}
            >
              로그아웃
            </button>
          ) : null}
          {isShopSite ? (
            <button
              type="button"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white p-0 text-slate-700 transition hover:border-[#d63b42] hover:text-[#c62f36] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#0057b8]/70 max-[640px]:h-9 max-[640px]:w-9"
              aria-label="주문목록"
              onClick={() => {
                onNavigate('order-list')
                setIsMenuOpen(false)
              }}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 max-[640px]:h-[18px] max-[640px]:w-[18px]" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 7h14l-1.5 8.5H8.2L7 7Z"></path>
                <path d="M7 7 6.5 4H3"></path>
                <circle cx="9" cy="19" r="1.4"></circle>
                <circle cx="18" cy="19" r="1.4"></circle>
              </svg>
              {orderItemCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#ffe26c] px-1 text-[10px] font-black leading-[18px] text-slate-900">
                  {orderItemCount > 99 ? '99+' : orderItemCount}
                </span>
              ) : null}
            </button>
          ) : null}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center border-0 bg-transparent p-0 text-current hover:text-[#0057b8] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#0057b8]/70 max-[640px]:h-9 max-[640px]:w-9"
            aria-label="검색"
            onClick={() => {
              setIsSearchOpen(true)
              setIsMenuOpen(false)
            }}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 max-[640px]:h-5 max-[640px]:w-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7"></circle>
              <line x1="16.5" y1="16.5" x2="21" y2="21"></line>
            </svg>
          </button>
          <button
            type="button"
            className={`relative hidden h-10 w-10 items-center justify-center border-0 p-0 transition hover:text-[#0057b8] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#0057b8]/70 max-[980px]:inline-flex max-[640px]:h-9 max-[640px]:w-9 ${
              isMenuOpen ? 'rounded-full bg-white text-slate-900 shadow-[0_10px_30px_rgba(15,23,42,0.25)]' : 'bg-transparent text-current'
            }`}
            aria-label={isMenuOpen ? '메뉴 닫기' : '메뉴'}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-header-menu"
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            {isMenuOpen ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
                <path d="M6 6 18 18"></path>
                <path d="M18 6 6 18"></path>
              </svg>
            ) : (
              <>
                <span className="absolute h-[2px] w-[18px] -translate-y-[6px] rounded-full bg-current transition" aria-hidden="true"></span>
                <span className="absolute h-[2px] w-[18px] rounded-full bg-current transition" aria-hidden="true"></span>
                <span className="absolute h-[2px] w-[18px] translate-y-[6px] rounded-full bg-current transition" aria-hidden="true"></span>
              </>
            )}
          </button>
        </div>

      </div>

      {isSearchOpen ? (
        <Suspense fallback={null}>
          <ProductSearchModal
            isOpen
            onClose={() => setIsSearchOpen(false)}
            onSelectKeyword={(keyword) => {
              onProductSearch?.(keyword)
            }}
            onSelectProductRoute={(route) => {
              onProductRouteSelect?.(route)
            }}
          />
        </Suspense>
      ) : null}
      {mobileMenuPortal}
    </header>
  )
}
