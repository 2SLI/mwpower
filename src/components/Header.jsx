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

      </div>
    </header>
  )
}
