import { formatQuoteItemPath } from '../../quoteCart'

export function AdminQuotesPanel({
  quoteRequests,
  activeQuoteRequest,
  activeQuoteId,
  isLoading,
  error,
  formatDateTime,
  onRefresh,
  onSelectQuote,
  onStatusToggle,
}) {
  return (
    <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="m-0 text-xl font-black text-slate-900">견적함</h2>
        <button type="button" onClick={onRefresh} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
          새로고침
        </button>
      </div>

      {isLoading ? <p className="m-0 text-sm font-semibold text-slate-500">견적요청 데이터를 불러오는 중입니다...</p> : null}
      {error ? <p className="m-0 text-sm font-semibold text-[#b42323]">{error}</p> : null}

      <div className="grid gap-3 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="max-h-[66vh] overflow-y-auto rounded-xl border border-slate-200">
          {quoteRequests.length === 0 ? (
            <p className="m-0 px-4 py-8 text-center text-sm font-semibold text-slate-500">표시할 견적요청이 없습니다.</p>
          ) : (
            <ul className="m-0 list-none p-0">
              {quoteRequests.map((item) => (
                <li key={item.id} className="border-b border-slate-200 last:border-b-0">
                  <button
                    type="button"
                    className={`grid w-full gap-1 px-3 py-2.5 text-left ${activeQuoteId === item.id ? 'bg-[#fff3f4]' : 'bg-white hover:bg-slate-50'}`}
                    onClick={() => onSelectQuote(item.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-sm font-extrabold text-slate-800">{item.companyName || item.contactName || '(회사명 없음)'}</strong>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${item.status === 'done' ? 'bg-[#e9f9ef] text-[#0f6d3d]' : 'bg-[#fff3f4] text-[#b42323]'}`}>
                        {item.status === 'done' ? '처리완료' : '신규'}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-600">
                      {item.contactName || '담당자 미입력'} · {item.itemCount}개 품목 / 총 {item.totalQuantity}개
                    </span>
                    <span className="text-xs text-slate-500">{formatDateTime(item.createdAt, item.createdAtClient || '-')}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <AdminQuoteDetail quoteRequest={activeQuoteRequest} formatDateTime={formatDateTime} onStatusToggle={onStatusToggle} />
      </div>
    </section>
  )
}

function AdminQuoteDetail({ quoteRequest, formatDateTime, onStatusToggle }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      {!quoteRequest ? (
        <p className="m-0 text-sm font-semibold text-slate-500">왼쪽 목록에서 견적요청을 선택해주세요.</p>
      ) : (
        <div className="grid gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="m-0 text-lg font-black text-slate-900">견적요청 상세</h3>
            <button
              type="button"
              onClick={() => onStatusToggle(quoteRequest)}
              className={`rounded-lg px-3 py-2 text-sm font-extrabold ${
                quoteRequest.status === 'done' ? 'border border-slate-300 bg-white text-slate-700' : 'border border-[#c9252f] bg-[#c9252f] text-white'
              }`}
            >
              {quoteRequest.status === 'done' ? '신규로 되돌리기' : '처리완료로 표시'}
            </button>
          </div>

          <div className="grid gap-1 rounded-lg bg-slate-50 p-3 text-sm">
            <p className="m-0"><strong>회사명:</strong> {quoteRequest.companyName || '-'}</p>
            <p className="m-0"><strong>담당자:</strong> {quoteRequest.contactName || '-'}</p>
            <p className="m-0"><strong>이메일:</strong> {quoteRequest.email || '-'}</p>
            <p className="m-0"><strong>연락처:</strong> {quoteRequest.phone || '-'}</p>
            <p className="m-0"><strong>접수일:</strong> {formatDateTime(quoteRequest.createdAt, quoteRequest.createdAtClient || '-')}</p>
            <p className="m-0"><strong>처리일:</strong> {formatDateTime(quoteRequest.resolvedAt, '-')}</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="m-0 text-sm font-black text-slate-700">주문목록</p>
              <span className="rounded-full bg-[#fff3f4] px-2.5 py-1 text-xs font-black text-[#b42323]">
                {quoteRequest.itemCount}개 품목 / 총 {quoteRequest.totalQuantity}개
              </span>
            </div>

            {quoteRequest.items.length === 0 ? (
              <p className="m-0 mt-3 text-sm text-slate-500">저장된 품목이 없습니다.</p>
            ) : (
              <ul className="m-0 mt-3 grid list-none gap-2 p-0">
                {quoteRequest.items.map((item) => (
                  <li key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="grid gap-3 sm:grid-cols-[88px_minmax(0,1fr)]">
                      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        {item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} alt={item.displayModel} className="aspect-[4/3] h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="grid aspect-[4/3] h-full w-full place-items-center text-[10px] font-black text-slate-400">NO IMAGE</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <strong className="text-sm font-extrabold text-slate-900">{item.displayModel}</strong>
                          <span className="text-xs font-black text-[#b42323]">{item.quantity}개</span>
                        </div>
                        <p className="m-0 mt-1 text-xs font-semibold text-slate-500">{formatQuoteItemPath(item) || '제품 정보 없음'}</p>
                        {item.note ? <p className="m-0 mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">메모: {item.note}</p> : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="m-0 mb-2 text-sm font-black text-slate-700">요청 메모</p>
            <p className="m-0 whitespace-pre-wrap text-sm leading-6 text-slate-700">{quoteRequest.message || '(내용 없음)'}</p>
          </div>
        </div>
      )}
    </div>
  )
}
