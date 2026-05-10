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

export function NewsView({ isActive, onNavigate, externalNewsRequest }) {
  const [articles, setArticles] = useState(() => normalizeNewsItems(getAllNewsSorted()))
  const [keyword, setKeyword] = useState('')
  const [activeArticleId, setActiveArticleId] = useState(null)
  const [isLoadingArticles, setIsLoadingArticles] = useState(false)
  const [loadError, setLoadError] = useState('')

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
      const haystack = `${item.title} ${item.summary ?? ''} ${item.sourceLabel ?? ''}`.toLowerCase()
      return haystack.includes(term)
    })
  }, [articles, keyword])

  useEffect(() => {
    if (!filteredArticles.length) {
      setActiveArticleId(null)
      return
    }

    if (!filteredArticles.some((item) => item.id === activeArticleId)) {
      setActiveArticleId(filteredArticles[0].id)
    }
  }, [filteredArticles, activeArticleId])

  useEffect(() => {
    if (!externalNewsRequest) return
    const target = getArticleById(articles, externalNewsRequest.articleId)
    if (!target) return
    setActiveArticleId(target.id)
  }, [externalNewsRequest, articles])

  const activeArticle = useMemo(() => {
    if (!activeArticleId) return filteredArticles[0] ?? null
    return filteredArticles.find((item) => item.id === activeArticleId) ?? filteredArticles[0] ?? null
  }, [activeArticleId, filteredArticles])

  return (
    <section className={`${isActive ? '' : 'is-hidden'} bg-[#f5f7fa] text-slate-700`} id="news-page">
      <div className="relative overflow-hidden bg-slate-950">
        <img src="/meanwell/news/news-hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(8,15,26,0.96)_0%,rgba(14,34,56,0.9)_48%,rgba(201,37,47,0.72)_100%)]"></div>

        <div className="relative mx-auto w-full max-w-[1540px] px-5 py-14 text-white md:px-8 md:py-16">
          <p className="m-0 text-[11px] font-black uppercase tracking-[0.18em] text-rose-200">NEWS</p>
          <h1 className="m-0 mt-3 text-[clamp(2.2rem,4vw,4.4rem)] font-black tracking-[-0.03em]">최신 뉴스</h1>
          <p className="m-0 mt-4 max-w-[60ch] text-sm leading-7 text-slate-100 md:text-base">
            블로그, 티스토리, 제품 적용 소식을 한눈에 볼 수 있도록 썸네일과 요약 중심의 미리보기 형태로 구성했습니다.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              className="inline-flex h-11 items-center rounded-full bg-[#e5332a] px-5 text-sm font-extrabold text-white shadow-[0_18px_38px_rgba(229,51,42,0.32)] transition hover:bg-[#cb2b23]"
              onClick={() => onNavigate('home')}
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1540px] px-5 pb-14 pt-6 md:px-8 md:pb-16">
        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_20px_50px_-32px_rgba(15,23,42,0.34)] md:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="m-0 text-[11px] font-black uppercase tracking-[0.14em] text-[#c9252f]">News Preview</p>
              <h2 className="m-0 mt-2 text-[1.8rem] font-black tracking-[-0.03em] text-slate-900 md:text-[2.2rem]">썸네일과 요약으로 먼저 확인하세요.</h2>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <label className="flex h-11 min-w-[min(100%,320px)] items-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 px-4">
                <i className="fa-solid fa-magnifying-glass text-sm text-slate-400" aria-hidden="true"></i>
                <input
                  type="text"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="제목 또는 요약 검색"
                  className="h-full w-full border-0 bg-transparent px-3 text-sm text-slate-700 outline-none"
                />
              </label>
              <span className="inline-flex h-11 items-center rounded-full bg-[#fff4f4] px-4 text-sm font-black text-[#c9252f]">
                총 {filteredArticles.length}개 뉴스
              </span>
            </div>
          </div>
        </div>

        {activeArticle ? (
          <article className="mt-6 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_20px_50px_-32px_rgba(15,23,42,0.34)] lg:grid lg:grid-cols-[1.05fr_0.95fr]">
            <a
              href={activeArticle.articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative block min-h-[280px] overflow-hidden bg-slate-100"
              aria-label={`${activeArticle.title} 원문 보기`}
            >
              {activeArticle.image ? (
                <img
                  src={activeArticle.image}
                  alt={activeArticle.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={handleNewsImageError}
                />
              ) : (
                <div className="grid h-full min-h-[280px] place-items-center text-sm font-black text-slate-400">NO IMAGE</div>
              )}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.05)_0%,rgba(15,23,42,0.7)_100%)]"></div>
            </a>

            <div className="grid gap-4 p-6 md:p-7">
              <div>
                <p className="m-0 text-[11px] font-black uppercase tracking-[0.14em] text-[#c9252f]">Featured News</p>
                <h3 className="m-0 mt-3 text-[clamp(1.7rem,2.4vw,2.8rem)] font-black leading-tight tracking-[-0.03em] text-slate-900">
                  {activeArticle.title}
                </h3>
                <p className="m-0 mt-4 text-sm leading-7 text-slate-600">{activeArticle.summary || '등록된 요약이 없습니다.'}</p>
              </div>

              <div className="grid gap-2 rounded-2xl bg-slate-50 p-4 text-sm">
                <p className="m-0">
                  <strong className="text-slate-900">등록일:</strong> {formatNewsDate(activeArticle.date)}
                </p>
                <p className="m-0">
                  <strong className="text-slate-900">출처:</strong> {activeArticle.sourceLabel || '외부 뉴스'}
                </p>
              </div>
            </div>
          </article>
        ) : (
          <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
            <p className="m-0 text-lg font-black text-slate-900">등록된 뉴스가 없습니다.</p>
            <p className="m-0 mt-2 text-sm font-semibold text-slate-500">관리자에서 뉴스 링크와 썸네일을 등록하면 이 영역에 미리보기가 표시됩니다.</p>
          </div>
        )}

        {isLoadingArticles ? <p className="m-0 mt-5 text-sm font-semibold text-slate-500">뉴스 데이터를 불러오는 중입니다...</p> : null}
        {loadError ? <p className="m-0 mt-2 text-sm font-semibold text-[#b42323]">{loadError}</p> : null}

        {filteredArticles.length ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredArticles.map((item) => {
              const isActiveCard = item.id === activeArticle?.id

              return (
                <article
                  key={item.id}
                  className={`group overflow-hidden rounded-[24px] border bg-white transition ${
                    isActiveCard
                      ? 'border-[#d43a31] shadow-[0_20px_48px_-30px_rgba(212,58,49,0.55)]'
                      : 'border-slate-200/80 shadow-[0_16px_42px_-34px_rgba(15,23,42,0.45)] hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_22px_48px_-32px_rgba(15,23,42,0.55)]'
                  }`}
                >
                  <a
                    href={item.articleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative block aspect-[16/10] overflow-hidden bg-slate-100"
                    aria-label={`${item.title} 원문 보기`}
                  >
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" onError={handleNewsImageError} />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-sm font-black text-slate-400">NO IMAGE</div>
                    )}
                  </a>

                  <button type="button" className="block w-full min-h-[190px] p-5 text-left" onClick={() => setActiveArticleId(item.id)}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="m-0 shrink-0 text-[13px] font-black tracking-[0.12em] text-[#c9252f]">{formatNewsDate(item.date)}</p>
                      <span className="min-w-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500">{item.sourceLabel || '외부 뉴스'}</span>
                    </div>
                    <h4
                      className="m-0 mt-3 text-[1.12rem] font-black leading-[1.35] text-slate-900"
                      style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    >
                      {item.title}
                    </h4>
                    <p
                      className="m-0 mt-3 text-[14px] font-medium leading-6 text-slate-500"
                      style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    >
                      {item.summary || '요약이 등록되지 않은 뉴스입니다.'}
                    </p>
                  </button>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
            <p className="m-0 text-lg font-black text-slate-900">조건에 맞는 뉴스가 없습니다.</p>
            <p className="m-0 mt-2 text-sm font-semibold text-slate-500">검색어를 바꿔 다시 확인해 주세요.</p>
          </div>
        )}
      </div>
    </section>
  )
}
