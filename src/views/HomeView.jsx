import { useEffect, useMemo, useRef, useState } from 'react'
import { HomeProductCategorySection } from '../components/HomeProductCategorySection'
import { getAllNewsSorted } from '../data/newsContent'
import { DesktopSolutionGrid } from '../features/home/components/DesktopSolutionGrid'
import { HomeBannerCarousel } from '../features/home/components/HomeBannerCarousel'
import { MobileSolutionShowcase } from '../features/home/components/MobileSolutionShowcase'
import { NewsPopup } from '../features/home/components/NewsPopup'
import { NewsPreviewSection } from '../features/home/components/NewsPreviewSection'
import { ProductFocusSection } from '../features/home/components/ProductFocusSection'
import { StoreHome } from '../features/home/components/StoreHome'
import { solutionCards } from '../features/home/homeData'
import {
  NEWS_POPUP_SUPPRESS_KEY,
  getNewsArticleUrl,
  getSingleSearchToken,
  isBlogArticle,
  normalizeIndex,
  normalizeShortcutToken,
} from '../features/home/homeUtils'
import { loadNewsArticlesForPublic, normalizeNewsItems } from '../features/newsService'

function useBannerCarousel(totalSlides) {
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

  return { currentSlide, setCurrentSlide }
}

function usePublicNews() {
  const [newsItems, setNewsItems] = useState(() => normalizeNewsItems(getAllNewsSorted()))
  const [newsPreviewError, setNewsPreviewError] = useState('')

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

  return { newsItems, newsPreviewError }
}

function useMobileProductShortcuts(searchKeyword) {
  const [shortcutList, setShortcutList] = useState([])

  useEffect(() => {
    const searchToken = getSingleSearchToken(searchKeyword)
    if (!searchToken) {
      setShortcutList([])
      return undefined
    }

    let alive = true

    ;(async () => {
      const [catalogService, routeIndex] = await Promise.all([
        import('../features/productCatalogService'),
        import('../features/productRouteIndex'),
      ])
      if (!alive) return

      const [majorResult, treeResult] = await Promise.all([
        catalogService.loadMajorCategories(),
        catalogService.loadLeafModelTreeMap(),
      ])
      if (!alive) return

      const tokenKey = catalogService.normalizeLabel(searchToken)
      if (!tokenKey) {
        setShortcutList([])
        return
      }

      const majorIdByName = routeIndex.buildMajorIdByName(majorResult.categories)
      const modelRouteIndex = routeIndex.buildModelRouteIndex(treeResult.treeMap, majorIdByName)
      const nextShortcutList = Object.entries(modelRouteIndex)
        .filter(([modelKey]) => modelKey.includes(tokenKey) || tokenKey.startsWith(`${tokenKey}-`))
        .map(([modelKey, route]) => routeIndex.toProductRouteShortcut(modelKey, route))
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

      setShortcutList(nextShortcutList)
    })().catch(() => {
      if (alive) setShortcutList([])
    })

    return () => {
      alive = false
    }
  }, [searchKeyword])

  return shortcutList
}

function useMobileSolutions({ isActive, cards }) {
  const [mobileSolutionIndex, setMobileSolutionIndex] = useState(0)
  const mobileSolutionTrackRef = useRef(null)

  function scrollToSolution(nextIndex) {
    const track = mobileSolutionTrackRef.current
    if (!track) return
    const width = track.clientWidth || 1
    const maxIndex = cards.length - 1
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
  }, [cards.length])

  useEffect(() => {
    if (!isActive) return
    const track = mobileSolutionTrackRef.current
    if (!track) return
    track.scrollTo({ left: 0, behavior: 'auto' })
    setMobileSolutionIndex(0)
  }, [isActive])

  return { mobileSolutionIndex, mobileSolutionTrackRef, scrollToSolution }
}

