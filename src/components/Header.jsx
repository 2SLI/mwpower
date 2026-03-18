import { useEffect, useState } from 'react'
import { ProductSearchModal } from './ProductSearchModal'

const navItems = [
  { key: 'home', label: 'Profile', view: 'home' },
  { key: 'products', label: 'Products', view: 'products' },
  { key: 'news', label: 'News', view: 'news' },
  { key: 'service', label: 'Service', view: 'service' },
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
      className={`main-nav-link relative px-2.5 text-[clamp(14px,0.95vw,31px)] leading-[92px] text-white after:absolute after:-right-0.5 after:top-0 after:content-['|'] after:opacity-40 last:after:hidden max-[1280px]:text-sm max-[1280px]:leading-[62px] ${
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
    <header className="absolute inset-x-0 top-0 z-20 border-b border-white/25 bg-[rgba(60,60,60,0.7)]">
      <div className="mx-auto flex h-[92px] max-w-[1540px] items-center gap-3 px-4 pr-[170px] max-[1280px]:h-[62px] max-[980px]:pr-[136px] max-[980px]:justify-center">
        <a
          href="#"
          className="flex h-[52px] w-[106px] shrink-0 flex-col items-center justify-center bg-[#e72e25] text-white max-[1280px]:h-11 max-[1280px]:w-[90px]"
          aria-label="MEAN WELL"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('home')
          }}
        >
          <span className="text-[35px] font-black leading-[0.76] tracking-[0.6px] max-[1280px]:text-[29px]">MW</span>
          <span className="mt-0.5 whitespace-nowrap text-[9px] font-bold leading-none tracking-[0.1px] max-[1280px]:mt-px max-[1280px]:text-[7.6px]">
            meanwellpower
          </span>
        </a>

        <nav className="main-nav ml-3 flex flex-wrap items-center max-[980px]:hidden">
          {navItems.map((item) => (
            <NavLink key={`${item.label}-${item.view}`} item={item} isActive={item.key === activeView} onNavigate={onNavigate} />
          ))}
        </nav>

        <div className="absolute right-6 top-1/2 flex -translate-y-1/2 items-center gap-1.5 text-white max-[980px]:right-4">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center border-0 bg-transparent p-0 text-current hover:text-white/85 focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/70"
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
            className="inline-flex h-10 w-10 items-center justify-center border-0 bg-transparent p-0 text-current hover:text-white/85 focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/70"
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
            className="relative inline-flex h-10 w-10 items-center justify-center border-0 bg-transparent p-0 text-current hover:text-white/85 focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/70"
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
              <h2 className="m-0 mt-1 text-[22px] font-black leading-tight tracking-[-0.02em]">meanwellpower</h2>
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
