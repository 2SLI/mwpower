const footerColumns = [
  {
    title: '회사소개',
    items: ['민웰에 대하여', '창립자의 말', '제품과 서비스', '브랜드 스토리', '기업 히스토리', '개인정보보호정책'],
  },
  {
    title: '제품소개',
    items: ['시리즈 검색', '빠른 검색', '다운로드'],
  },
  {
    title: '온라인서비스',
    items: ['판매 문의', '기술 서비스', 'QC 리포트', '제품 보증서', '제품 책임 면책'],
  },
  {
    title: '그룹 링크',
    items: ['MEAN WELL GUANGZHOU', 'MEAN WELL SUZHOU', 'MEAN WELL USA,INC.', 'MEAN WELL EUROPE N.V.'],
  },
]

export function Footer({ activeView = 'home' }) {
  if (activeView === 'news') {
    return (
      <footer className="border-t border-[#d8d8d8] bg-[#efefef]">
        <div className="mx-auto grid w-full max-w-[1280px] grid-cols-[240px_repeat(4,minmax(0,1fr))] gap-8 px-[15px] py-8 max-[980px]:grid-cols-2">
          <div className="pt-2">
            <div className="flex gap-2 text-[#e5332a]">
              <i className="fa-brands fa-youtube text-[22px]"></i>
              <i className="fa-brands fa-facebook-square text-[22px]"></i>
              <i className="fa-brands fa-linkedin text-[22px]"></i>
            </div>
            <div className="mt-3 inline-block bg-[#e5332a] px-3 py-1 text-[12px] font-bold text-white">E-NEWS SUBSCRIBE</div>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="m-0 text-[16px] font-bold text-[#444]">{column.title}</h3>
              <ul className="m-0 mt-3 list-none space-y-1.5 p-0">
                {column.items.map((item) => (
                  <li key={item} className="text-[13px] text-[#555]">
                    <span className="mr-1.5 text-[#e5332a]">›</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="bg-[#1f1f1f] py-2 text-center text-[12px] text-white">Copyright © MEAN WELL Enterprises Co., Ltd. All rights reserved.</div>
      </footer>
    )
  }

  return (
    <footer className="border-t border-slate-300 bg-slate-100 px-4 py-6 max-[980px]:px-4 max-[980px]:py-5">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 max-[980px]:flex-col max-[980px]:items-start">
        <div className="flex min-w-0 items-baseline gap-3.5 max-[640px]:flex-wrap max-[640px]:items-center max-[640px]:gap-2">
          <strong className="text-[clamp(34px,2.2vw,54px)] font-extrabold leading-[0.9] tracking-[0.4px] text-[#e12f27] max-[640px]:text-[clamp(28px,8vw,34px)]">
            MEANWELL POWER
          </strong>
          <span className="text-[clamp(18px,1.1vw,24px)] font-medium text-slate-600 max-[640px]:text-base">Korea</span>
        </div>
      </div>

      <div className="mx-auto mt-3 flex max-w-[1240px] items-start justify-between gap-6 max-[980px]:flex-col max-[980px]:items-start">
        <dl className="m-0 grid gap-1">
          <div className="grid grid-cols-[128px_1fr] items-start gap-2 max-[980px]:grid-cols-[92px_1fr] max-[640px]:grid-cols-[84px_1fr] max-[640px]:gap-1.5">
            <dt className="m-0 text-[clamp(18px,0.95vw,22px)] font-bold text-slate-800 max-[640px]:text-sm">주소</dt>
            <dd className="m-0 text-[clamp(18px,0.95vw,22px)] leading-[1.45] text-slate-600 max-[640px]:text-sm">
              충청남도 천안시 서북구 미라16길 33-4 비 102호 (우 : 31167)
            </dd>
          </div>
          <div className="grid grid-cols-[128px_1fr] items-start gap-2 max-[980px]:grid-cols-[92px_1fr] max-[640px]:grid-cols-[84px_1fr] max-[640px]:gap-1.5">
            <dt className="m-0 text-[clamp(18px,0.95vw,22px)] font-bold text-slate-800 max-[640px]:text-sm">이메일</dt>
            <dd className="m-0 text-[clamp(18px,0.95vw,22px)] leading-[1.45] text-slate-600 max-[640px]:text-sm">hclee@l-light.co.kr</dd>
          </div>
        </dl>

        <div className="pt-1 text-right max-[980px]:pt-0.5 max-[980px]:text-left">
          <span className="mb-0.5 block text-[clamp(20px,1vw,24px)] text-slate-600 max-[640px]:text-[15px]">상담문의</span>
          <a href="tel:0415223324" className="text-[clamp(44px,2.4vw,58px)] font-extrabold tracking-[0.8px] text-[#c7332b] max-[980px]:text-[clamp(34px,7vw,42px)] max-[640px]:text-[32px]">
            041-522-3324
          </a>
        </div>
      </div>

      <div className="mx-auto mt-4 flex max-w-[1240px] items-center justify-between gap-3 border-t border-slate-300 pt-3 max-[980px]:flex-col max-[980px]:items-start max-[640px]:mt-3 max-[640px]:pt-2.5">
        <p className="m-0 text-[clamp(14px,0.8vw,16px)] text-slate-600 max-[640px]:text-xs max-[640px]:leading-[1.35]">
          Copyright (C) 2008-2026 MEANWELL POWER Co., Ltd. All Rights Reserved.
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
