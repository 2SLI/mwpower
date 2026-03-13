export function ServiceView({ isActive }) {
  return (
    <section
      className={`service-page ${isActive ? '' : 'is-hidden'} bg-[linear-gradient(180deg,#3a3b3f_0%,#d5d5d8_36%,#d8d8db_100%)] px-4 pb-[52px] pt-[clamp(46px,5vw,78px)] max-[640px]:px-3 max-[640px]:pb-[30px] max-[640px]:pt-7`}
      id="service-page"
    >
      <div className="mx-auto mt-[clamp(42px,5vw,74px)] max-w-[1220px]">
        <section className="border border-slate-300 bg-slate-50 px-[22px] pb-[34px] shadow-[0_18px_32px_rgba(0,0,0,0.08)] max-[640px]:px-2.5 max-[640px]:pb-5">
          <header className="relative border-b border-slate-300 px-[22px] pb-[18px] pt-[26px] text-center max-[640px]:px-2.5 max-[640px]:pb-[14px] max-[640px]:pt-4">
            <h2 className="m-0 text-[clamp(44px,3vw,58px)] font-black tracking-[-0.8px] text-slate-900 max-[640px]:text-[clamp(30px,9vw,40px)]">민웰 정품 확인법</h2>
            <p className="mb-0 mt-2.5 text-[clamp(24px,1.75vw,30px)] font-bold text-[#d43a32] max-[640px]:text-[clamp(16px,4.6vw,20px)]">민웰 공식 홈페이지에서 가능합니다.</p>
            <div className="absolute right-2.5 top-[18px] grid h-[42px] w-16 place-items-center bg-[#e3362d] text-3xl font-black leading-none text-white max-[640px]:right-1 max-[640px]:top-2.5 max-[640px]:h-[34px] max-[640px]:w-[52px] max-[640px]:text-2xl">
              MW
            </div>
          </header>

          <div className="mt-[22px] grid gap-6 [grid-template-columns:282px_minmax(0,1fr)] max-[980px]:grid-cols-1">
            <aside>
              <h3 className="mb-3 mt-0 text-[clamp(26px,2vw,38px)] font-semibold text-slate-500">Service</h3>
              <ul className="m-0 list-none border border-slate-300 p-0 max-[980px]:grid max-[980px]:grid-cols-2 max-[640px]:grid-cols-1">
                <li className="border-b border-slate-200 bg-slate-100 px-3.5 py-2.5 text-[clamp(14px,0.95vw,18px)] text-slate-600">Sales Inquiry</li>
                <li className="border-b border-slate-200 bg-slate-100 px-3.5 py-2.5 text-[clamp(14px,0.95vw,18px)] text-slate-600">Technical Service</li>
                <li className="border-b border-slate-200 bg-slate-100 px-3.5 py-2.5 text-[clamp(14px,0.95vw,18px)] text-slate-600">Quality Control Inspection Report</li>
                <li className="border-b border-slate-200 bg-slate-100 px-3.5 py-2.5 text-[clamp(14px,0.95vw,18px)] text-slate-600">Product Warranty Statement</li>
                <li className="border-b border-slate-200 bg-slate-100 px-3.5 py-2.5 text-[clamp(14px,0.95vw,18px)] text-slate-600">Product Liability Disclaimer</li>
                <li className="border-b border-slate-200 bg-slate-100 px-3.5 py-2.5 text-[clamp(14px,0.95vw,18px)] text-slate-600">Global Trade Item Number (GTIN)</li>
                <li className="border-b-0 bg-[#b93b35] px-3.5 py-2.5 text-[clamp(14px,0.95vw,18px)] text-white">Product S/N Check</li>
              </ul>
            </aside>

            <div className="grid gap-[26px]">
              <h3 className="mb-0 mt-0 inline-flex w-fit items-center gap-2.5 rounded-full bg-[#f4cc58] px-7 py-2 text-[clamp(32px,2vw,42px)] font-extrabold tracking-[-0.4px] text-slate-900 max-[640px]:px-4 max-[640px]:text-[clamp(24px,6.6vw,30px)]">
                <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-slate-900 text-xl text-white">1</span>
                시리얼넘버 확인
              </h3>
              <div className="grid gap-2 border border-slate-300 bg-white p-4">
                <p className="m-0 text-sm font-bold text-slate-700">확인 포인트</p>
                <ul className="m-0 list-disc pl-5 text-[15px] leading-relaxed text-slate-600">
                  <li>제품 본체 라벨의 시리얼 번호를 확인합니다.</li>
                  <li>모델명과 제조 정보를 함께 점검합니다.</li>
                  <li>조회 전 오탈자가 없는지 다시 확인합니다.</li>
                </ul>
              </div>

              <h3 className="mb-0 mt-0 inline-flex w-fit items-center gap-2.5 rounded-full bg-[#f4cc58] px-7 py-2 text-[clamp(32px,2vw,42px)] font-extrabold tracking-[-0.4px] text-slate-900 max-[640px]:px-4 max-[640px]:text-[clamp(24px,6.6vw,30px)]">
                <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-slate-900 text-xl text-white">2</span>
                시리얼넘버 입력/조회
              </h3>
              <div className="border border-slate-400 bg-slate-300 px-[18px] pb-[18px] pt-4 text-center">
                <p className="mb-2.5 mt-0 text-[clamp(20px,1.2vw,26px)] font-semibold text-slate-500">Product Warranty Period Check</p>
                <input
                  className="h-[50px] w-full border-4 border-[#df3c34] bg-white px-2.5 text-xl max-[640px]:h-11 max-[640px]:border-[3px] max-[640px]:text-base"
                  type="text"
                  placeholder="Please insert serial number here"
                  readOnly
                  aria-readonly="true"
                />
                <button
                  className="mt-2.5 h-[52px] w-[126px] border-4 border-[#df3c34] bg-slate-50 text-[26px] font-bold text-slate-600 max-[640px]:h-11 max-[640px]:w-[110px] max-[640px]:border-[3px] max-[640px]:text-xl"
                  type="button"
                  disabled
                  aria-disabled="true"
                >
                  CHECK
                </button>
              </div>

              <h3 className="mb-0 mt-0 inline-flex w-fit items-center gap-2.5 rounded-full bg-[#f4cc58] px-7 py-2 text-[clamp(32px,2vw,42px)] font-extrabold tracking-[-0.4px] text-slate-900 max-[640px]:px-4 max-[640px]:text-[clamp(24px,6.6vw,30px)]">
                <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-slate-900 text-xl text-white">3</span>
                정품 여부 확인
              </h3>
              <div className="border border-slate-300 bg-slate-100 p-[18px] text-center">
                <p className="m-0 text-[clamp(18px,1.15vw,24px)] text-slate-700">
                  <strong>Model:</strong> RT-125B, <strong>Work order:</strong> Y2505B291, <strong>Manufacturer:</strong> MSZ
                </p>
                <button className="mt-4 h-10 w-[74px] border border-slate-300 bg-slate-200 font-bold text-slate-600" type="button" disabled aria-disabled="true">
                  OK
                </button>
              </div>
              <p className="mb-0 mt-[-10px] text-center text-[clamp(18px,1.15vw,24px)] font-bold text-[#d43a32]">*가품일 경우 조회되지 않습니다.</p>
              <a
                className="mx-auto mt-[-4px] inline-flex w-fit items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#e43a31] to-[#bc2520] px-6 py-3 text-[clamp(14px,1vw,18px)] font-bold tracking-[-0.1px] text-white shadow-[0_12px_26px_rgba(188,37,32,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(188,37,32,0.32)] max-[640px]:w-full max-[640px]:px-3.5 max-[640px]:py-[11px] max-[640px]:text-sm"
                href="https://www.meanwell.com/serviceSN.aspx"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>공식 홈페이지에서 시리얼 조회하기</span>
                <i className="fa-solid fa-arrow-up-right-from-square text-sm" aria-hidden="true"></i>
              </a>
            </div>
          </div>
        </section>
      </div>
    </section>
  )
}
