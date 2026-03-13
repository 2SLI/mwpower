export function ContactView({ isActive }) {
  return (
    <section className={`contact-page ${isActive ? '' : 'is-hidden'} bg-zinc-100 px-4 pb-9 pt-[clamp(36px,4.6vw,62px)] max-[640px]:px-3.5 max-[640px]:pb-7 max-[640px]:pt-[30px]`} id="contact-page">
      <div className="mx-auto max-w-[1160px]">
        <div className="grid items-start gap-[46px] [grid-template-columns:minmax(0,1fr)_minmax(0,420px)] max-[980px]:grid-cols-1 max-[980px]:gap-[34px]">
          <div>
            <h1 className="mb-3.5 mt-0 text-[clamp(42px,3.2vw,56px)] font-semibold tracking-[-0.8px] text-slate-900">Contact Us</h1>
            <p className="m-0 max-w-[440px] text-[clamp(16px,1.1vw,20px)] leading-[1.4] text-slate-500">
              문의를 남겨주시면 프로젝트 상담을 위해 입력하신 정보를 바탕으로
              <br />
              빠르게 연락드리겠습니다.
            </p>

            <ul className="contact-info-list m-0 mt-12 grid list-none gap-6 p-0 max-[640px]:mt-[30px] max-[640px]:gap-[18px]">
              <li className="grid grid-cols-[30px_1fr] items-start gap-3.5 text-[clamp(20px,1.3vw,27px)] leading-[1.45] text-slate-800 max-[640px]:text-base">
                <span className="mt-1 inline-grid h-[26px] w-[26px] place-items-center rounded-md border border-[#e72e25] bg-white text-xs text-[#e72e25]" aria-hidden="true">
                  <i className="fa-regular fa-envelope"></i>
                </span>
                <span>hclee@l-light.co.kr</span>
              </li>
              <li className="grid grid-cols-[30px_1fr] items-start gap-3.5 text-[clamp(20px,1.3vw,27px)] leading-[1.45] text-slate-800 max-[640px]:text-base">
                <span className="mt-1 inline-grid h-[26px] w-[26px] place-items-center rounded-md border border-[#e72e25] bg-white text-xs text-[#e72e25]" aria-hidden="true">
                  <i className="fa-solid fa-location-dot"></i>
                </span>
                <span>충청남도 천안시 서북구 미라16길 33-4 비 102호 (우 : 31167)</span>
              </li>
              <li className="grid grid-cols-[30px_1fr] items-start gap-3.5 text-[clamp(20px,1.3vw,27px)] leading-[1.45] text-slate-800 max-[640px]:text-base">
                <span className="mt-1 inline-grid h-[26px] w-[26px] place-items-center rounded-md border border-[#e72e25] bg-white text-xs text-[#e72e25]" aria-hidden="true">
                  <i className="fa-solid fa-mobile-screen-button"></i>
                </span>
                <span>041-522-3324</span>
              </li>
            </ul>
          </div>

          <form className="grid gap-2.5" action="#" method="post" noValidate>
            <label className="relative block">
              <span className="pointer-events-none absolute left-4 top-[13px] text-[15px] text-slate-600 max-[640px]:left-3.5 max-[640px]:top-3 max-[640px]:text-sm">
                이름 <em className="not-italic text-[#e72e25]">*</em>
              </span>
              <input
                className="h-[62px] w-full rounded-lg border border-slate-300 bg-white px-3.5 pb-2.5 pt-8 text-base text-slate-800 focus:border-[#c93f3f] focus:shadow-[0_0_0_2px_#f2caca] focus:outline-none max-[640px]:h-14 max-[640px]:pt-7"
                type="text"
                name="name"
                autoComplete="name"
              />
            </label>

            <label className="relative block">
              <span className="pointer-events-none absolute left-4 top-[13px] text-[15px] text-slate-600 max-[640px]:left-3.5 max-[640px]:top-3 max-[640px]:text-sm">
                이메일 <em className="not-italic text-[#e72e25]">*</em>
              </span>
              <input
                className="h-[62px] w-full rounded-lg border border-slate-300 bg-white px-3.5 pb-2.5 pt-8 text-base text-slate-800 focus:border-[#c93f3f] focus:shadow-[0_0_0_2px_#f2caca] focus:outline-none max-[640px]:h-14 max-[640px]:pt-7"
                type="email"
                name="email"
                autoComplete="email"
              />
            </label>

            <label className="relative block">
              <span className="pointer-events-none absolute left-4 top-[13px] text-[15px] text-slate-600 max-[640px]:left-3.5 max-[640px]:top-3 max-[640px]:text-sm">
                번호 <em className="not-italic text-[#e72e25]">*</em>
              </span>
              <input
                className="h-[62px] w-full rounded-lg border border-slate-300 bg-white px-3.5 pb-2.5 pt-8 text-base text-slate-800 focus:border-[#c93f3f] focus:shadow-[0_0_0_2px_#f2caca] focus:outline-none max-[640px]:h-14 max-[640px]:pt-7"
                type="tel"
                name="phone"
                autoComplete="tel"
              />
            </label>

            <label className="relative block">
              <span className="pointer-events-none absolute left-4 top-[13px] text-[15px] text-slate-600 max-[640px]:left-3.5 max-[640px]:top-3 max-[640px]:text-sm">문의 내용</span>
              <textarea
                className="h-[150px] min-h-[132px] w-full resize-y rounded-lg border border-slate-300 bg-white px-3.5 pb-3 pt-[38px] text-base text-slate-800 focus:border-[#c93f3f] focus:shadow-[0_0_0_2px_#f2caca] focus:outline-none max-[640px]:h-32 max-[640px]:pt-[34px]"
                name="message"
              ></textarea>
            </label>

            <button className="mt-0.5 rounded-md bg-gradient-to-r from-[#e2443b] to-[#b82727] px-[18px] py-4 text-[22px] font-medium text-white max-[640px]:px-4 max-[640px]:py-[13px] max-[640px]:text-lg" type="button">
              문의 보내기
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
