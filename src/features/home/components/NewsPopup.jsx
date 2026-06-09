import { formatNewsDate } from '../../../data/newsContent'

export function NewsPopup({ popupNews, onClose, onSuppress }) {
  if (!popupNews) return null

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-slate-950/15 px-4 py-6 max-[640px]:items-end max-[640px]:px-3 max-[640px]:py-3" role="dialog" aria-modal="true" aria-label="뉴스 공지">
      <article className="w-full max-w-[760px] overflow-hidden rounded-[22px] bg-[#2f2f2f] p-4 shadow-[0_18px_50px_rgba(15,23,42,0.34)] max-[640px]:rounded-[18px] max-[640px]:p-3">
        <div className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f7f7f7_70%,#e8e8e8_100%)] px-8 pb-8 pt-7 max-[640px]:px-5 max-[640px]:pb-6 max-[640px]:pt-5">
          <span className="absolute left-0 top-0 h-20 w-20 bg-[#2f2f2f] [clip-path:polygon(0_0,100%_0,0_100%)]" aria-hidden="true"></span>
          <span className="absolute bottom-0 right-0 h-20 w-20 bg-[#2f2f2f] [clip-path:polygon(100%_0,100%_100%,0_100%)]" aria-hidden="true"></span>

          <div className="relative">
            <h2 className="m-0 text-center text-[clamp(1.3rem,2.1vw,1.9rem)] font-bold leading-tight text-slate-950">
              <span className="text-[#d53232]">※</span> MWPOWER 민웰 공식 뉴스 안내
            </h2>

            <div className="mx-auto mt-8 max-w-[610px] border border-slate-700 bg-white px-5 py-4 text-center max-[640px]:mt-5 max-[640px]:px-3">
              <p className="m-0 text-[13px] font-bold leading-6 text-slate-700 max-[640px]:text-[12px]">
                MWPOWER는 MEAN WELL 정품 전원공급장치 정보를 안내합니다.
                <br />
                신제품, 기술자료, 단종모델 관련 공지는 뉴스 메뉴에서 확인하실 수 있습니다.
              </p>
            </div>

            <div className="mx-auto mt-8 max-w-[610px] text-[16px] font-semibold leading-[1.7] text-black max-[640px]:mt-5 max-[640px]:text-[14px]">
              <p className="m-0">
                최근 등록된 민웰 뉴스:
                <br />
                <span className="font-bold underline decoration-[#d53232] decoration-[4px] underline-offset-[-2px]">{popupNews.title}</span>
              </p>
              {popupNews.summary ? <p className="m-0 mt-6 text-[#d53232]">{popupNews.summary}</p> : null}
              <p className="m-0 mt-6">
                자세한 내용은 상단 뉴스 메뉴에서 확인해 주시기 바랍니다.
                <br />
                게시일: {formatNewsDate(popupNews.date)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#eeeeee] px-4 py-3 max-[640px]:grid max-[640px]:grid-cols-2">
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full px-3 text-sm font-bold text-slate-700 transition hover:bg-white max-[640px]:px-2 max-[640px]:text-xs"
            onClick={() => onSuppress(24 * 60 * 60 * 1000)}
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#bdbdbd] text-white">✓</span>
            오늘 하루 보지 않기
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full px-3 text-sm font-bold text-slate-700 transition hover:bg-white max-[640px]:px-2 max-[640px]:text-xs"
            onClick={() => onSuppress(7 * 24 * 60 * 60 * 1000)}
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#bdbdbd] text-white">✓</span>
            일주일 보지 않기
          </button>
          <button
            type="button"
            className="ml-auto inline-flex h-10 min-w-[110px] items-center justify-center border-l border-slate-300 px-5 text-sm font-bold text-slate-800 transition hover:bg-white max-[640px]:col-span-2 max-[640px]:ml-0 max-[640px]:w-full max-[640px]:border-l-0 max-[640px]:border-t"
            onClick={onClose}
          >
            닫기
          </button>
        </div>
      </article>
    </div>
  )
}
