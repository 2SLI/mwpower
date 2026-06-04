import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { HomeProductCategorySection } from '../components/HomeProductCategorySection'
import { NEWS_FALLBACK_IMAGE, formatNewsDate, getAllNewsSorted } from '../data/newsContent'
import { loadLeafModelTreeMap, loadMajorCategories, normalizeLabel } from '../features/productCatalogService'
import { buildMajorIdByName, buildModelRouteIndex, toProductRouteShortcut } from '../features/productRouteIndex'
import { loadNewsArticlesForPublic, normalizeNewsItems } from '../features/newsService'
import { defaultMajorCategories } from '../data/defaultMajorCategories'

const solutionCards = [
  { title: 'DC/DC Converter 전원 솔루션', image: '/meanwell/dcdcconverter_banner.jpeg', alt: 'DC/DC', productPreset: { majorId: 'dc-dc' } },
  { title: '친환경 전원 솔루션', image: '/meanwell/green-power-solution-banner.png', alt: 'Green Power', productSearch: 'LED' },
  { title: '의료 전원 솔루션', image: '/meanwell/index-solutions-pic6.jpg', alt: 'MEDICAL', productSearch: 'MEDICAL' },
  {
    title: 'LED Display 솔루션',
    image: '/meanwell/led-display-solution-banner.jpg',
    alt: 'Display',
    productSearch: 'UHP-200(R), UHP-350(R), UHP-500(R), UHP-200A, NEL-400, HSP-200, HSP-300, RSP-200, RSP-320, LRS-200, LRS-350',
  },
  {
    title: '시스템 전원 솔루션',
    image: '/meanwell/index-solutions-pic3.jpg',
    alt: 'System Power',
    productSearch: 'NMP Series, UMP Series, RCP Series, NCP Series, CMU2 Series, DRP Series',
  },
  {
    title: '건물 관리 솔루션',
    image: '/meanwell/index-solutions-pic5.jpg',
    alt: 'Building Management',
    productSearch: 'KNX, HDR, LCM, PWM, XLC, KAA, DLC, KSI, KSR, KSC',
  },
]

const productCards = [
  { name: 'DC/DC Converter Power Solutions', type: 'DDR Series', desc: '고효율 DC/DC 전원 구성으로 제어반과 산업 장비의 안정적인 전압 변환을 지원합니다.' },
  { name: 'Green Power Solution', type: 'ELG Series', desc: '친환경 전원 환경에 최적화된 정전류/정전압 전원으로 장기 운용 안정성을 확보합니다.' },
  { name: 'Medical Power Solution', type: 'RSP Series', desc: '의료 및 정밀 장비 적용을 위한 고신뢰 전원 라인업으로 시스템 가동 리스크를 줄입니다.' },
  { name: 'LED Display Solution', type: 'LRS Series', desc: '디스플레이 구동 환경에 맞춘 표준형 전원 구성을 통해 설치와 유지보수를 단순화합니다.' },
]

const serviceCards = [
  {
    icon: 'fa-solid fa-screwdriver-wrench',
    title: 'Technical Service',
    desc: '사양 검토, 대체품 제안, 적용 이슈를 기술팀이 직접 대응합니다.',
  },
  {
    icon: 'fa-solid fa-file-lines',
    title: 'Quality Documents',
    desc: '인증서와 품질 관련 문서를 요청 용도에 맞게 빠르게 제공합니다.',
  },
  {
    icon: 'fa-solid fa-box-open',
    title: 'Supply Support',
    desc: '프로젝트 납기 일정에 맞춘 공급 계획 수립을 지원합니다.',
  },
  {
    icon: 'fa-solid fa-headset',
    title: 'After Service',
    desc: '불량 분석, 보증 정책, 사후 대응 절차를 체계적으로 안내합니다.',
  },
]

function normalizeIndex(index, length) {
  return (index + length) % length
}

function handleNewsImageError(event) {
  const image = event.currentTarget
  if (!image || image.dataset.fallbackApplied === 'true') return
  image.dataset.fallbackApplied = 'true'
  image.src = NEWS_FALLBACK_IMAGE
}

function getSingleSearchToken(value = '') {
  const tokens = String(value ?? '')
    .split(/[,\uFF0C]/)
    .map((token) => String(token ?? '').trim())
    .filter(Boolean)

  return tokens.length === 1 ? tokens[0] : ''
}

const EMPTY_TREE = { byKey: {}, byLeaf: {} }
const NEWS_POPUP_SUPPRESS_KEY = 'mwpower_news_popup_suppress_until'

function getNewsArticleUrl(article = {}) {
  return String(article?.articleUrl || article?.externalUrl || '').trim()
}

function isBlogArticle(article = {}) {
  const articleUrl = getNewsArticleUrl(article)
  try {
    const hostname = new URL(articleUrl).hostname.toLowerCase()
    return hostname === 'blog.naver.com' || hostname === 'www.blog.naver.com'
  } catch {
    return /blog\.naver\.com/i.test(String(article?.sourceLabel ?? ''))
  }
}

