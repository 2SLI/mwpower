import { formatNewsDate } from '../../../data/newsContent'
import { NEWS_CATEGORIES, inferNewsCategory, normalizeNewsCategory } from '../../newsCategory'
import { getNewsSourceLabel } from '../../newsLink'

export function AdminNewsPanel({
  newsItems,
  newsForm,
  newsFormPreview,
  selectedNewsFormCategory,
  normalizedNewsFormLink,
  editingNewsId,
  isLoadingNews,
  isSavingNews,
  isLoadingNewsPreview,
  newsError,
  newsPreviewError,
  onRefresh,
  onResetForm,
  onFormChange,
  onPreviewLoad,
  onSubmit,
  onEdit,
  onDelete,
  onImageError,
}) {
  return (
    <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="m-0 text-xl font-black text-slate-900">뉴스 관리</h2>
          <p className="m-0 mt-1 text-sm font-semibold text-slate-500">뉴스 URL 하나만 등록하면 제목과 썸네일을 자동으로 가져와 홈과 뉴스 페이지에 반영됩니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onRefresh} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
            새로고침
          </button>
          <button type="button" onClick={onResetForm} className="rounded-lg border border-[#c9252f] bg-[#c9252f] px-3 py-2 text-sm font-extrabold text-white hover:bg-[#b81f29]">
            새 뉴스 등록
          </button>
        </div>
      </div>

      {isLoadingNews ? <p className="m-0 text-sm font-semibold text-slate-500">뉴스 데이터를 불러오는 중입니다...</p> : null}
      {newsError ? <p className="m-0 text-sm font-semibold text-[#b42323]">{newsError}</p> : null}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <AdminNewsList newsItems={newsItems} onEdit={onEdit} onDelete={onDelete} onImageError={onImageError} />
        <AdminNewsForm
          newsForm={newsForm}
          newsFormPreview={newsFormPreview}
          selectedNewsFormCategory={selectedNewsFormCategory}
          normalizedNewsFormLink={normalizedNewsFormLink}
          editingNewsId={editingNewsId}
          isSavingNews={isSavingNews}
          isLoadingNewsPreview={isLoadingNewsPreview}
          newsPreviewError={newsPreviewError}
          onFormChange={onFormChange}
          onPreviewLoad={onPreviewLoad}
          onSubmit={onSubmit}
          onResetForm={onResetForm}
          onImageError={onImageError}
        />
      </div>
    </section>
  )
}

