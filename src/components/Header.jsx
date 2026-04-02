import { useEffect, useState } from 'react'
import { ProductSearchModal } from './ProductSearchModal'

const navItems = [
  { key: 'products', label: '제품', view: 'products' },
  { key: 'news', label: '뉴스', view: 'news' },
  { key: 'service', label: '서비스', view: 'service' },
  { key: 'contact-product', label: '제품문의', view: 'contact-product' },
  { key: 'contact-tech', label: '기술문의', view: 'contact-tech' },
]

function NavLink({ item, isActive, onNavigate }) {
  const isExternal = Boolean(item.href)

  return (
    <a
      href={item.href ?? '#'}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className={`main-nav-link relative px-5 text-[clamp(14px,0.95vw,19px)] font-semibold leading-[92px] tracking-[-0.01em] text-[#0e2238] max-[1280px]:px-3 max-[1280px]:text-sm max-[1280px]:leading-[62px] ${
        isActive ? 'active' : ''
      }`}
      onClick={(event) => {
        if (isExternal) return
        event.preventDefault()
        onNavigate(item.view)
      }}
    >
      {item.label}
    </a>
  )
}

export function Header({ activeView, onNavigate, onProductSearch }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [isMenuOpen])

  const handleInternalMenuClick = (view) => {
    onNavigate(view)
    setIsMenuOpen(false)
  }

  return (
    <header className="absolute inset-x-0 top-0 z-20 border-b border-[#d6dbe2] bg-[#f2f3f5]">
      <div className="flex h-[92px] w-full items-center justify-between pl-7 pr-6 max-[1280px]:h-[62px] max-[980px]:pl-4 max-[980px]:pr-4">
        <div className="flex items-center gap-7 max-[1280px]:gap-3">
          <a
            href="#"
            className="flex h-[74px] w-auto shrink-0 items-center justify-center bg-transparent"
            aria-label="MEAN WELL"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('home')
            }}
          >
            <span className="whitespace-nowrap text-[44px] font-black leading-none tracking-[-0.03em] text-[#d9252a] max-[1280px]:text-[30px]">MEANWELL POWER</span>
          </a>

          <nav className="main-nav ml-0 flex flex-wrap items-center max-[980px]:hidden">
            {navItems.map((item) => (
              <NavLink key={`${item.label}-${item.view}`} item={item} isActive={item.key === activeView} onNavigate={onNavigate} />
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 text-[#1a2433]">
          <a
            href="https://smartstore.naver.com/meanwellpower"
            target="_blank"
            rel="noopener noreferrer"
            className="mr-2 inline-flex h-10 items-center gap-1.5 rounded-full bg-[#d9252a] px-5 text-sm font-bold text-white max-[1280px]:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9"></circle>
              <path d="M3.5 12h17"></path>
              <path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9s1.3-6.4 3.8-9Z"></path>
            </svg>
            <span>민웰파워 스토어</span>
          </a>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center border-0 bg-transparent p-0 text-current hover:text-[#0057b8] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#0057b8]/70"
            aria-label="검색"
            onClick={() => {
              setIsSearchOpen(true)
              setIsMenuOpen(false)
            }}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7"></circle>
              <line x1="16.5" y1="16.5" x2="21" y2="21"></line>
            </svg>
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center border-0 bg-transparent p-0 text-current hover:text-[#0057b8] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#0057b8]/70"
            aria-label="사용자"
            onClick={() => onNavigate('contact-product')}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="3.5"></circle>
              <path d="M5 20c0-3.3 3.1-5 7-5s7 1.7 7 5"></path>
            </svg>
          </button>
          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center border-0 bg-transparent p-0 text-current hover:text-[#0057b8] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#0057b8]/70"
            aria-label="메뉴"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-header-menu"
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            <span
              className={`absolute h-[2px] w-[18px] rounded-full bg-current transition ${isMenuOpen ? 'translate-y-0 rotate-45' : '-translate-y-[6px]'}`}
              aria-hidden="true"
            ></span>
            <span
              className={`absolute h-[2px] w-[18px] rounded-full bg-current transition ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}
              aria-hidden="true"
            ></span>
            <span
              className={`absolute h-[2px] w-[18px] rounded-full bg-current transition ${isMenuOpen ? 'translate-y-0 -rotate-45' : 'translate-y-[6px]'}`}
              aria-hidden="true"
            ></span>
          </button>
        </div>

      </div>

      <ProductSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectKeyword={(keyword) => {
          onProductSearch?.(keyword)
        }}
      />

      {isMenuOpen ? (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-[1px]"
            onClick={() => setIsMenuOpen(false)}
            aria-label="메뉴 닫기"
          ></button>

          <aside
            id="mobile-header-menu"
            className="absolute right-0 top-0 flex h-full w-[min(88vw,360px)] flex-col border-l border-slate-200 bg-white shadow-[0_18px_40px_rgba(2,8,23,0.35)]"
            aria-label="Header menu"
          >
            <header className="relative overflow-hidden bg-[linear-gradient(135deg,#e53a33_0%,#c6252e_55%,#8d161f_100%)] px-5 pb-5 pt-6 text-white">
              <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/12"></div>
              <p className="m-0 text-[10px] font-black tracking-[0.14em] text-rose-100">MENU</p>
              <h2 className="m-0 mt-1 text-[22px] font-black leading-tight tracking-[-0.02em]">MEANWELL POWER</h2>
              <p className="mb-0 mt-2 text-xs font-semibold text-rose-100">제품/서비스 메뉴를 빠르게 이동하세요.</p>
            </header>

            <div className="flex-1 overflow-y-auto px-3 py-3.5">
              <ul className="m-0 list-none space-y-1.5 p-0">
                {navItems.map((item) => {
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
                        <span>{item.label}</span>
                        <span aria-hidden="true">›</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>

            <footer className="border-t border-slate-200 bg-slate-50 p-3">
              <button
                type="button"
                className="w-full rounded-xl bg-[linear-gradient(135deg,#e63c35_0%,#c3272f_100%)] px-4 py-3 text-sm font-extrabold text-white shadow-[0_10px_22px_rgba(195,39,47,0.28)]"
                onClick={() => {
                  setIsMenuOpen(false)
                  setIsSearchOpen(true)
                }}
              >
                상품 바로 찾기
              </button>
            </footer>
          </aside>
        </div>
      ) : null}
    </header>
  )
}
