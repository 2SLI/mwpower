import { useEffect, useMemo, useState } from 'react'
import { NEWS_FALLBACK_IMAGE, formatNewsDate, getAllNewsSorted } from '../data/newsContent'
import { loadNewsArticlesForPublic, normalizeNewsItems } from '../features/newsService'

function getArticleById(items, articleId) {
  const id = String(articleId ?? '').trim()
  if (!id) return null
  return items.find((item) => item.id === id) ?? null
}

function handleNewsImageError(event) {
  const image = event.currentTarget
  if (!image || image.dataset.fallbackApplied === 'true') return
  image.dataset.fallbackApplied = 'true'
  image.src = NEWS_FALLBACK_IMAGE
}

const NEWS_CATEGORIES = ['산업 뉴스', '신제품', '제품 공지', '기술 자료', '전시회', '회사 소식', '보도자료', '영상 채널']

function getArticleUrl(article = {}) {
  return article.articleUrl || article.externalUrl || '#'
}

function isMeanwellOfficialArticle(article = {}) {
  if (article.source === 'meanwell-official') return true
  try {
    return /(^|\.)meanwell\.com$/i.test(new URL(getArticleUrl(article)).hostname)
  } catch {
    return false
  }
}

function hasTranslatedArticle(article = {}) {
  return isMeanwellOfficialArticle(article) && (article.summary || article.body?.length || article.keyPoints?.length)
}

