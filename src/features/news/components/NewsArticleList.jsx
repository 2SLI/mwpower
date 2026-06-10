import { NEWS_FALLBACK_IMAGE, formatNewsDate } from '../../../data/newsContent'
import { inferNewsCategory } from '../../newsCategory'

function handleNewsImageError(event) {
  const image = event.currentTarget
  if (!image || image.dataset.fallbackApplied === 'true') return
  image.dataset.fallbackApplied = 'true'
  image.src = NEWS_FALLBACK_IMAGE
}

export function NewsArticleList({
  articles,
  getArticleUrl,
  onArticleClick,
  hasTranslatedArticle,
  emptyTitle = '조건에 맞는 뉴스가 없습니다.',
  emptyDescription = '검색어를 바꿔 다시 확인해 주세요.',
}) {
  if (!articles.length) {
    return (
      <div className="mt-8 border border-dashed border-[#d0d0d0] bg-[#fafafa] px-6 py-14 text-center">
        <p className="m-0 text-lg font-bold text-[#333]">{emptyTitle}</p>
        <p className="m-0 mt-2 text-sm text-[#777]">{emptyDescription}</p>
      </div>
    )
  }

  return (
    <div className="mt-8 overflow-hidden border-t border-[#e0e0e0]">
      <div className="grid grid-cols-[130px_140px_minmax(0,1fr)] bg-[#eee] text-[15px] text-[#555] max-[700px]:hidden">
        <div className="px-5 py-3">
          <span className="text-[#e5322d]">›</span> 등록일
        </div>
        <div className="px-4 py-3">사진</div>
        <div className="px-4 py-3">제목</div>
      </div>

      <div className="divide-y divide-[#e0e0e0]">
        {articles.map((item) => {
          const articleUrl = getArticleUrl(item)
          const translated = hasTranslatedArticle?.(item)

          return (
            <article key={item.id} className="grid min-h-[128px] grid-cols-[130px_140px_minmax(0,1fr)] items-center bg-[#fafafa] transition hover:bg-white max-[700px]:grid-cols-[96px_minmax(0,1fr)] max-[700px]:gap-3 max-[700px]:px-3 max-[700px]:py-4">
              <div className="px-5 text-[15px] leading-6 text-[#333] max-[700px]:px-0">
                <span className="mr-2 text-[#e5322d]">›</span>
                {formatNewsDate(item.date)}
              </div>
              <a
                href={articleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-[82px] w-full overflow-hidden rounded-[5px] bg-slate-100 max-[700px]:row-span-2 max-[700px]:h-[72px] max-[700px]:w-[96px]"
                onClick={(event) => onArticleClick?.(event, item)}
              >
                {item.image ? (
                  <img src={item.image} alt={item.title} className="h-full w-full object-cover" onError={handleNewsImageError} />
                ) : (
                  <div className="grid h-full w-full place-items-center text-[11px] font-bold text-slate-400">이미지 없음</div>
                )}
              </a>
              <div className="px-4 max-[700px]:px-0">
                <a
                  href={articleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[15px] leading-6 text-[#333] transition hover:text-[#e5322d]"
                  onClick={(event) => onArticleClick?.(event, item)}
                >
                  {item.title}
                </a>
                <p className="m-0 mt-1 text-xs font-bold text-[#777]">{inferNewsCategory(item)}</p>
                {translated ? <p className="m-0 mt-1 text-xs font-bold text-[#c9252f]">한국어 번역 보기</p> : null}
                <p className="m-0 mt-2 hidden text-sm leading-6 text-[#777] max-[700px]:block">{item.summary}</p>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