function useNewsPopup({ isActive, isShopSite, popupNews }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    if (!isActive || isShopSite || !popupNews || isDismissed) {
      setIsOpen(false)
      return
    }

    try {
      const suppressUntil = Number(window.localStorage.getItem(NEWS_POPUP_SUPPRESS_KEY))
      if (Number.isFinite(suppressUntil) && suppressUntil > Date.now()) {
        setIsOpen(false)
        return
      }
    } catch {
      // localStorage may be unavailable in restricted browser modes.
    }

    setIsOpen(true)
  }, [isActive, isShopSite, popupNews?.id, isDismissed])

  function close() {
    setIsOpen(false)
    setIsDismissed(true)
  }

  function suppressFor(ms) {
    try {
      window.localStorage.setItem(NEWS_POPUP_SUPPRESS_KEY, String(Date.now() + ms))
    } catch {
      // Ignore storage failures and close for the current session.
    }
    close()
  }

  return { isOpen, close, suppressFor }
}

export function HomeView({
  isActive,
  isShopSite = false,
  bannerImages,
  onNavigate,
  onOpenProductPreset,
  onOpenProductSearch,
  onOpenNewsArticle,
  orderItemCount = 0,
}) {
  const totalSlides = bannerImages.length
  const { currentSlide, setCurrentSlide } = useBannerCarousel(totalSlides)
  const [mobileSearchKeyword, setMobileSearchKeyword] = useState('')
  const mobileSearchShortcutList = useMobileProductShortcuts(mobileSearchKeyword)
  const { newsItems, newsPreviewError } = usePublicNews()

  const bannerTitleLines = useMemo(
    () =>
      bannerImages.map((banner) =>
        String(banner.title ?? '')
          .split('\n')
          .filter(Boolean)
      ),
    [bannerImages]
  )
  const visibleNews = newsItems.slice(0, 8)
  const popupNews = visibleNews.find((item) => !isBlogArticle(item)) ?? visibleNews[0] ?? null
  const newsPopup = useNewsPopup({ isActive, isShopSite, popupNews })
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
  const mobileSolutions = useMobileSolutions({ isActive, cards: mobileSolutionCards })

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

    const keywordKey = normalizeShortcutToken(keyword)
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
    return (
      <StoreHome
        isActive={isActive}
        mobileSearchKeyword={mobileSearchKeyword}
        setMobileSearchKeyword={setMobileSearchKeyword}
        mobileSearchShortcutList={mobileSearchShortcutList}
        orderItemCount={orderItemCount}
        onSearchSubmit={handleMobileSearchSubmit}
        onNavigate={onNavigate}
        onOpenProductPreset={onOpenProductPreset}
        onOpenProductSearch={onOpenProductSearch}
      />
    )
  }

  return (
    <div id="home-sections" className={isActive ? '' : 'is-hidden'}>
      <h1 className="sr-only">MWPOWER MEAN WELL 전원공급장치 정품 공급업체</h1>
      {newsPopup.isOpen ? <NewsPopup popupNews={popupNews} onClose={newsPopup.close} onSuppress={newsPopup.suppressFor} /> : null}
      <HomeBannerCarousel
        bannerImages={bannerImages}
        bannerTitleLines={bannerTitleLines}
        currentSlide={currentSlide}
        setCurrentSlide={setCurrentSlide}
        onNavigate={onNavigate}
      />
      <DesktopSolutionGrid onNavigateSolution={navigateSolutionCard} />
      <MobileSolutionShowcase
        mobileSearchKeyword={mobileSearchKeyword}
        setMobileSearchKeyword={setMobileSearchKeyword}
        mobileSearchShortcutList={mobileSearchShortcutList}
        mobileSolutionCards={mobileSolutionCards}
        mobileSolutionIndex={mobileSolutions.mobileSolutionIndex}
        mobileSolutionTrackRef={mobileSolutions.mobileSolutionTrackRef}
        onSearchSubmit={handleMobileSearchSubmit}
        onNavigateSolution={navigateSolutionCard}
        onOpenProductSearch={onOpenProductSearch}
        scrollToSolution={mobileSolutions.scrollToSolution}
      />
      <HomeProductCategorySection onNavigate={onNavigate} onOpenProductPreset={onOpenProductPreset} />
      <ProductFocusSection onNavigate={onNavigate} />
      <NewsPreviewSection visibleNews={visibleNews} newsPreviewError={newsPreviewError} onNavigate={onNavigate} onOpenNews={openNews} />
    </div>
  )
}
