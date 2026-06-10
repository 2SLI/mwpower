import { useMemo, useState } from 'react'
import { NewsArticleList } from '../../news/components/NewsArticleList'
import { NEWS_CATEGORIES, inferNewsCategory, normalizeNewsCategory } from '../../newsCategory'
import { getArticleUrl, hasTranslatedArticle } from '../../news/newsArticleUtils'

export function NewsPreviewSection({ newsItems, newsPreviewError, onNavigate, onOpenNews }) {
  const [keyword, setKeyword] = useState('')
  const [activeCategory, setActiveCategory] = useState('신제품')

  const filteredArticles = useMemo(() => {
    const term = keyword.trim().toLowerCase()
    const category = normalizeNewsCategory(activeCategory)
    const categoryArticles = category ? newsItems.filter((item) => inferNewsCategory(item) === category) : newsItems
    if (!term) return categoryArticles

    return categoryArticles.filter((item) => {
      const haystack = `${item.title} ${item.summary ?? ''} ${item.originalTitle ?? ''} ${item.sourceLabel ?? ''} ${inferNewsCategory(item)}`.toLowerCase()
      return haystack.includes(term)
    })
  }, [newsItems, keyword, activeCategory])

  const categoryCounts = useMemo(
    () =>
      NEWS_CATEGORIES.reduce((counts, label) => {
        counts[label] = newsItems.filter((item) => inferNewsCategory(item) === label).length
        return counts
      }, {}),
    [newsItems]
  )

  return (
    <section className="w-full border-t border-slate-100 bg-white text-[#333]" aria-label="뉴스">
      <div className="relative h-[220px] overflow-hidden bg-slate-900 max-[640px]:h-[170px]">
        <img src="/meanwell/news/news-hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-black/55"></div>
        <div className="relative mx-auto flex h-full max-w-[1250px] flex-col justify-center px-5 text-white md:px-8">
          <p className="m-0 text-[12px] font-bold uppercase tracking-[0.16em] text-rose-200">MWPOWER News</p>
          <h2 className="m-0 mt-3 text-[clamp(2rem,4vw,3.25rem)] font-bold leading-none drop-shadow">최신 뉴스</h2>
          <p className="m-0 mt-5 text-[15px] font-semibold text-white max-[640px]:mt-3 max-[640px]:text-sm">
            신제품, 기술자료, 단종모델 정보를 확인하세요.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1250px] px-5 pb-16 pt-7">
        <header className="flex items-center justify-between border-b border-[#cfcfcf] pb-5 max-[640px]:items-start">
          <h2 className="m-0 text-[28px] font-bold text-[#555]">뉴스</h2>
          <nav className="text-sm text-[#444] max-[640px]:hidden" aria-label="Breadcrumb">
            <button type="button" className="text-[#e5322d]" onClick={() => onNavigate('home')}>» 홈</button>
            <span className="mx-3 text-[#999]">&gt;</span>
            <span>뉴스</span>
            <span className="mx-3 text-[#999]">&gt;</span>
            <strong className="font-medium">{activeCategory}</strong>
          </nav>
        </header>

        <div className="grid gap-12 pt-11 lg:grid-cols-[300px_minmax(0,1fr)] max-[980px]:gap-6 max-[980px]:pt-7">
          <aside className="max-[980px]:order-2">
            <nav className="border-t border-[#cfcfcf]" aria-label="News category">
              {NEWS_CATEGORIES.map((label) => {
                const active = label === activeCategory
                return (
                  <button
                    key={label}
                    type="button"
                    className={`block h-[42px] w-full border-b border-[#cfcfcf] px-5 text-left text-[15px] transition ${
                      active ? 'bg-[#ee2d27] font-bold text-white' : 'bg-[#efefef] text-[#333] hover:bg-[#e7e7e7]'
                    }`}
                    onClick={() => setActiveCategory(label)}
                  >
                    <span className="mr-2">›</span>
                    {label}
                    <span className={`float-right text-xs ${active ? 'text-white/80' : 'text-[#777]'}`}>{categoryCounts[label] ?? 0}</span>
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
              <span className="grid w-[49px] place-items-center bg-[#b7b7b7] text-white" aria-hidden="true">
                <i className="fa-solid fa-magnifying-glass text-sm"></i>
              </span>
            </label>
          </aside>

          <main>
            <div className="flex items-end justify-between border-b border-[#cfcfcf] pb-4">
              <h3 className="m-0 text-[24px] font-bold text-[#555]">
                {activeCategory}
                <i className="fa-solid fa-square-rss ml-1 text-[13px] text-orange-500" aria-hidden="true"></i>
              </h3>
              <span className="text-sm text-[#777]">총 {filteredArticles.length}건</span>
            </div>

            {newsPreviewError ? <p className="m-0 mt-2 text-sm font-semibold text-[#b42323]">{newsPreviewError}</p> : null}
            <NewsArticleList
              articles={filteredArticles}
              getArticleUrl={getArticleUrl}
              onArticleClick={(event, article) => {
                event.preventDefault()
                onOpenNews(article)
              }}
              hasTranslatedArticle={hasTranslatedArticle}
              emptyTitle="조건에 맞는 뉴스가 없습니다."
              emptyDescription="검색어를 바꿔 다시 확인해 주세요."
            />
          </main>
        </div>
      </div>
    </section>
  )
}
