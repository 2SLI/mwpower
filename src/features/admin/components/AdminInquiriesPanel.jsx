export function AdminInquiriesPanel({
  inquiries,
  filteredInquiries,
  activeInquiry,
  activeInquiryId,
  inquiryFilter,
  isLoading,
  error,
  formatDateTime,
  onRefresh,
  onFilterChange,
  onSelectInquiry,
  onStatusToggle,
}) {
  return (
    <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="m-0 text-xl font-black text-slate-900">문의함</h2>
        <button type="button" onClick={onRefresh} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
          새로고침
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          ['all', '전체'],
          ['product', '제품문의'],
          ['technical', '기술문의'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => onFilterChange(key)}
            className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${
              inquiryFilter === key ? 'bg-[#c9252f] text-white' : 'border border-slate-300 bg-white text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? <p className="m-0 text-sm font-semibold text-slate-500">문의 데이터를 불러오는 중입니다...</p> : null}
      {error ? <p className="m-0 text-sm font-semibold text-[#b42323]">{error}</p> : null}

      <div className="grid gap-3 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="max-h-[66vh] overflow-y-auto rounded-xl border border-slate-200">
          {filteredInquiries.length === 0 ? (
            <p className="m-0 px-4 py-8 text-center text-sm font-semibold text-slate-500">표시할 문의가 없습니다.</p>
          ) : (
            <ul className="m-0 list-none p-0">
              {filteredInquiries.map((item) => (
                <li key={item.id} className="border-b border-slate-200 last:border-b-0">
                  <button
                    type="button"
                    className={`grid w-full gap-1 px-3 py-2.5 text-left ${activeInquiryId === item.id ? 'bg-[#fff3f4]' : 'bg-white hover:bg-slate-50'}`}
                    onClick={() => onSelectInquiry(item.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-sm font-extrabold text-slate-800">{item.name || '(이름 없음)'}</strong>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${item.status === 'done' ? 'bg-[#e9f9ef] text-[#0f6d3d]' : 'bg-[#fff3f4] text-[#b42323]'}`}>
                        {item.status === 'done' ? '처리완료' : '신규'}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{item.inquiryType === 'technical' ? '기술문의' : '제품문의'}</span>
                    <span className="text-xs text-slate-500">{formatDateTime(item.createdAt, item.createdAtClient || '-')}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <AdminInquiryDetail inquiry={activeInquiry} formatDateTime={formatDateTime} onStatusToggle={onStatusToggle} />
      </div>
    </section>
  )
}

function AdminInquiryDetail({ inquiry, formatDateTime, onStatusToggle }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      {!inquiry ? (
        <p className="m-0 text-sm font-semibold text-slate-500">왼쪽 목록에서 문의를 선택해주세요.</p>
      ) : (
        <div className="grid gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="m-0 text-lg font-black text-slate-900">문의 상세</h3>
            <button
              type="button"
              onClick={() => onStatusToggle(inquiry)}
              className={`rounded-lg px-3 py-2 text-sm font-extrabold ${
                inquiry.status === 'done' ? 'border border-slate-300 bg-white text-slate-700' : 'border border-[#c9252f] bg-[#c9252f] text-white'
              }`}
            >
              {inquiry.status === 'done' ? '신규로 되돌리기' : '처리완료로 표시'}
            </button>
          </div>

          <div className="grid gap-1 rounded-lg bg-slate-50 p-3 text-sm">
            <p className="m-0"><strong>유형:</strong> {inquiry.inquiryType === 'technical' ? '기술문의' : '제품문의'}</p>
            <p className="m-0"><strong>이름:</strong> {inquiry.name || '-'}</p>
            <p className="m-0"><strong>이메일:</strong> {inquiry.email || '-'}</p>
            <p className="m-0"><strong>연락처:</strong> {inquiry.phone || '-'}</p>
            <p className="m-0"><strong>접수일:</strong> {formatDateTime(inquiry.createdAt, inquiry.createdAtClient || '-')}</p>
            <p className="m-0"><strong>처리일:</strong> {formatDateTime(inquiry.resolvedAt, '-')}</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="m-0 mb-2 text-sm font-black text-slate-700">문의 내용</p>
            <p className="m-0 whitespace-pre-wrap text-sm leading-6 text-slate-700">{inquiry.message || '(내용 없음)'}</p>
          </div>
        </div>
      )}
    </div>
  )
}
