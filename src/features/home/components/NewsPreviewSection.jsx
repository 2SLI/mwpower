import { formatNewsDate } from '../../../data/newsContent'
import { handleNewsImageError } from '../homeUtils'

export function NewsPreviewSection({ visibleNews, newsPreviewError, onNavigate, onOpenNews }) {
  return (
    <section className="w-full border-t border-slate-100 bg-white py-10 md:py-14" aria-label="뉴스">
      <div className="mx-auto w-full max-w-[1540px] px-5 md:px-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="m-0 text-[11px] font-bold uppercase tracking-[0.14em] text-[#d7322a]">뉴스</p>
            <h2 className="mt-2 text-[clamp(1.55rem,2.1vw,2.35rem)] font-bold text-slate-900">최신 뉴스 미리보기</h2>
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
                  onClick={() => onOpenNews(item)}
                >
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" onError={handleNewsImageError} />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-sm font-black text-slate-400">이미지 없음</div>
                  )}
                </button>
                <button type="button" className="block min-h-[128px] w-full bg-white px-5 py-4 text-left" onClick={() => onOpenNews(item)}>
                  <div className="flex items-center justify-between gap-3">
                    <time className="shrink-0 text-[13px] font-bold tracking-[0.1em] text-[#c9252f]">{formatNewsDate(item.date)}</time>
                    <span className="min-w-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500 shadow-[inset_0_0_0_1px_rgba(226,232,240,0.85)]">
                      {item.sourceLabel || '외부 뉴스'}
                    </span>
                  </div>
                  <strong className="mt-3 block text-[1rem] font-bold leading-[1.42] text-slate-900">{item.title}</strong>
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid min-h-[260px] place-items-center rounded-[22px] bg-white px-6 text-center shadow-sm">
            <div>
              <strong className="text-lg font-bold text-slate-900">등록된 뉴스가 없습니다.</strong>
              <p className="mt-2 text-sm font-semibold text-slate-500">관리자에서 링크를 등록하면 이 영역에 최신 뉴스가 표시됩니다.</p>
            </div>
          </div>
        )}

        {newsPreviewError ? <p className="mt-3 text-sm font-semibold text-[#b42323]">{newsPreviewError}</p> : null}
      </div>
    </section>
  )
}
