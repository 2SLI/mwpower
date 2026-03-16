import { useEffect, useRef, useState } from 'react'
import { ProductSearchModal } from './ProductSearchModal'

const BLOG_URL = 'https://blog.naver.com/meanwell_power'
const SHOP_URL = 'https://smartstore.naver.com/meanwellpower'

const navItems = [
  { key: 'home', label: 'Profile', view: 'home' },
  { key: 'products', label: 'Products', view: 'products' },
  { key: null, label: 'News', href: BLOG_URL },
  { key: 'service', label: 'Service', view: 'service' },
  { key: null, label: 'Shop', href: SHOP_URL },
  { key: 'contact', label: 'Contact Us', view: 'contact' },
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
  const utilityMenuRef = useRef(null)

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== 'Escape') return
      setIsSearchOpen(false)
      setIsMenuOpen(false)
    }

    const handleClickOutside = (event) => {
      if (!utilityMenuRef.current) return
      if (!utilityMenuRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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

        <div className="absolute right-6 top-1/2 flex -translate-y-1/2 items-center gap-1.5 text-white max-[980px]:right-4" ref={utilityMenuRef}>
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
            onClick={() => onNavigate('contact')}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="3.5"></circle>
              <path d="M5 20c0-3.3 3.1-5 7-5s7 1.7 7 5"></path>
            </svg>
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center border-0 bg-transparent p-0 text-current hover:text-white/85 focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/70"
            aria-label="메뉴"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-header-menu"
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
              <line x1="3.5" y1="6.5" x2="20.5" y2="6.5"></line>
              <line x1="3.5" y1="12" x2="20.5" y2="12"></line>
              <line x1="3.5" y1="17.5" x2="20.5" y2="17.5"></line>
            </svg>
          </button>

          {isMenuOpen ? (
            <nav
              id="mobile-header-menu"
              className="absolute right-0 top-[calc(100%+10px)] z-[60] w-[220px] overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-800 shadow-[0_14px_38px_rgba(15,23,42,0.28)]"
              aria-label="Header menu"
            >
              <ul className="m-0 list-none p-1.5">
                {navItems.map((item) =>
                  item.href ? (
                    <li key={`menu-${item.label}`}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.label}
                      </a>
                    </li>
                  ) : (
                    <li key={`menu-${item.view ?? item.label}`}>
                      <button
                        type="button"
                        className={`block w-full rounded-md px-3 py-2 text-left text-sm font-semibold hover:bg-slate-100 ${
                          item.key === activeView ? 'text-[#c83a3a]' : 'text-slate-700'
                        }`}
                        onClick={() => handleInternalMenuClick(item.view)}
                      >
                        {item.label}
                      </button>
                    </li>
                  )
                )}
              </ul>
            </nav>
          ) : null}
        </div>

      </div>

      <ProductSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectKeyword={(keyword) => {
          onProductSearch?.(keyword)
        }}
      />
    </header>
  )
}
