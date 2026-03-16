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

export function Header({ activeView, onNavigate }) {
  return (
    <header className="absolute inset-x-0 top-0 z-20 border-b border-white/25 bg-[rgba(60,60,60,0.7)]">
      <div className="mx-auto flex h-[92px] max-w-[1540px] items-center gap-3 px-4 max-[1280px]:h-[62px] max-[980px]:justify-center">
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

        <div className="absolute right-3 top-1.5 hidden items-center gap-3 rounded-md bg-white/92 px-2.5 py-1.5 text-slate-800 shadow-sm max-[980px]:flex">
          <button type="button" className="grid h-7 w-7 place-items-center" aria-label="검색">
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2"></circle>
              <line x1="16.65" y1="16.65" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></line>
            </svg>
          </button>
          <button type="button" className="grid h-7 w-7 place-items-center" aria-label="사용자">
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="2"></circle>
              <path d="M5 20c0-3.3 3.1-5 7-5s7 1.7 7 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path>
            </svg>
          </button>
          <button type="button" className="grid h-7 w-7 place-items-center" aria-label="메뉴">
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></line>
              <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></line>
              <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></line>
            </svg>
          </button>
        </div>

      </div>
    </header>
  )
}
