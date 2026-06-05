export function Footer({ isShopSite = false }) {
  return (
    <footer
      className={`px-4 py-6 max-[980px]:px-4 max-[980px]:py-5 ${
        isShopSite ? 'bg-[#f5f5f7]' : 'border-t border-slate-300 bg-slate-100'
      }`}
    >
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 max-[980px]:flex-col max-[980px]:items-start">
        <div className="flex min-w-0 items-center gap-3.5 max-[640px]:flex-wrap max-[640px]:gap-2">
          <p className="m-0 text-[clamp(22px,1.4vw,30px)] font-extrabold uppercase tracking-[0.06em] text-[#c7332b]">
            MWPOWER
          </p>
        </div>
      </div>

      <div className="mx-auto mt-3 flex max-w-[1240px] items-start justify-between gap-6 max-[980px]:flex-col max-[980px]:items-start">
        <dl className="m-0 grid gap-1">
          <div className="grid grid-cols-[128px_1fr] items-start gap-2 max-[980px]:grid-cols-[92px_1fr] max-[640px]:grid-cols-[84px_1fr] max-[640px]:gap-1.5">
            <dt className="m-0 text-[clamp(15px,0.85vw,17px)] font-bold text-slate-800 max-[640px]:text-sm">주소</dt>
            <dd className="m-0 text-[clamp(15px,0.85vw,17px)] leading-[1.45] text-slate-600 max-[640px]:text-sm">
              충청남도 천안시 서북구 미라16길 33-4 비 102호 (우 : 31167)
            </dd>
          </div>
          <div className="grid grid-cols-[128px_1fr] items-start gap-2 max-[980px]:grid-cols-[92px_1fr] max-[640px]:grid-cols-[84px_1fr] max-[640px]:gap-1.5">
            <dt className="m-0 text-[clamp(15px,0.85vw,17px)] font-bold text-slate-800 max-[640px]:text-sm">이메일</dt>
            <dd className="m-0 text-[clamp(15px,0.85vw,17px)] leading-[1.45] text-slate-600 max-[640px]:text-sm">hclee@l-light.co.kr</dd>
          </div>
        </dl>

        <div className="pt-1 text-right max-[980px]:pt-0.5 max-[980px]:text-left">
          <span className="mb-0.5 block text-[clamp(15px,0.85vw,17px)] text-slate-600 max-[640px]:text-[14px]">상담문의</span>
          <a href="tel:01063583144" className="text-[clamp(28px,1.8vw,36px)] font-bold tracking-[0.3px] text-[#c7332b] max-[980px]:text-[clamp(26px,6vw,32px)] max-[640px]:text-[26px]">
            010-6358-3144
          </a>
        </div>
      </div>

      <div
        className={`mx-auto mt-4 flex max-w-[1240px] items-center justify-between gap-3 pt-3 max-[980px]:flex-col max-[980px]:items-start max-[640px]:mt-3 max-[640px]:pt-2.5 ${
          isShopSite ? 'border-t border-slate-200' : 'border-t border-slate-300'
        }`}
      >
        <p className="m-0 text-[clamp(14px,0.8vw,16px)] text-slate-600 max-[640px]:text-xs max-[640px]:leading-[1.35]">
          Copyright (C) 2008-2026 MWPOWER Co., Ltd. All Rights Reserved.
        </p>
        <div className="flex gap-2.5">
          <a
            className="grid h-[38px] w-[38px] place-items-center rounded-full bg-[#f4d7d7] text-base text-[#c62828] max-[640px]:h-8 max-[640px]:w-8 max-[640px]:text-sm"
            href="https://smartstore.naver.com/meanwellpower"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Naver Smart Store"
            title="Naver Smart Store"
          >
            <i className="fa-solid fa-shop"></i>
          </a>
          <a
            className="grid h-[38px] w-[38px] place-items-center rounded-full bg-[#f4d7d7] text-base text-[#c62828] max-[640px]:h-8 max-[640px]:w-8 max-[640px]:text-sm"
            href="https://blog.naver.com/meanwell_power"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Naver Blog"
            title="Naver Blog"
          >
            <i className="fa-solid fa-blog"></i>
          </a>
        </div>
      </div>
    </footer>
  )
}