function getArticleIdFromPathname(pathname = '') {
  const match = String(pathname ?? '').match(/^\/news\/([^/?#]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}

export function NewsView({ isActive, onNavigate, onOpenNewsArticle, externalNewsRequest, pathname = '' }) {
  const [articles, setArticles] = useState(() => normalizeNewsItems(getAllNewsSorted()))
  const [keyword, setKeyword] = useState('')
  const [activeArticleId, setActiveArticleId] = useState(null)
  const [isLoadingArticles, setIsLoadingArticles] = useState(false)
  const [loadError, setLoadError] = useState('')
  const routeArticleId = getArticleIdFromPathname(pathname)

  useEffect(() => {
    let alive = true
    setIsLoadingArticles(true)

    ;(async () => {
      const result = await loadNewsArticlesForPublic()
      if (!alive) return

      const nextArticles = Array.isArray(result?.articles) ? result.articles : []
      setArticles(nextArticles)
      setLoadError('')
      setIsLoadingArticles(false)
    })().catch(() => {
      if (!alive) return
      setArticles(normalizeNewsItems(getAllNewsSorted()))
      setLoadError('뉴스 데이터를 불러오지 못했습니다. 기본 목록으로 표시합니다.')
      setIsLoadingArticles(false)
    })

    return () => {
      alive = false
    }
  }, [])

  const filteredArticles = useMemo(() => {
    const term = keyword.trim().toLowerCase()
    if (!term) return articles

    return articles.filter((item) => {
      const haystack = `${item.title} ${item.summary ?? ''} ${item.originalTitle ?? ''} ${item.sourceLabel ?? ''}`.toLowerCase()
      return haystack.includes(term)
    })
  }, [articles, keyword])

  useEffect(() => {
    if (!filteredArticles.length) {
      setActiveArticleId(null)
      return
    }

    if (routeArticleId) {
      if (activeArticleId !== routeArticleId) setActiveArticleId(routeArticleId)
      return
    }

    if (activeArticleId && !filteredArticles.some((item) => item.id === activeArticleId)) {
      setActiveArticleId(null)
    }
  }, [filteredArticles, activeArticleId, routeArticleId])

  useEffect(() => {
    if (!externalNewsRequest) return
    const target = getArticleById(articles, externalNewsRequest.articleId)
    if (!target) return
    setActiveArticleId(target.id)
  }, [externalNewsRequest, articles])

  const activeArticle = useMemo(() => {
    if (!activeArticleId) return null
    return filteredArticles.find((item) => item.id === activeArticleId) ?? null
  }, [activeArticleId, filteredArticles])

  function openTranslatedArticle(articleId) {
    const id = String(articleId ?? '').trim()
    if (!id) return
    onOpenNewsArticle?.(id)
  }

  function handleArticleOpen(event, article) {
    if (!hasTranslatedArticle(article)) return
    event.preventDefault()
    openTranslatedArticle(article.id)
  }

  return (
    <section className={`${isActive ? '' : 'is-hidden'} bg-white text-[#333]`} id="news-page">
      <div className="relative h-[230px] overflow-hidden bg-slate-900 max-[640px]:h-[180px]">
        <img src="/meanwell/news/news-hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/55"></div>
        <div className="relative mx-auto flex h-full max-w-[1250px] flex-col justify-center px-5 text-white">
          <h1 className="m-0 text-[52px] font-medium leading-none drop-shadow max-[640px]:text-[34px]">최신 뉴스</h1>
          <p className="m-0 mt-6 text-[15px] font-semibold text-white max-[640px]:mt-4 max-[640px]:text-sm">
            최신 제품 정보, 전시회, 회사 소식을 확인하세요.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1250px] px-5 pb-16 pt-7">
        <div className="flex items-center justify-between border-b border-[#cfcfcf] pb-5 max-[640px]:items-start">
          <h2 className="m-0 text-[28px] font-bold text-[#555]">뉴스</h2>
          <nav className="text-sm text-[#444] max-[640px]:hidden" aria-label="Breadcrumb">
            <button type="button" className="text-[#e5322d]" onClick={() => onNavigate('home')}>» 홈</button>
            <span className="mx-3 text-[#999]">&gt;</span>
            <span>뉴스</span>
            <span className="mx-3 text-[#999]">&gt;</span>
            <strong className="font-medium">신제품</strong>
          </nav>
        </div>

        <div className="grid gap-12 pt-11 lg:grid-cols-[300px_minmax(0,1fr)] max-[980px]:gap-6 max-[980px]:pt-7">
          <aside className="max-[980px]:order-2">
            <nav className="border-t border-[#cfcfcf]" aria-label="News category">
              {NEWS_CATEGORIES.map((label) => {
                const active = label === '신제품'
                return (
                  <button
                    key={label}
                    type="button"
                    className={`block h-[42px] w-full border-b border-[#cfcfcf] px-5 text-left text-[15px] transition ${
                      active ? 'bg-[#ee2d27] font-bold text-white' : 'bg-[#efefef] text-[#333] hover:bg-[#e7e7e7]'
                    }`}
                  >
                    <span className="mr-2">{active ? '›' : '›'}</span>
                    {label}
                  </button>
                )
              })}
            </nav>

            <label className="mt-4 flex h-[43px] overflow-hidden rounded-[3px] border border-[#c8c8c8] bg-white">
              <span className="sr-only">뉴스 검색</span>
              <input
                type="text"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="뉴스 검색"
                className="min-w-0 flex-1 border-0 px-4 text-[14px] text-[#555] outline-none"
              />
              <span className="grid w-49px w-[49px] place-items-center bg-[#b7b7b7] text-white" aria-hidden="true">
                <i className="fa-solid fa-magnifying-glass text-sm"></i>
              </span>
            </label>
          </aside>

          <main>
            {routeArticleId ? (
              activeArticle && hasTranslatedArticle(activeArticle) ? (
              <article id="news-translated-article" className="overflow-hidden bg-white shadow-[0_18px_42px_-34px_rgba(15,23,42,0.3)]">
                {activeArticle.image ? (
                  <div className="aspect-[16/7] bg-slate-100 max-[700px]:aspect-[16/10]">
                    <img src={activeArticle.image} alt={activeArticle.title} className="h-full w-full object-cover" onError={handleNewsImageError} />
                  </div>
                ) : null}
                <div className="px-7 py-7 max-[700px]:px-5">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-[#c9252f]">
                    <span>{formatNewsDate(activeArticle.date)}</span>
                    <span className="text-[#cfcfcf]">|</span>
                    <span>{activeArticle.sourceLabel || 'MEAN WELL 공식'}</span>
                    <span className="rounded-full bg-[#fff1f1] px-2.5 py-1 text-[11px] font-black text-[#c9252f]">한국어 번역</span>
                  </div>
                  <h3 className="m-0 mt-4 text-[30px] font-black leading-tight text-[#222] max-[700px]:text-[22px]">{activeArticle.title}</h3>
                  {activeArticle.summary ? <p className="m-0 mt-4 text-[16px] font-semibold leading-7 text-[#555]">{activeArticle.summary}</p> : null}

                  {activeArticle.keyPoints?.length ? (
                    <div className="mt-6 bg-[#fff8f8] px-5 py-4">
                      <p className="m-0 mb-3 text-sm font-black text-[#c9252f]">핵심 내용</p>
                      <ul className="m-0 grid gap-2 p-0">
                        {activeArticle.keyPoints.map((point) => (
                          <li key={point} className="flex gap-2 text-sm font-semibold leading-6 text-[#444]">
                            <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9252f]"></span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {activeArticle.body?.length ? (
                    <div className="mt-6 grid gap-4">
                      {activeArticle.body.map((paragraph) => (
                        <p key={paragraph} className="m-0 text-[15px] leading-8 text-[#444]">{paragraph}</p>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-7 flex flex-wrap gap-3">
                    <a
                      href={getArticleUrl(activeArticle)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center rounded-full bg-[#c9252f] px-4 text-sm font-bold text-white transition hover:bg-[#b71f28]"
                    >
                      원문 보기
                    </a>
                    <button
                      type="button"
                      className="inline-flex h-10 items-center rounded-full bg-slate-100 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                      onClick={() => onNavigate('news')}
                    >
                      목록으로
                    </button>
                  </div>
                </div>
              </article>
              ) : (
                <div className="bg-white px-6 py-16 text-center shadow-[0_18px_42px_-34px_rgba(15,23,42,0.3)]">
                  <p className="m-0 text-xl font-black text-[#222]">번역 뉴스가 없습니다.</p>
                  <p className="m-0 mt-3 text-sm font-semibold text-[#777]">목록에서 MEAN WELL 공식 뉴스를 다시 선택해 주세요.</p>
                  <button type="button" className="mt-6 h-10 rounded-full bg-[#c9252f] px-4 text-sm font-bold text-white" onClick={() => onNavigate('news')}>
                    목록으로
                  </button>
                </div>
              )
            ) : (
              <>

            <div className="flex items-end justify-between border-b border-[#cfcfcf] pb-4">
              <h3 className="m-0 text-[24px] font-bold text-[#555]">
                신제품
                <i className="fa-solid fa-square-rss ml-1 text-[13px] text-orange-500" aria-hidden="true"></i>
              </h3>
              <span className="text-sm text-[#777]">총 {filteredArticles.length}건</span>
            </div>

            {isLoadingArticles ? <p className="m-0 mt-5 text-sm font-semibold text-[#777]">뉴스 데이터를 불러오는 중입니다...</p> : null}
            {loadError ? <p className="m-0 mt-2 text-sm font-semibold text-[#b42323]">{loadError}</p> : null}

            {filteredArticles.length ? (
              <div className="mt-8 overflow-hidden border-t border-[#e0e0e0]">
                <div className="grid grid-cols-[130px_140px_minmax(0,1fr)] bg-[#eee] text-[15px] text-[#555] max-[700px]:hidden">
                  <div className="px-5 py-3">
                    <span className="text-[#e5322d]">›</span> 등록일
                  </div>
                  <div className="px-4 py-3">사진</div>
                  <div className="px-4 py-3">제목</div>
                </div>

                <div className="divide-y divide-[#e0e0e0]">
                  {filteredArticles.map((item) => (
                    <article key={item.id} className="grid min-h-[128px] grid-cols-[130px_140px_minmax(0,1fr)] items-center bg-[#fafafa] transition hover:bg-white max-[700px]:grid-cols-[96px_minmax(0,1fr)] max-[700px]:gap-3 max-[700px]:px-3 max-[700px]:py-4">
                      <div className="px-5 text-[15px] leading-6 text-[#333] max-[700px]:px-0">
                        <span className="mr-2 text-[#e5322d]">›</span>
                        {formatNewsDate(item.date)}
                      </div>
                      <a
                        href={getArticleUrl(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block overflow-hidden rounded-[5px] bg-slate-100 max-[700px]:row-span-2"
                        onClick={(event) => handleArticleOpen(event, item)}
                      >
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="h-[82px] w-[112px] object-cover max-[700px]:h-[72px] max-[700px]:w-[96px]" onError={handleNewsImageError} />
                        ) : (
                          <div className="grid h-[82px] w-[112px] place-items-center text-[11px] font-bold text-slate-400 max-[700px]:h-[72px] max-[700px]:w-[96px]">이미지 없음</div>
                        )}
                      </a>
                      <div className="px-4 max-[700px]:px-0">
                        <a
                          href={getArticleUrl(item)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[15px] leading-6 text-[#333] transition hover:text-[#e5322d]"
                          onClick={(event) => handleArticleOpen(event, item)}
                        >
                          {item.title}
                        </a>
                        {hasTranslatedArticle(item) ? <p className="m-0 mt-1 text-xs font-bold text-[#c9252f]">한국어 번역 보기</p> : null}
                        <p className="m-0 mt-2 hidden text-sm leading-6 text-[#777] max-[700px]:block">{item.summary}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-8 border border-dashed border-[#d0d0d0] bg-[#fafafa] px-6 py-14 text-center">
                <p className="m-0 text-lg font-bold text-[#333]">조건에 맞는 뉴스가 없습니다.</p>
                <p className="m-0 mt-2 text-sm text-[#777]">검색어를 바꿔 다시 확인해 주세요.</p>
              </div>
            )}
              </>
            )}
          </main>
        </div>
      </div>
    </section>
  )
}