export function HomeView({ isActive, isShopSite = false, bannerImages, onNavigate, onOpenProductPreset, onOpenProductSearch, onOpenNewsArticle, orderItemCount = 0 }) {
  const totalSlides = bannerImages.length
  const [currentSlide, setCurrentSlide] = useState(0)
  const [mobileSolutionIndex, setMobileSolutionIndex] = useState(0)
  const [mobileSearchKeyword, setMobileSearchKeyword] = useState('')
  const [newsItems, setNewsItems] = useState(() => normalizeNewsItems(getAllNewsSorted()))
  const [newsPreviewError, setNewsPreviewError] = useState('')
  const [majorCategories, setMajorCategories] = useState(defaultMajorCategories)
  const [leafTreeMap, setLeafTreeMap] = useState(EMPTY_TREE)
  const [isNewsPopupOpen, setIsNewsPopupOpen] = useState(false)
  const [isNewsPopupDismissed, setIsNewsPopupDismissed] = useState(false)
  const mobileSolutionTrackRef = useRef(null)

  useEffect(() => {
    if (totalSlides < 2) return undefined
    const timer = setInterval(() => {
      setCurrentSlide((prev) => normalizeIndex(prev + 1, totalSlides))
    }, 4500)
    return () => clearInterval(timer)
  }, [totalSlides])

  useEffect(() => {
    setCurrentSlide((prev) => normalizeIndex(prev, totalSlides || 1))
  }, [totalSlides])

  const bannerTitleLines = useMemo(
    () =>
      bannerImages.map((banner) =>
        String(banner.title ?? '')
          .split('\n')
          .filter(Boolean)
      ),
    [bannerImages]
  )

  useEffect(() => {
    let alive = true

    ;(async () => {
      const result = await loadNewsArticlesForPublic()
      if (!alive) return
      if (Array.isArray(result?.articles) && result.articles.length > 0) {
        setNewsItems(result.articles)
        setNewsPreviewError('')
      }
    })().catch(() => {
      if (!alive) return
      setNewsItems(normalizeNewsItems(getAllNewsSorted()))
      setNewsPreviewError('뉴스 데이터를 불러오지 못해 기본 목록을 표시합니다.')
    })

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    let alive = true

    ;(async () => {
      const [majorResult, treeResult] = await Promise.all([loadMajorCategories(), loadLeafModelTreeMap()])
      if (!alive) return
      setMajorCategories(majorResult.categories.length > 0 ? majorResult.categories : defaultMajorCategories)
      setLeafTreeMap(treeResult.treeMap)
    })().catch(() => {
      if (!alive) return
      setMajorCategories(defaultMajorCategories)
      setLeafTreeMap(EMPTY_TREE)
    })

    return () => {
      alive = false
    }
  }, [])

  const visibleNews = newsItems.slice(0, 8)
  const popupNews = visibleNews.find((item) => !isBlogArticle(item)) ?? visibleNews[0] ?? null
  const majorIdByName = useMemo(() => buildMajorIdByName(majorCategories), [majorCategories])
  const modelRouteIndex = useMemo(() => buildModelRouteIndex(leafTreeMap, majorIdByName), [leafTreeMap, majorIdByName])
  const mobileSearchShortcutList = useMemo(() => {
    const tokenKey = normalizeLabel(getSingleSearchToken(mobileSearchKeyword))
    if (!tokenKey) return []

    return Object.entries(modelRouteIndex)
      .filter(([modelKey]) => modelKey.includes(tokenKey) || tokenKey.startsWith(`${modelKey}-`))
      .map(([modelKey, route]) => toProductRouteShortcut(modelKey, route))
      .sort((a, b) => {
        const aExact = a.modelKey === tokenKey ? 0 : 1
        const bExact = b.modelKey === tokenKey ? 0 : 1
        if (aExact !== bExact) return aExact - bExact

        const aStarts = a.modelKey.startsWith(tokenKey) ? 0 : 1
        const bStarts = b.modelKey.startsWith(tokenKey) ? 0 : 1
        if (aStarts !== bStarts) return aStarts - bStarts

        const lengthDiff = a.modelKey.length - b.modelKey.length
        if (lengthDiff !== 0) return lengthDiff

        return a.displayModel.localeCompare(b.displayModel, undefined, { numeric: true, sensitivity: 'base' })
      })
      .slice(0, 8)
  }, [mobileSearchKeyword, modelRouteIndex])
  const mobileSolutionCards = useMemo(
    () =>
      solutionCards.map((item, index) => {
        if (index !== 0) return { ...item, mobileTitle: item.title, mobileSubtitle: '' }
        return {
          ...item,
          mobileTitle: '제품 사양서 보기',
          mobileSubtitle: 'MWPOWER는 MEAN WELL 정품 제품만을 판매합니다.',
          forceProductsView: true,
        }
      }),
    []
  )

  function navigateSolutionCard(item) {
    if (item.forceProductsView) {
      onNavigate('products')
      return
    }
    if (item.productPreset) {
      onOpenProductPreset?.(item.productPreset)
      return
    }
    if (item.productSearch) {
      onOpenProductSearch?.(item.productSearch)
      return
    }
    onNavigate('products')
  }

  function handleMobileSearchSubmit(event) {
    event.preventDefault()
    const keyword = String(mobileSearchKeyword ?? '').trim()
    if (!keyword) return

    const keywordKey = normalizeLabel(keyword)
    const matchedShortcut =
      mobileSearchShortcutList.find((item) => item.modelKey === keywordKey) ||
      mobileSearchShortcutList.find((item) => item.modelKey.startsWith(keywordKey)) ||
      mobileSearchShortcutList[0]

    if (matchedShortcut) {
      onOpenProductPreset?.({
        majorId: matchedShortcut.majorId,
        subcategory: matchedShortcut.subcategory,
        leaf: matchedShortcut.leaf,
        groupName: matchedShortcut.groupName,
        model: matchedShortcut.model,
        optionModel: matchedShortcut.optionModel,
      })
      return
    }

    onOpenProductSearch?.(keyword)
  }

  function scrollMobileSolutionsTo(nextIndex) {
    const track = mobileSolutionTrackRef.current
    if (!track) return
    const width = track.clientWidth || 1
    const maxIndex = mobileSolutionCards.length - 1
    const safeIndex = Math.max(0, Math.min(nextIndex, maxIndex))
    track.scrollTo({ left: width * safeIndex, behavior: 'smooth' })
    setMobileSolutionIndex(safeIndex)
  }

  useEffect(() => {
    const track = mobileSolutionTrackRef.current
    if (!track) return undefined

    const handleScroll = () => {
      const width = track.clientWidth || 1
      const nextIndex = Math.round(track.scrollLeft / width)
      setMobileSolutionIndex((prev) => (prev === nextIndex ? prev : nextIndex))
    }

    track.addEventListener('scroll', handleScroll, { passive: true })
    return () => track.removeEventListener('scroll', handleScroll)
  }, [mobileSolutionCards.length])

  useEffect(() => {
    if (!isActive) return
    const track = mobileSolutionTrackRef.current
    if (!track) return
    track.scrollTo({ left: 0, behavior: 'auto' })
    setMobileSolutionIndex(0)
  }, [isActive])

  useEffect(() => {
    if (!isActive || isShopSite || !popupNews || isNewsPopupDismissed) {
      setIsNewsPopupOpen(false)
      return
    }

    try {
      const suppressUntil = Number(window.localStorage.getItem(NEWS_POPUP_SUPPRESS_KEY))
      if (Number.isFinite(suppressUntil) && suppressUntil > Date.now()) {
        setIsNewsPopupOpen(false)
        return
      }
    } catch {
      // localStorage may be unavailable in restricted browser modes.
    }

    setIsNewsPopupOpen(true)
  }, [isActive, isShopSite, popupNews?.id, isNewsPopupDismissed])

  function closeNewsPopup() {
    setIsNewsPopupOpen(false)
    setIsNewsPopupDismissed(true)
  }

  function suppressNewsPopupFor(ms) {
    try {
      window.localStorage.setItem(NEWS_POPUP_SUPPRESS_KEY, String(Date.now() + ms))
    } catch {
      // Ignore storage failures and close for the current session.
    }
    closeNewsPopup()
  }

  function openNews(article) {
    const articleId = String(article?.id ?? '').trim()
    if (!articleId) {
      onNavigate('news')
      return
    }

    if (isBlogArticle(article)) {
      const articleUrl = getNewsArticleUrl(article)
      if (articleUrl && typeof window !== 'undefined') {
        window.open(articleUrl, '_blank', 'noopener,noreferrer')
        return
      }
    }

    onOpenNewsArticle?.(articleId)
  }

  if (isShopSite) {
    const popularSearches = ['LRS-350', 'XDR-240', 'NDR-240', 'MDR-60', 'HDR-60', 'RS-25']
    const storeCategoryCards = [
      { label: 'AC/DC', image: '/catalog/meanwell/thumbnails/lrs.png', preset: { majorId: 'ac-dc' } },
      { label: 'DIN Rail', image: '/catalog/meanwell/thumbnails/xdr.png', preset: { majorId: 'ac-dc', subcategory: 'DIN Rail' } },
      { label: 'DC/DC', image: '/meanwell/dcdcconverter_banner.jpeg', preset: { majorId: 'dc-dc' } },
      { label: 'LED Driver', image: '/meanwell/green-power-solution-banner.png', search: 'LED' },
      { label: 'Medical', image: '/meanwell/index-solutions-pic6.jpg', search: 'MEDICAL' },
      { label: 'Accessory', image: '/catalog/meanwell/thumbnails/drp.jpg', preset: { majorId: 'peripheral' } },
    ]
    const storeHighlights = [
      {
        eyebrow: '빠른 출고',
        title: '재고 있는 모델부터 바로 확인.',
        text: '모델 상세에서 가격과 재고를 확인하고 장바구니에 담아 주문할 수 있습니다.',
        action: '재고 상품 보기',
        onClick: () => onNavigate('products'),
        tone: 'bg-white text-slate-950',
      },
      {
        eyebrow: '추천 시리즈',
        title: 'DIN Rail 전원은 XDR부터.',
        text: '제어반, 자동화 장비에 자주 쓰이는 경제형 DIN Rail 라인업입니다.',
        action: 'XDR 보기',
        onClick: () => onOpenProductPreset?.({ majorId: 'ac-dc', subcategory: 'DIN Rail', leaf: 'XDR-E Series' }),
        tone: 'bg-slate-950 text-white',
      },
      {
        eyebrow: '주문 관리',
        title: '회원 주문내역을 한 곳에서.',
        text: '로그인 후 주문한 내역과 진행 상태를 계정에서 바로 확인할 수 있습니다.',
        action: '내 주문 보기',
        onClick: () => onNavigate('my-orders'),
        tone: 'bg-[#f5f5f7] text-slate-950',
      },
    ]

    return (
      <div id="shop-home-sections" className={`${isActive ? '' : 'is-hidden'} bg-[#f5f5f7] text-slate-950`}>
        <h1 className="sr-only">MWPOWER SHOP MEAN WELL 전원공급장치 온라인 쇼핑몰</h1>

        <section className="px-5 pb-8 pt-8 md:px-8 md:pb-12 md:pt-10" aria-label="스토어 메인">
          <div className="mx-auto w-full max-w-[1320px]">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-end">
              <div>
                <p className="m-0 text-[12px] font-black uppercase tracking-[0.16em] text-[#d53232]">MWPOWER Store</p>
                <h2 className="m-0 mt-3 max-w-[820px] text-[clamp(2.25rem,4.4vw,4.7rem)] font-black leading-[1.06] tracking-[-0.025em] text-slate-950">
                  <span className="text-[#d53232]">MWPOWER</span>는 정품 민웰 SMPS를 판매합니다.
                </h2>
                <p className="m-0 mt-4 max-w-[620px] text-[16px] font-semibold leading-7 text-slate-500">
                  모델명으로 검색하고, 재고와 가격을 확인한 뒤 바로 주문하세요.
                </p>
              </div>

              <div className="rounded-[18px] bg-white p-5 shadow-[0_18px_45px_-40px_rgba(15,23,42,0.55)]">
                <p className="m-0 text-[13px] font-black text-slate-950">구매 도움이 필요하신가요?</p>
                <p className="m-0 mt-1 text-sm font-semibold leading-6 text-slate-500">모델명을 검색하거나 인기 카테고리에서 바로 시작하세요.</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" className="h-10 rounded-full bg-slate-950 px-3 text-xs font-black text-white" onClick={() => onNavigate('products')}>
                    전체 상품
                  </button>
                  <button type="button" className="h-10 rounded-full bg-slate-100 px-3 text-xs font-black text-slate-800" onClick={() => onNavigate('order-list')}>
                    장바구니 {orderItemCount > 99 ? '99+' : orderItemCount}
                  </button>
                </div>
              </div>
            </div>

            <form
              className="mt-8 flex min-h-[58px] max-w-[760px] items-center gap-3 rounded-full bg-white px-5 shadow-[0_18px_45px_-40px_rgba(15,23,42,0.6)]"
              role="search"
              aria-label="상품 검색"
              onSubmit={handleMobileSearchSubmit}
            >
              <i className="fa-solid fa-magnifying-glass text-lg text-slate-400" aria-hidden="true"></i>
              <input
                type="search"
                value={mobileSearchKeyword}
                onChange={(event) => setMobileSearchKeyword(event.target.value)}
                placeholder="어떤 전원공급장치를 찾고 계신가요?"
                className="min-w-0 flex-1 bg-transparent text-[16px] font-bold text-slate-900 placeholder:font-semibold placeholder:text-slate-400"
              />
              <button type="submit" className="h-10 rounded-full bg-[#d53232] px-5 text-sm font-black text-white transition hover:bg-[#bd2929]">
                검색
              </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {(mobileSearchKeyword.trim() && mobileSearchShortcutList.length > 0 ? mobileSearchShortcutList : popularSearches).map((item) => {
                const label = typeof item === 'string' ? item : item.displayModel
                return (
                <button
                  key={typeof item === 'string' ? item : item.modelKey}
                  type="button"
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm transition hover:text-[#d53232]"
                  onClick={() => {
                    if (typeof item === 'string') {
                      onOpenProductSearch?.(item)
                      return
                    }
                    onOpenProductPreset?.({
                      majorId: item.majorId,
                      subcategory: item.subcategory,
                      leaf: item.leaf,
                      groupName: item.groupName,
                      model: item.model,
                      optionModel: item.optionModel,
                    })
                  }}
                >
                  {label}
                </button>
                )
              })}
            </div>
          </div>
        </section>

        <section className="px-5 pb-8 md:px-8" aria-label="스토어 카테고리">
          <div className="mx-auto w-full max-w-[1480px]">
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {storeCategoryCards.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="grid w-[168px] shrink-0 justify-items-center gap-3 rounded-[22px] bg-white px-4 py-5 text-center shadow-[0_18px_45px_-40px_rgba(15,23,42,0.65)] transition hover:-translate-y-0.5"
                  onClick={() => (item.preset ? onOpenProductPreset?.(item.preset) : onOpenProductSearch?.(item.search))}
                >
                  <span className="grid h-24 w-24 place-items-center">
                    <img src={item.image} alt="" className="max-h-20 max-w-24 object-contain" loading="lazy" />
                  </span>
                  <span className="text-sm font-black text-slate-900">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <HomeProductCategorySection onNavigate={onNavigate} onOpenProductPreset={onOpenProductPreset} variant="store" />

        <section className="px-5 pb-16 pt-1 md:px-8 md:pb-20" aria-label="스토어 추천">
          <div className="mx-auto w-full max-w-[1480px]">
            <header className="mb-5 flex items-end justify-between gap-4">
              <h2 className="m-0 text-[clamp(1.8rem,3vw,3.2rem)] font-black tracking-[-0.03em] text-slate-950">
                최신 구매 경험.
                <span className="text-[#d53232]"> 더 빠르고 선명하게.</span>
              </h2>
            </header>

            <div className="grid gap-4 lg:grid-cols-3">
              {storeHighlights.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  className={`min-h-[300px] rounded-[28px] p-7 text-left shadow-[0_22px_56px_-44px_rgba(15,23,42,0.7)] transition hover:-translate-y-0.5 ${item.tone}`}
                  onClick={item.onClick}
                >
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-[#d53232]">{item.eyebrow}</span>
                  <strong className="mt-4 block max-w-[12ch] text-[clamp(1.75rem,2.4vw,2.9rem)] font-black leading-[1.05] tracking-[-0.03em]">{item.title}</strong>
                  <span className="mt-4 block max-w-[28ch] text-sm font-semibold leading-6 opacity-70">{item.text}</span>
                  <span className="mt-7 inline-flex h-10 items-center rounded-full bg-[#d53232] px-4 text-xs font-black text-white">{item.action}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div id="home-sections" className={isActive ? '' : 'is-hidden'}>
      <h1 className="sr-only">MWPOWER MEAN WELL 전원공급장치 정품 공급업체</h1>
      {isNewsPopupOpen && popupNews ? (
        <div className="fixed inset-0 z-[900] flex items-center justify-center bg-slate-950/15 px-4 py-6 max-[640px]:items-end max-[640px]:px-3 max-[640px]:py-3" role="dialog" aria-modal="true" aria-label="뉴스 공지">
          <article className="w-full max-w-[760px] overflow-hidden rounded-[22px] bg-[#2f2f2f] p-4 shadow-[0_18px_50px_rgba(15,23,42,0.34)] max-[640px]:rounded-[18px] max-[640px]:p-3">
            <div className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f7f7f7_70%,#e8e8e8_100%)] px-8 pb-8 pt-7 max-[640px]:px-5 max-[640px]:pb-6 max-[640px]:pt-5">
              <span className="absolute left-0 top-0 h-20 w-20 bg-[#2f2f2f] [clip-path:polygon(0_0,100%_0,0_100%)]" aria-hidden="true"></span>
              <span className="absolute bottom-0 right-0 h-20 w-20 bg-[#2f2f2f] [clip-path:polygon(100%_0,100%_100%,0_100%)]" aria-hidden="true"></span>

              <div className="relative">
                <h2 className="m-0 text-center text-[clamp(1.45rem,2.6vw,2.4rem)] font-black leading-tight tracking-[-0.03em] text-slate-950">
                  <span className="text-[#d53232]">※</span> MWPOWER 민웰 공식 뉴스 안내
                </h2>

                <div className="mx-auto mt-8 max-w-[610px] border border-slate-700 bg-white px-5 py-4 text-center max-[640px]:mt-5 max-[640px]:px-3">
                  <p className="m-0 text-[13px] font-bold leading-6 text-slate-700 max-[640px]:text-[12px]">
                    MWPOWER는 MEAN WELL 정품 전원공급장치 정보를 안내합니다.
                    <br />
                    신제품, 기술자료, 단종모델 관련 공지는 뉴스 메뉴에서 확인하실 수 있습니다.
                  </p>
                </div>

                <div className="mx-auto mt-8 max-w-[610px] text-[18px] font-bold leading-[1.7] tracking-[-0.02em] text-black max-[640px]:mt-5 max-[640px]:text-[15px]">
                  <p className="m-0">
                    최근 등록된 민웰 뉴스:
                    <br />
                    <span className="font-black underline decoration-[#d53232] decoration-[6px] underline-offset-[-2px]">{popupNews.title}</span>
                  </p>
                  {popupNews.summary ? (
                    <p className="m-0 mt-6 text-[#d53232]">
                      {popupNews.summary}
                    </p>
                  ) : null}
                  <p className="m-0 mt-6">
                    자세한 내용은 상단 뉴스 메뉴에서 확인해 주시기 바랍니다.
                    <br />
                    게시일: {formatNewsDate(popupNews.date)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[#eeeeee] px-4 py-3 max-[640px]:grid max-[640px]:grid-cols-2">
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full px-3 text-sm font-bold text-slate-700 transition hover:bg-white max-[640px]:px-2 max-[640px]:text-xs"
                onClick={() => suppressNewsPopupFor(24 * 60 * 60 * 1000)}
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#bdbdbd] text-white">✓</span>
                오늘 하루 보지 않기
              </button>
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full px-3 text-sm font-bold text-slate-700 transition hover:bg-white max-[640px]:px-2 max-[640px]:text-xs"
                onClick={() => suppressNewsPopupFor(7 * 24 * 60 * 60 * 1000)}
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#bdbdbd] text-white">✓</span>
                일주일 보지 않기
              </button>
              <button
                type="button"
                className="ml-auto inline-flex h-10 min-w-[110px] items-center justify-center border-l border-slate-300 px-5 text-sm font-bold text-slate-800 transition hover:bg-white max-[640px]:col-span-2 max-[640px]:ml-0 max-[640px]:w-full max-[640px]:border-l-0 max-[640px]:border-t"
                onClick={closeNewsPopup}
              >
                닫기
              </button>
            </div>
          </article>
        </div>
      ) : null}
      <section
        className="relative h-[clamp(370px,54vh,560px)] overflow-hidden max-[1280px]:h-[clamp(320px,47vh,460px)] max-[980px]:h-[300px] max-[640px]:hidden"
        aria-label="Main banners"
      >
        <div className="banner-track relative h-full">
          {bannerImages.map((banner, index) => (
            <div
              key={banner.src ?? `${index}`}
              className={`banner-slide pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(100deg,rgba(15,20,28,0.72)_0%,rgba(15,20,28,0.4)_42%,rgba(15,20,28,0.12)_72%)] before:content-[''] ${
                currentSlide === index ? 'is-active pointer-events-auto' : ''
              }`}
              style={{ '--banner-image': `url('${banner.src}')` }}
            >
              <span className="sr-only">MEAN WELL banner {index + 1}</span>
              <div className="absolute left-[clamp(22px,4vw,72px)] top-1/2 z-10 max-w-[min(720px,58vw)] -translate-y-1/2 text-white max-[1280px]:max-w-[min(620px,55vw)] max-[980px]:max-w-[min(640px,90vw)] max-[640px]:left-3.5 max-[640px]:right-3.5 max-[640px]:max-w-none">
                <p className="mb-2.5 text-[clamp(11px,0.95vw,15px)] font-bold tracking-[1.4px] text-rose-200 max-[640px]:mb-2 max-[640px]:text-[10px]">
                  {banner.eyebrow ?? ''}
                </p>
                <h2 className="home-banner-title m-0 text-[clamp(26px,2.55vw,44px)] leading-[1.2] text-white max-[1280px]:text-[clamp(24px,2.7vw,38px)] max-[980px]:text-[clamp(22px,5vw,31px)] max-[640px]:text-[clamp(18px,5.8vw,22px)] max-[640px]:leading-[1.24]">
                  {bannerTitleLines[index].map((line, lineIndex) => (
                    <Fragment key={`${banner.src ?? index}-${lineIndex}`}>
                      {line}
                      {lineIndex < bannerTitleLines[index].length - 1 ? <br /> : null}
                    </Fragment>
                  ))}
                </h2>
                <p className="home-banner-description mt-3.5 max-w-[60ch] text-[clamp(13px,0.92vw,16px)] leading-[1.65] text-slate-100 max-[980px]:mt-2.5 max-[980px]:text-sm max-[640px]:hidden">
                  {banner.description ?? ''}
                </p>
                <a
                  href="#"
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-[#f04337] to-[#d02b22] px-[18px] text-[13px] font-bold tracking-[0.2px] text-white shadow-[0_10px_24px_rgba(208,43,34,0.3)] max-[980px]:mt-3.5 max-[980px]:h-10 max-[980px]:px-3.5 max-[980px]:text-xs max-[640px]:mt-2.5 max-[640px]:h-[34px] max-[640px]:px-2.5 max-[640px]:text-[11px]"
                  onClick={(event) => {
                    event.preventDefault()
                    onNavigate(banner.view ?? 'products')
                  }}
                >
                  {banner.cta ?? 'View More'}
                </a>
              </div>
            </div>
          ))}
        </div>
        <button
          className="banner-arrow prev absolute left-3.5 top-1/2 z-20 h-[44px] w-[44px] -translate-y-1/2 rounded-full border-0 bg-black/45 text-[30px] leading-none text-white"
          type="button"
          aria-label="Previous banner"
          onClick={() => setCurrentSlide((prev) => normalizeIndex(prev - 1, totalSlides))}
        >
          ‹
        </button>
        <button
          className="banner-arrow next absolute right-3.5 top-1/2 z-20 h-[44px] w-[44px] -translate-y-1/2 rounded-full border-0 bg-black/45 text-[30px] leading-none text-white"
          type="button"
          aria-label="Next banner"
          onClick={() => setCurrentSlide((prev) => normalizeIndex(prev + 1, totalSlides))}
        >
          ›
        </button>
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {bannerImages.map((banner, index) => (
            <button
              key={`${banner.src ?? index}-dot`}
              type="button"
              className={`banner-dot h-2.5 w-2.5 rounded-full border-0 bg-white/45 p-0 ${currentSlide === index ? 'is-active' : ''}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to banner ${index + 1}`}
            ></button>
          ))}
        </div>
      </section>

      <section className="grid w-full grid-cols-6 max-[1280px]:grid-cols-3 max-[980px]:grid-cols-3 max-[640px]:hidden">
        {solutionCards.map((item) => (
          <a
            href="#"
            key={item.title}
            className="relative block min-h-[252px] overflow-hidden border-r border-slate-300 bg-white transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#d13d3d] max-[640px]:min-h-[224px] max-[480px]:border-r-0 max-[480px]:border-t max-[480px]:border-slate-300"
            onClick={(event) => {
              event.preventDefault()
              navigateSolutionCard(item)
            }}
          >
            <img className="block h-48 w-full object-cover max-[640px]:h-40" src={item.image} alt={item.alt} />
            <h3 className="m-0 min-h-[70px] px-4 pt-4 text-center text-[clamp(13px,0.84vw,17px)] leading-[1.35] text-neutral-700">{item.title}</h3>
          </a>
        ))}
      </section>

      <section className="relative hidden bg-slate-950 max-[640px]:block" aria-label="모바일 솔루션 메뉴">
        <form
          className="bg-[#fff7f8] px-3 pb-4 pt-3"
          role="search"
          aria-label="상품 검색"
          onSubmit={handleMobileSearchSubmit}
        >
          <label className="flex h-11 items-center gap-2.5 rounded-full bg-white px-4 text-slate-500 shadow-[0_10px_24px_rgba(15,23,42,0.1)] ring-1 ring-slate-100">
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7"></circle>
              <line x1="16.5" y1="16.5" x2="21" y2="21"></line>
            </svg>
            <input
              type="search"
              value={mobileSearchKeyword}
              onChange={(event) => setMobileSearchKeyword(event.target.value)}
              aria-label="상품명/시리즈/그룹 검색"
              className="min-w-0 flex-1 border-0 bg-transparent text-[16px] font-bold text-slate-800 outline-none placeholder:text-transparent"
            />
            <button type="submit" className="sr-only">
              검색
            </button>
          </label>
          {mobileSearchShortcutList.length > 0 ? (
            <div className="mt-2.5">
              <p className="m-0 text-[13px] font-black text-[#b4262e]">바로가기</p>
              <div className="mt-1.5 flex flex-wrap justify-center gap-1.5 pb-0.5">
                {mobileSearchShortcutList.map((shortcut) => (
                  <button
                    key={shortcut.modelKey}
                    type="button"
                    className="shrink-0 rounded-full border border-[#d79aa2] bg-white px-2.5 py-1 text-[11px] font-black uppercase leading-4 text-[#b4262e] shadow-[0_4px_10px_rgba(15,23,42,0.04)]"
                    onClick={() => onOpenProductSearch?.(shortcut.displayModel)}
                  >
                    {shortcut.displayModel}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </form>

        <div
          ref={mobileSolutionTrackRef}
          className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none' }}
        >
          {mobileSolutionCards.map((item) => (
            <a
              href="#"
              key={`mobile-solution-${item.alt}-${item.mobileTitle}`}
              className="relative block h-[calc(100dvh-218px)] min-h-[368px] w-full shrink-0 snap-start overflow-hidden"
              onClick={(event) => {
                event.preventDefault()
                navigateSolutionCard(item)
              }}
            >
              <img className="absolute inset-0 h-full w-full object-cover" src={item.image} alt={item.alt} />
              <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.26)_0%,rgba(15,23,42,0.84)_66%,rgba(2,6,23,0.95)_100%)]"></span>

              <div className="absolute left-1/2 top-1/2 z-10 w-[min(calc(100%-3rem),22rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/20 bg-black/28 p-4 backdrop-blur-sm">
                <p className="m-0 text-[10px] font-black tracking-[0.12em] text-rose-200">MWPOWER</p>
                <h3 className="m-0 mt-1.5 text-[clamp(18px,5.4vw,23px)] font-black leading-[1.15] text-white">{item.mobileTitle}</h3>
                {item.mobileSubtitle ? <p className="m-0 mt-1.5 text-[13px] font-semibold leading-5 text-slate-100">{item.mobileSubtitle}</p> : null}
              </div>
            </a>
          ))}
        </div>

        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {mobileSolutionCards.map((item, index) => (
            <button
              key={`mobile-solution-dot-${item.alt}-${index}`}
              type="button"
              aria-label={`${index + 1}번 메뉴로 이동`}
              className={`h-2.5 w-2.5 rounded-full border-0 p-0 ${mobileSolutionIndex === index ? 'bg-white' : 'bg-white/45'}`}
              onClick={() => scrollMobileSolutionsTo(index)}
            ></button>
          ))}
        </div>
      </section>

      <HomeProductCategorySection onNavigate={onNavigate} onOpenProductPreset={onOpenProductPreset} />

      <section className="w-full border-t border-slate-200 bg-slate-200/55 py-10 md:py-14" aria-label="Product">
        <div className="mx-auto w-full max-w-[1540px] px-5 md:px-8">
          <header className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-[clamp(2rem,2.6vw,3.1rem)] font-black tracking-tight text-slate-900">
              <span className="text-[#e5332a]">Product</span> Focus
            </h2>
            <a
              href="#"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('products')
              }}
              className="inline-flex h-10 items-center rounded-full border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              View More
            </a>
          </header>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {productCards.map((item) => (
              <article key={item.name} className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <p className="text-xs font-semibold text-slate-500">{item.type}</p>
                <h3 className="mt-1 text-[1.18rem] font-black tracking-tight text-slate-800">{item.name}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-500">{item.desc}</p>
              </article>
            ))}
          </div>

          <article className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid lg:grid-cols-[1fr_1.1fr]">
            <div className="grid min-h-[200px] place-items-center bg-[linear-gradient(135deg,#f1f5f9_0%,#dbe5ef_100%)] px-6 py-8 text-center">
              <div>
                <p className="text-xs font-bold tracking-[0.12em] text-[#d7322a]">CATEGORY FIRST</p>
                <h3 className="mt-3 text-[clamp(1.35rem,1.8vw,2rem)] font-black leading-tight tracking-tight text-slate-900">MWPOWER</h3>
              </div>
            </div>
            <div className="p-6 lg:p-8">
              <p className="text-xs font-bold tracking-[0.11em] text-[#d7322a]">PRODUCT INFORMATION</p>
              <h3 className="mt-3 text-[clamp(1.6rem,2.1vw,2.55rem)] font-black leading-tight tracking-tight text-slate-900">
                라인 특성에 맞는 전원 제품군을
                <br />
                카테고리 기반으로 빠르게 탐색하세요.
              </h3>
              <a
                href="#"
                onClick={(event) => {
                  event.preventDefault()
                  onNavigate('products')
                }}
                className="mt-6 inline-flex h-11 items-center rounded-full bg-[#e5332a] px-5 text-sm font-bold text-white transition hover:bg-[#c72b23]"
              >
                제품 카테고리 보기
              </a>
            </div>
          </article>
        </div>
      </section>

      <section className="w-full border-t border-slate-100 bg-white py-10 md:py-14" aria-label="뉴스">
        <div className="mx-auto w-full max-w-[1540px] px-5 md:px-8">
          <header className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="m-0 text-[11px] font-black uppercase tracking-[0.14em] text-[#d7322a]">뉴스</p>
              <h2 className="mt-2 text-[clamp(2rem,2.6vw,3.1rem)] font-black tracking-tight text-slate-900">최신 뉴스 미리보기</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">MEAN WELL 공식 신제품 소식을 한국어 요약으로 먼저 확인하세요.</p>
            </div>
            <a
              href="#"
              className="inline-flex h-10 items-center rounded-full border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('news')
              }}
            >
              뉴스 더보기
            </a>
          </header>

          {visibleNews.length ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {visibleNews.map((item) => (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-[22px] bg-white text-left shadow-[0_16px_36px_-32px_rgba(15,23,42,0.34)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_-34px_rgba(15,23,42,0.4)]"
                >
                  <button
                    type="button"
                    className="relative block aspect-[16/9] w-full overflow-hidden border-0 bg-slate-100 p-0 text-left"
                    aria-label={`${item.title} 뉴스 보기`}
                    onClick={() => openNews(item)}
                  >
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" onError={handleNewsImageError} />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-sm font-black text-slate-400">이미지 없음</div>
                    )}
                  </button>
                  <button type="button" className="block min-h-[128px] w-full bg-white px-5 py-4 text-left" onClick={() => openNews(item)}>
                    <div className="flex items-center justify-between gap-3">
                      <time className="shrink-0 text-[13px] font-black tracking-[0.12em] text-[#c9252f]">{formatNewsDate(item.date)}</time>
                      <span className="min-w-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-500 shadow-[inset_0_0_0_1px_rgba(226,232,240,0.85)]">
                        {item.sourceLabel || '외부 뉴스'}
                      </span>
                    </div>
                    <strong
                      className="mt-3 block text-[1.08rem] font-black leading-[1.38] text-slate-900"
                    >
                      {item.title}
                    </strong>
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid min-h-[260px] place-items-center rounded-[22px] bg-white px-6 text-center shadow-sm">
              <div>
                <strong className="text-lg font-black text-slate-900">등록된 뉴스가 없습니다.</strong>
                <p className="mt-2 text-sm font-semibold text-slate-500">관리자에서 링크를 등록하면 이 영역에 최신 뉴스가 표시됩니다.</p>
              </div>
            </div>
          )}

          {newsPreviewError ? <p className="mt-3 text-sm font-semibold text-[#b42323]">{newsPreviewError}</p> : null}
        </div>
      </section>

      {/*
      <section className="w-full border-y border-slate-200 bg-slate-100/70 py-10 md:py-14" aria-label="Service">
        <div className="mx-auto w-full max-w-[1540px] px-5 md:px-8">
          <header className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-[clamp(2rem,2.6vw,3.1rem)] font-black tracking-tight text-slate-900">
              <span className="text-[#e5332a]">Service</span> Center
            </h2>
            <a
              href="#"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('service')
              }}
              className="inline-flex h-10 items-center rounded-full border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              View More
            </a>
          </header>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {serviceCards.map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <i className={`${item.icon} mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-[#eb3b33] to-[#b9231f] text-xl text-white`} aria-hidden="true"></i>
                <h3 className="mt-4 text-[1.18rem] font-black tracking-tight text-slate-800">{item.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-500">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      */}
    </div>
  )
}
