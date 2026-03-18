import { useEffect, useMemo, useState } from 'react'
import { NEWS_ALL_CATEGORY, formatNewsDate, getNewsByCategory, getNewsById, newsCategories } from '../data/newsContent'

const PAGE_SIZE = 5

function clampPage(page, totalPages) {
  if (totalPages <= 0) return 1
  return Math.min(Math.max(page, 1), totalPages)
}

export function NewsView({ isActive, onNavigate, externalNewsRequest }) {
  const [activeCategory, setActiveCategory] = useState(NEWS_ALL_CATEGORY)
  const [keyword, setKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [activeArticleId, setActiveArticleId] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const categoryArticles = useMemo(() => getNewsByCategory(activeCategory), [activeCategory])

  const filteredArticles = useMemo(() => {
    const term = keyword.trim().toLowerCase()
    if (!term) return categoryArticles

    return categoryArticles.filter((article) => {
      const haystack = `${article.title} ${article.summary ?? ''}`.toLowerCase()
      return haystack.includes(term)
    })
  }, [categoryArticles, keyword])

  const totalPages = Math.ceil(filteredArticles.length / PAGE_SIZE)

  useEffect(() => {
    setCurrentPage((prev) => clampPage(prev, totalPages))
  }, [totalPages])

  const pagedArticles = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredArticles.slice(start, start + PAGE_SIZE)
  }, [filteredArticles, currentPage])

  const activeArticle = useMemo(() => {
    if (!activeArticleId) return null
    return filteredArticles.find((article) => article.id === activeArticleId) ?? categoryArticles.find((article) => article.id === activeArticleId) ?? null
  }, [activeArticleId, filteredArticles, categoryArticles])

  const categoryArticleIndex = useMemo(() => {
    if (!activeArticle) return -1
    return categoryArticles.findIndex((article) => article.id === activeArticle.id)
  }, [categoryArticles, activeArticle])

  const prevArticle = categoryArticleIndex > 0 ? categoryArticles[categoryArticleIndex - 1] : null
  const nextArticle =
    categoryArticleIndex >= 0 && categoryArticleIndex < categoryArticles.length - 1
      ? categoryArticles[categoryArticleIndex + 1]
      : null

  useEffect(() => {
    if (!externalNewsRequest) return

    const target = getNewsById(externalNewsRequest.articleId)
    if (!target) return

    const nextCategory = newsCategories.includes(externalNewsRequest.category)
      ? externalNewsRequest.category
      : NEWS_ALL_CATEGORY

    setActiveCategory(nextCategory)
    setActiveArticleId(target.id)
    setIsDetailOpen(true)
    setCurrentPage(1)
  }, [externalNewsRequest])

  useEffect(() => {
    if (!activeArticleId) return

    const index = filteredArticles.findIndex((article) => article.id === activeArticleId)
    if (index < 0) return

    setCurrentPage(Math.floor(index / PAGE_SIZE) + 1)
  }, [filteredArticles, activeArticleId])

  const pageNumbers = useMemo(() => Array.from({ length: totalPages }, (_, idx) => idx + 1), [totalPages])

  return (
    <section
      className={`${isActive ? '' : 'is-hidden'} bg-[#efefef] text-[#505050]`}
      id="news-page"
      style={{ fontFamily: 'Microsoft JhengHei, "Malgun Gothic", "Apple SD Gothic Neo", Arial, sans-serif' }}
    >
      <div className="relative h-[350px] overflow-hidden">
        <img src="/meanwell/news/news-hero.jpg" alt="" className="h-full w-full object-cover object-center" />
      </div>

      <header className="mx-auto w-full max-w-[1280px] px-[15px] pt-[14px]">
        <div className="relative border-b border-[#c8c8c8] pb-[12px]">
          <h1 className="m-0 text-[44px] font-semibold text-[#4b4b4b]">뉴스</h1>
          <ol className="absolute right-0 top-1/2 m-0 hidden -translate-y-1/2 list-none items-center gap-2 p-0 text-[14px] text-[#666] lg:flex">
            <li className="text-[#d63a33]">»</li>
            <li>Home</li>
            <li className="text-[#888]">&gt;</li>
            <li>뉴스</li>
            <li className="text-[#888]">&gt;</li>
            <li>{activeCategory}</li>
          </ol>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1280px] px-[15px] pb-[72px] pt-[20px]">
        <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-[40px]">
          <aside className="hidden lg:block">
            <ul className="m-0 list-none border border-[#d0d0d0] bg-[#efefef] p-0">
              {newsCategories.map((category) => {
                const isActiveCategory = category === activeCategory
                return (
                  <li key={category} className="border-b border-[#d0d0d0] last:border-b-0">
                    <button
                      type="button"
                      className={`appearance-none border-0 flex h-[42px] w-full items-center px-4 text-left text-[14px] ${
                        isActiveCategory ? 'bg-[#e72e25] font-semibold text-white' : 'bg-[#efefef] text-[#424242] hover:bg-[#f7f7f7]'
                      }`}
                      onClick={() => {
                        setActiveCategory(category)
                        setCurrentPage(1)
                        setActiveArticleId(null)
                        setIsDetailOpen(false)
                      }}
                    >
                      <span className="mr-2 text-[12px]">›</span>
                      <span>{category}</span>
                    </button>
                  </li>
                )
              })}
            </ul>

            <div className="mt-3 flex h-[40px] overflow-hidden rounded border border-[#cdcdcd] bg-white">
              <input
                type="text"
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value)
                  setCurrentPage(1)
                  setIsDetailOpen(false)
                }}
                placeholder="News Search.."
                className="h-full w-full border-0 bg-transparent px-3 text-[13px] text-[#444] outline-none"
              />
              <button type="button" className="appearance-none border-0 grid h-full w-[40px] place-items-center bg-[#b5b5b5] text-white" aria-label="Search news">
                <i className="fa-solid fa-magnifying-glass text-[12px]" aria-hidden="true"></i>
              </button>
            </div>
          </aside>

          <article className="min-w-0">
            <div className="flex items-center justify-between border-b border-[#c8c8c8] pb-[10px]">
              <h2 className="m-0 text-[26px] font-semibold text-[#4b4b4b]">{activeCategory}</h2>
              <button type="button" className="appearance-none border-0 bg-transparent p-0 text-[13px] text-[#666]" onClick={() => onNavigate('home')}>
                ↩ Back
              </button>
            </div>

            {isDetailOpen && activeArticle ? (
              <div className="mt-4 rounded-sm border border-[#dcdcdc] bg-[#f9f9f9] p-4">
                <div className="mb-3 flex items-center justify-between border-b border-[#dddddd] pb-2">
                  <button type="button" className="appearance-none border-0 bg-transparent p-0 text-[13px] text-[#555]" onClick={() => setIsDetailOpen(false)}>
                    ↩ 목록으로
                  </button>
                  <div className="flex items-center gap-1.5">
                    <a href={`mailto:?subject=${encodeURIComponent(activeArticle.title)}`} className="inline-grid h-[28px] w-[28px] place-items-center rounded-full bg-[#777] text-[12px] text-white">
                      <i className="fa-solid fa-envelope" aria-hidden="true"></i>
                    </a>
                    <a href="#" onClick={(event) => event.preventDefault()} className="inline-grid h-[28px] w-[28px] place-items-center rounded-full bg-[#777] text-[12px] text-white">
                      <i className="fa-brands fa-facebook-f" aria-hidden="true"></i>
                    </a>
                  </div>
                </div>

                <h3 className="m-0 text-[32px] font-semibold leading-[1.35] text-[#4b4b4b]">{activeArticle.title}</h3>
                <p className="m-0 mt-2 text-[24px] text-[#666]">Date : {formatNewsDate(activeArticle.date)}</p>
                <div className="mt-4 text-right">
                  <strong className="block text-[13px] text-[#555]">{activeArticle.author}</strong>
                  <a href={`mailto:${activeArticle.email}`} className="text-[12px] text-[#555] underline">
                    {activeArticle.email}
                  </a>
                </div>

                <div className="mt-5 text-[13px] leading-[1.9] text-[#555]">
                  <p>{activeArticle.summary}</p>
                  {activeArticle.paragraphs?.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>

                {activeArticle.image ? (
                  <figure className="mx-auto mt-5 max-w-[700px]">
                    <img src={activeArticle.image} alt={activeArticle.title} className="block w-full rounded-sm border border-[#d6d6d6]" />
                    <figcaption className="mt-2 text-center text-[12px] text-[#777]">{activeArticle.imageCaption ?? activeArticle.title}</figcaption>
                  </figure>
                ) : null}

                {activeArticle.bullets?.length ? (
                  <ul className="mt-5 list-disc pl-5 text-[13px] text-[#555]">
                    {activeArticle.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}

                {activeArticle.articleUrl ? (
                  <p className="mt-5 text-[13px] text-[#666]">
                    For more detailed information, please refer to the full{' '}
                    <a href={activeArticle.articleUrl} target="_blank" rel="noopener noreferrer" className="text-[#1f5dd2] underline">
                      article
                    </a>
                  </p>
                ) : null}

                <div className="mt-6 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    className="appearance-none rounded border border-[#cfcfcf] bg-white px-3 py-1 text-[12px] text-[#666] disabled:opacity-40"
                    onClick={() => {
                      if (!prevArticle) return
                      setActiveArticleId(prevArticle.id)
                    }}
                    disabled={!prevArticle}
                  >
                    Prev Article
                  </button>
                  <button
                    type="button"
                    className="appearance-none rounded border border-[#cfcfcf] bg-white px-3 py-1 text-[12px] text-[#666] disabled:opacity-40"
                    onClick={() => {
                      if (!nextArticle) return
                      setActiveArticleId(nextArticle.id)
                    }}
                    disabled={!nextArticle}
                  >
                    Next Article
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-4 rounded-sm border border-[#dcdcdc] bg-[#f4f4f4]">
                  <div className="grid grid-cols-[130px_110px_1fr] items-center border-b border-[#dfdfdf] bg-[#e9e9e9] px-3 py-2 text-[13px] text-[#5a5a5a]">
                    <span>Date</span>
                    <span>Photo</span>
                    <span>Title</span>
                  </div>

                  {pagedArticles.length ? (
                    <ul className="m-0 list-none p-0">
                      {pagedArticles.map((article) => (
                        <li key={article.id} className="border-b border-[#e1e1e1] last:border-b-0">
                          <button
                            type="button"
                            className={`appearance-none border-0 grid w-full grid-cols-[130px_110px_1fr] items-center gap-0 px-3 py-3 text-left transition ${
                              article.id === activeArticleId ? 'bg-[#fff1f0]' : 'bg-[#f8f8f8] hover:bg-[#f1f1f1]'
                            }`}
                            onClick={() => {
                              setActiveArticleId(article.id)
                              setIsDetailOpen(true)
                            }}
                          >
                            <span className="text-[14px] text-[#5f5f5f]">
                              <span className="mr-1.5 text-[11px]">›</span>
                              {formatNewsDate(article.date)}
                            </span>
                            <span>
                              <img src={article.image ?? '/meanwell/index_1.jpg'} alt={article.title} className="h-[62px] w-[92px] rounded-sm border border-[#d9d9d9] object-cover" />
                            </span>
                            <span className="pr-2 text-[13px] leading-[1.45] text-[#444]">{article.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-4 py-8 text-center text-[14px] text-[#6a6a6a]">검색 결과가 없습니다.</div>
                  )}
                </div>

                {totalPages > 1 ? (
                  <div className="mt-4 flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      className="appearance-none grid h-7 w-7 place-items-center rounded-full border border-[#d1d1d1] bg-[#f4f4f4] text-[11px] text-[#9a9a9a] disabled:opacity-40"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      aria-label="First page"
                    >
                      «
                    </button>
                    <button
                      type="button"
                      className="appearance-none grid h-7 w-7 place-items-center rounded-full border border-[#d1d1d1] bg-[#f4f4f4] text-[11px] text-[#9a9a9a] disabled:opacity-40"
                      onClick={() => setCurrentPage((prev) => clampPage(prev - 1, totalPages))}
                      disabled={currentPage === 1}
                      aria-label="Previous page"
                    >
                      ‹
                    </button>

                    {pageNumbers.map((pageNo) => (
                      <button
                        key={`page-${pageNo}`}
                        type="button"
                        className={`appearance-none grid h-7 w-7 place-items-center rounded-full border text-[11px] ${
                          pageNo === currentPage ? 'border-[#e72e25] bg-[#e72e25] text-white' : 'border-[#d1d1d1] bg-[#f4f4f4] text-[#666]'
                        }`}
                        onClick={() => setCurrentPage(pageNo)}
                      >
                        {pageNo}
                      </button>
                    ))}

                    <button
                      type="button"
                      className="appearance-none grid h-7 w-7 place-items-center rounded-full border border-[#d1d1d1] bg-[#f4f4f4] text-[11px] text-[#9a9a9a] disabled:opacity-40"
                      onClick={() => setCurrentPage((prev) => clampPage(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      aria-label="Next page"
                    >
                      ›
                    </button>
                    <button
                      type="button"
                      className="appearance-none grid h-7 w-7 place-items-center rounded-full border border-[#d1d1d1] bg-[#f4f4f4] text-[11px] text-[#9a9a9a] disabled:opacity-40"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      aria-label="Last page"
                    >
                      »
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </article>
        </div>
      </div>
    </section>
  )
}
