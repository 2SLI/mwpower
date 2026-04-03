import { Fragment, useEffect, useMemo, useState } from 'react'
import { NEWS_ALL_CATEGORY, formatNewsDate, getAllNewsSorted } from '../data/newsContent'

const solutionCards = [
  { title: 'DC/DC Converter 전원 솔루션', image: '/meanwell/index_1.jpg', alt: 'DC/DC', productPreset: { majorId: 'dc-dc' } },
  { title: 'LED 전원 솔루션', image: '/meanwell/index-solutions-pic1.jpg', alt: 'LED', productSearch: 'LED' },
  { title: '의료 전원 솔루션', image: '/meanwell/index-solutions-pic6.jpg', alt: 'MEDICAL', productSearch: 'MEDICAL' },
  {
    title: 'LED Display 솔루션',
    image: '/meanwell/index-solutions-pic4.jpg',
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
  { name: 'LED Power Solution', type: 'ELG Series', desc: 'LED 조명 환경에 최적화된 정전류/정전압 전원으로 장기 운용 안정성을 확보합니다.' },
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

export function HomeView({ isActive, bannerImages, onNavigate, onOpenProductPreset, onOpenProductSearch, onOpenNewsArticle }) {
  const totalSlides = bannerImages.length
  const [currentSlide, setCurrentSlide] = useState(0)

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

  const allNewsItems = useMemo(() => getAllNewsSorted(), [])
  const featuredNews = allNewsItems[0] ?? null
  const latestNews = allNewsItems.slice(1, 5)

  function openNews(articleId) {
    if (!articleId) {
      onNavigate('news')
      return
    }
    onOpenNewsArticle?.(articleId, NEWS_ALL_CATEGORY)
  }

  return (
    <div id="home-sections" className={isActive ? '' : 'is-hidden'}>
      <h1 className="sr-only">민웰파워 MEAN WELL 전원공급장치 정품 공급업체</h1>
      <section
        className="relative h-[clamp(370px,54vh,560px)] overflow-hidden max-[1280px]:h-[clamp(320px,47vh,460px)] max-[980px]:h-[300px] max-[640px]:h-[220px]"
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
              <div className="absolute left-[clamp(22px,4vw,72px)] top-1/2 z-10 max-w-[min(620px,56vw)] -translate-y-1/2 text-white max-[980px]:max-w-[min(640px,90vw)] max-[640px]:left-3.5 max-[640px]:right-3.5 max-[640px]:max-w-none">
                <p className="mb-2.5 text-[clamp(11px,0.95vw,15px)] font-bold tracking-[1.4px] text-rose-200 max-[640px]:mb-2 max-[640px]:text-[10px]">
                  {banner.eyebrow ?? ''}
                </p>
                <h2 className="m-0 text-[clamp(30px,3.2vw,56px)] leading-[1.17] tracking-[-0.6px] text-white max-[980px]:text-[clamp(24px,6vw,36px)] max-[640px]:text-[clamp(19px,6.6vw,24px)] max-[640px]:leading-[1.23]">
                  {bannerTitleLines[index].map((line, lineIndex) => (
                    <Fragment key={`${banner.src ?? index}-${lineIndex}`}>
                      {line}
                      {lineIndex < bannerTitleLines[index].length - 1 ? <br /> : null}
                    </Fragment>
                  ))}
                </h2>
                <p className="mt-3.5 max-w-[52ch] text-[clamp(14px,1.1vw,20px)] leading-[1.55] text-slate-100 max-[980px]:mt-2.5 max-[980px]:text-sm max-[640px]:hidden">
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
        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
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

      <section className="grid w-full grid-cols-6 max-[1280px]:grid-cols-3 max-[980px]:grid-cols-3 max-[640px]:grid-cols-2 max-[480px]:grid-cols-1">
        {solutionCards.map((item) => (
          <a
            href="#"
            key={item.title}
            className="relative block min-h-[252px] overflow-hidden border-r border-slate-300 bg-white transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#d13d3d] max-[640px]:min-h-[224px] max-[480px]:border-r-0 max-[480px]:border-t max-[480px]:border-slate-300"
            onClick={(event) => {
              event.preventDefault()
              if (item.productPreset) {
                onOpenProductPreset?.(item.productPreset)
                return
              }
              if (item.productSearch) {
                onOpenProductSearch?.(item.productSearch)
                return
              }
              onNavigate('products')
            }}
          >
            <img className="block h-48 w-full object-cover max-[640px]:h-40" src={item.image} alt={item.alt} />
            <h3 className="m-0 min-h-[70px] px-4 pt-4 text-center text-[clamp(13px,0.84vw,17px)] leading-[1.35] text-neutral-700">{item.title}</h3>
          </a>
        ))}
      </section>

      <section className="w-full border-t border-slate-200 bg-slate-100/90 py-10 md:py-14" aria-label="News">
        <div className="mx-auto w-full max-w-[1540px] px-5 md:px-8">
          <header className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-[clamp(2rem,2.6vw,3.1rem)] font-black tracking-tight text-slate-900">
              <span className="text-[#e5332a]">News</span> Update
            </h2>
            <a
              href="#"
              className="inline-flex h-10 items-center rounded-full border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              onClick={(event) => {
                event.preventDefault()
                onNavigate('news')
              }}
            >
              View More
            </a>
          </header>

          <div className="grid gap-4 xl:grid-cols-[1.24fr_1fr]">
            <article className="relative min-h-[300px] overflow-hidden rounded-[26px] border border-slate-200 bg-[linear-gradient(145deg,#111827_0%,#1e293b_58%,#364152_100%)] p-6 shadow-[0_22px_45px_-28px_rgba(15,23,42,.9)] md:min-h-[370px]">
              <p className="text-xs font-bold tracking-[0.12em] text-amber-300">FEATURE STORY</p>
              <h3 className="mt-3 text-[clamp(1.6rem,2.25vw,2.55rem)] font-extrabold leading-tight tracking-tight text-white">
                {featuredNews?.title ?? '업데이트된 뉴스가 없습니다.'}
              </h3>
              <p className="mt-4 max-w-[44ch] text-sm leading-relaxed text-slate-200">
                {featuredNews?.summary ?? '뉴스가 등록되면 이 영역에 최신 소식이 자동으로 표시됩니다.'}
              </p>
              <p className="mt-2 text-xs font-bold text-slate-300">{featuredNews ? `${formatNewsDate(featuredNews.date)} · ${featuredNews.category}` : ''}</p>
              <a
                href="#"
                className="mt-5 inline-flex h-10 items-center rounded-full border border-white/40 bg-white/10 px-4 text-xs font-bold text-white backdrop-blur-sm"
                onClick={(event) => {
                  event.preventDefault()
                  openNews(featuredNews?.id)
                }}
              >
                Read Story
              </a>
            </article>

            <ul className="m-0 grid list-none gap-3 p-0">
              {latestNews.map((item) => (
                <li key={item.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
                  <a
                    href="#"
                    className="block"
                    onClick={(event) => {
                      event.preventDefault()
                      openNews(item.id)
                    }}
                  >
                    <time className="text-xs font-bold text-[#d7322a]">{formatNewsDate(item.date)}</time>
                    <strong className="mt-1 block text-base font-extrabold leading-snug text-slate-800">{item.title}</strong>
                    <p className="mt-2 text-[13px] leading-relaxed text-slate-500">{item.summary}</p>
                  </a>
                </li>
              ))}
            </ul>
          </div>
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