function AdminNewsList({ newsItems, onEdit, onDelete, onImageError }) {
  return (
    <div className="max-h-[66vh] overflow-y-auto rounded-xl border border-slate-200">
      {newsItems.length === 0 ? (
        <p className="m-0 px-4 py-8 text-center text-sm font-semibold text-slate-500">등록된 뉴스가 없습니다.</p>
      ) : (
        <ul className="m-0 list-none p-0">
          {newsItems.map((item) => (
            <li key={item.id} className="border-b border-slate-200 p-3 last:border-b-0">
              <div className="flex gap-3">
                <div className="h-[84px] w-[148px] shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                  {item.thumbnail || item.image ? (
                    <img src={item.thumbnail || item.image} alt={item.title} className="h-full w-full object-cover" onError={onImageError} />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xs font-black text-slate-400">미리보기 없음</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="m-0 mt-1 text-sm font-extrabold text-slate-900">{item.title}</h3>
                      <p className="m-0 mt-1 text-xs font-semibold text-slate-500">
                        {formatNewsDate(item.date)} · {normalizeNewsCategory(item.category) || inferNewsCategory(item)} · {item.sourceLabel || getNewsSourceLabel(item.articleUrl) || '외부 뉴스'}
                      </p>
                      <p className="m-0 mt-1 text-[11px] text-slate-400">ID: {item.id}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${item.isPublished ? 'bg-[#e9f9ef] text-[#0f6d3d]' : 'bg-[#fff3f4] text-[#b42323]'}`}>
                      {item.isPublished ? '공개' : '비공개'}
                    </span>
                  </div>
                  <p className="m-0 mt-2 text-xs leading-5 text-slate-500">{item.summary || '요약이 없으면 카드에는 제목만 표시됩니다.'}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.articleUrl ? (
                      <a href={item.articleUrl} target="_blank" rel="noopener noreferrer" className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-extrabold text-slate-700 hover:bg-slate-50">
                        원문 확인
                      </a>
                    ) : (
                      <span className="rounded-md border border-[#f0c2c8] bg-[#fff7f8] px-2.5 py-1 text-xs font-black text-[#b42323]">뉴스 링크 없음</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => onEdit(item)} className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-extrabold text-slate-700 hover:bg-slate-50">
                  수정
                </button>
                <button type="button" onClick={() => onDelete(item)} className="rounded-md border border-[#e4a1a9] bg-[#fff5f6] px-2.5 py-1 text-xs font-extrabold text-[#b42323] hover:bg-[#ffe9ec]">
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AdminNewsForm({
  newsForm,
  newsFormPreview,
  selectedNewsFormCategory,
  normalizedNewsFormLink,
  editingNewsId,
  isSavingNews,
  isLoadingNewsPreview,
  newsPreviewError,
  onFormChange,
  onPreviewLoad,
  onSubmit,
  onResetForm,
  onImageError,
}) {
  return (
    <form className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3" onSubmit={onSubmit}>
      <h3 className="m-0 text-base font-black text-slate-900">{editingNewsId ? '뉴스 수정' : '뉴스 등록'}</h3>
      <p className="m-0 text-xs leading-5 text-slate-500">URL 하나만 붙여넣으면 카드 정보가 자동으로 채워집니다.</p>

      <label className="grid gap-1 text-xs font-bold text-slate-700">
        뉴스 URL*
        <input
          value={newsForm.articleUrl}
          onChange={(event) => onFormChange('articleUrl', event.target.value)}
          onBlur={() => onPreviewLoad({ force: true, overwrite: true })}
          className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm outline-none focus:border-[#c9252f]"
          placeholder="https://blog.naver.com/... 또는 뉴스 URL"
        />
      </label>
      {newsForm.articleUrl ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className={`m-0 text-[11px] font-bold ${normalizedNewsFormLink ? 'text-[#0f6d3d]' : 'text-[#b42323]'}`}>
            {normalizedNewsFormLink ? `${getNewsSourceLabel(normalizedNewsFormLink)} 링크가 감지되었습니다.` : '유효한 URL을 입력해주세요.'}
          </p>
          {isLoadingNewsPreview ? <span className="text-[11px] font-bold text-slate-500">미리보기 가져오는 중...</span> : null}
        </div>
      ) : null}
      {newsPreviewError ? <p className="m-0 text-[11px] font-bold text-[#b42323]">{newsPreviewError}</p> : null}

      <label className="grid gap-1 text-xs font-bold text-slate-700">
        뉴스 카테고리
        <select value={selectedNewsFormCategory} onChange={(event) => onFormChange('category', event.target.value)} className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm outline-none focus:border-[#c9252f]">
          {NEWS_CATEGORIES.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </label>

      {normalizedNewsFormLink ? (
        <a href={newsFormPreview.articleUrl} target="_blank" rel="noopener noreferrer" className="grid overflow-hidden rounded-lg border border-slate-200 bg-white text-inherit no-underline">
          <div className="aspect-[16/9] bg-slate-100">
            {newsFormPreview.image ? (
              <img src={newsFormPreview.image} alt={newsFormPreview.title} className="h-full w-full object-cover" onError={onImageError} />
            ) : (
              <div className="grid h-full w-full place-items-center text-xs font-black text-slate-400">
                {isLoadingNewsPreview ? '미리보기 불러오는 중' : '미리보기 이미지 없음'}
              </div>
            )}
          </div>
          <div className="grid gap-1 p-3">
            <p className="m-0 text-[11px] font-black uppercase tracking-[0.06em] text-[#b42323]">
              {selectedNewsFormCategory} · {newsFormPreview.sourceLabel || '외부 뉴스'}
            </p>
            <strong className="line-clamp-2 text-sm font-black leading-5 text-slate-900">{newsFormPreview.title}</strong>
            {newsFormPreview.summary ? <p className="m-0 line-clamp-2 text-xs leading-5 text-slate-500">{newsFormPreview.summary}</p> : null}
          </div>
        </a>
      ) : null}

      <label className="mt-1 inline-flex items-center gap-2 text-xs font-bold text-slate-700">
        <input type="checkbox" checked={newsForm.isPublished} onChange={(event) => onFormChange('isPublished', event.target.checked)} className="h-4 w-4 accent-[#c9252f]" />
        공개 상태
      </label>

      <div className="mt-1 flex gap-2">
        <button type="submit" disabled={isSavingNews} className="h-10 flex-1 rounded-md border border-[#c9252f] bg-[#c9252f] text-sm font-extrabold text-white disabled:opacity-60">
          {isSavingNews ? '저장 중...' : editingNewsId ? '수정 저장' : '뉴스 등록'}
        </button>
        <button type="button" onClick={onResetForm} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700">
          초기화
        </button>
      </div>
    </form>
  )
}
