const ADMIN_TABS = [
  { key: 'inquiries', label: '문의함' },
  { key: 'quotes', label: '견적함' },
  { key: 'orders', label: '주문' },
  { key: 'news', label: '뉴스' },
]

export function AdminChrome({ activeTab, onTabChange, onLogout, children }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 py-6 text-slate-700">
      <div className="mx-auto grid w-full max-w-[1240px] gap-4">
        <header className="rounded-2xl border border-[#e7c4c9] bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="m-0 text-[11px] font-black uppercase tracking-[0.08em] text-[#b42323]">Admin Console</p>
              <h1 className="m-0 mt-1 text-[30px] font-black tracking-[-0.02em] text-slate-900">문의/견적/주문/뉴스 관리</h1>
            </div>
            <div className="flex items-center gap-2">
              <a href="/" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                메인 이동
              </a>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-lg border border-[#c9252f] bg-[#c9252f] px-3 py-2 text-sm font-extrabold text-white hover:bg-[#b81f29]"
              >
                로그아웃
              </button>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap gap-2">
            {ADMIN_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key)}
                className={`rounded-full px-4 py-2 text-sm font-extrabold ${
                  activeTab === tab.key ? 'bg-[#c9252f] text-white' : 'border border-slate-300 bg-white text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {children}
      </div>
    </div>
  )
}
