import { Fragment } from 'react'
import { normalizeIndex } from '../homeUtils'

export function HomeBannerCarousel({ bannerImages, bannerTitleLines, currentSlide, setCurrentSlide, onNavigate }) {
  const totalSlides = bannerImages.length

  return (
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
                {(bannerTitleLines[index] ?? []).map((line, lineIndex) => (
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
  )
}
