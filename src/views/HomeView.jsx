import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { HomeProductCategorySection } from '../components/HomeProductCategorySection'
import { inventoryOptionModelsByBaseKey, productInventoryByModelKey } from '../data/productInventory'
import { NEWS_FALLBACK_IMAGE, formatNewsDate, getAllNewsSorted } from '../data/newsContent'
import { normalizeLabel } from '../features/productCatalogService'
import { loadNewsArticlesForPublic, normalizeNewsItems } from '../features/newsService'

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

export function HomeView({ isActive, bannerImages, onNavigate, onOpenProductPreset, onOpenProductSearch, onOpenNewsArticle }) {
  const totalSlides = bannerImages.length
  const [currentSlide, setCurrentSlide] = useState(0)
  const [mobileSolutionIndex, setMobileSolutionIndex] = useState(0)
  const [mobileSearchKeyword, setMobileSearchKeyword] = useState('')
  const [newsItems, setNewsItems] = useState(() => normalizeNewsItems(getAllNewsSorted()))
  const [newsPreviewError, setNewsPreviewError] = useState('')
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

  const visibleNews = newsItems.slice(0, 8)
  const mobileSearchShortcutList = useMemo(() => {
    const tokenKey = normalizeLabel(getSingleSearchToken(mobileSearchKeyword))
    if (!tokenKey) return []

    const shortcutMap = new Map()

    Object.values(productInventoryByModelKey).forEach((record) => {
      const displayModel = String(record?.model ?? '').trim().toUpperCase()
      const modelKey = normalizeLabel(displayModel)
      if (!displayModel || !modelKey) return
      shortcutMap.set(modelKey, displayModel)
    })

    Object.entries(inventoryOptionModelsByBaseKey).forEach(([baseModelKey, optionModels]) => {
      const baseKey = normalizeLabel(baseModelKey)
      if (baseKey && !shortcutMap.has(baseKey)) shortcutMap.set(baseKey, String(baseModelKey ?? '').trim())

      if (!Array.isArray(optionModels)) return
      optionModels.forEach((optionModel) => {
        const displayModel = String(optionModel ?? '').trim().toUpperCase()
        const modelKey = normalizeLabel(displayModel)
        if (!displayModel || !modelKey || shortcutMap.has(modelKey)) return
        shortcutMap.set(modelKey, displayModel)
      })
    })

    return Array.from(shortcutMap.entries())
      .filter(([modelKey]) => modelKey.includes(tokenKey) || tokenKey.startsWith(`${modelKey}-`))
      .map(([modelKey, displayModel]) => ({ modelKey, displayModel }))
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
  }, [mobileSearchKeyword])
  const mobileSolutionCards = useMemo(
    () =>
      solutionCards.map((item, index) => {
        if (index !== 0) return { ...item, mobileTitle: item.title, mobileSubtitle: '' }
        return {
          ...item,
          mobileTitle: '제품 사양서 보기',
          mobileSubtitle: '민웰파워는 민웰 정품 제품만을 판매합니다.',
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

  function openNews(articleId) {
    if (!articleId) {
      onNavigate('news')
      return
    }
    onOpenNewsArticle?.(articleId)
  }

  return (
    <div id="home-sections" className={isActive ? '' : 'is-hidden'}>
      <h1 className="sr-only">민웰파워 MEAN WELL 전원공급장치 정품 공급업체</h1>
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
                <p className="m-0 text-[10px] font-black tracking-[0.12em] text-rose-200">MEAN WELL POWER</p>
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
                    aria-label={`${item.title} 번역 뉴스 보기`}
                    onClick={() => openNews(item.id)}
                  >
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" onError={handleNewsImageError} />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-sm font-black text-slate-400">이미지 없음</div>
                    )}
                  </button>
                  <button type="button" className="block min-h-[178px] w-full bg-white px-5 py-4 text-left" onClick={() => openNews(item.id)}>
                    <div className="flex items-center justify-between gap-3">
                      <time className="shrink-0 text-[13px] font-black tracking-[0.12em] text-[#c9252f]">{formatNewsDate(item.date)}</time>
                      <span className="min-w-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-500 shadow-[inset_0_0_0_1px_rgba(226,232,240,0.85)]">
                        {item.sourceLabel || '외부 뉴스'}
                      </span>
                    </div>
                    <strong
                      className="mt-3 block text-[1.08rem] font-black leading-[1.35] text-slate-900"
                      style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    >
                      {item.title}
                    </strong>
                    <p
                      className="mt-3 text-[14px] font-medium leading-6 text-slate-500"
                      style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    >
                      {item.summary || '등록된 요약이 없습니다.'}
                    </p>
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
                <h3 className="mt-3 text-[clamp(1.35rem,1.8vw,2rem)] font-black leading-tight tracking-tight text-slate-900">MEANWELLPOWER</h3>
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
    </div>
  )
}
