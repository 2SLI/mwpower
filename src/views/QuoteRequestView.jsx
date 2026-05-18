import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { inventoryOptionModelsByBaseKey, productInventoryByModelKey } from '../data/productInventory'
import { db } from '../firebase'
import { getQuoteItemSummary, normalizeQuoteItems } from '../features/quoteCart'
import { normalizeLabel } from '../features/productCatalogService'
import { lockBodyScroll } from '../utils/bodyScrollLock'

const initialForm = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  message: '',
}

function normalizeText(value = '') {
  return String(value ?? '').trim()
}

function normalizeForm(form = {}) {
  return {
    companyName: normalizeText(form.companyName),
    contactName: normalizeText(form.contactName),
    email: normalizeText(form.email),
    phone: normalizeText(form.phone),
    message: normalizeText(form.message),
  }
}

function getInventoryRecord(modelName = '') {
  const key = normalizeLabel(modelName)
  if (!key) return null
  return productInventoryByModelKey[key] ?? null
}

function getInventoryQuantity(modelName = '') {
  const exact = getInventoryRecord(modelName)
  if (exact && Number.isFinite(Number(exact.quantity))) return Number(exact.quantity)

  const baseKey = normalizeLabel(modelName)
  const optionModels = Array.isArray(inventoryOptionModelsByBaseKey[baseKey]) ? inventoryOptionModelsByBaseKey[baseKey] : []
  if (optionModels.length === 0) return null

  return optionModels.reduce((sum, optionModel) => {
    const optionRecord = getInventoryRecord(optionModel)
    const quantity = Number(optionRecord?.quantity)
    return Number.isFinite(quantity) ? sum + quantity : sum
  }, 0)
}

function isOutOfStockQuoteItem(item = {}) {
  const modelName = normalizeText(item.optionModel || item.displayModel || item.baseModel)
  const quantity = getInventoryQuantity(modelName)
  return Number.isFinite(quantity) && quantity <= 0
}

function QuoteField({ label, required = false, children }) {
  return (
    <label className="grid gap-1.5 text-sm font-bold text-slate-700">
      <span>
        {label}
        {required ? <em className="not-italic text-[#d33131]"> *</em> : null}
      </span>
      {children}
    </label>
  )
}

export function QuoteRequestView({ isOpen, items, onClose, onNavigateProducts, onUpdateQuantity, onRemoveItem, onClearItems }) {
  const [form, setForm] = useState(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')
  const [submitError, setSubmitError] = useState('')
  const normalizedItems = useMemo(() => normalizeQuoteItems(items), [items])
  const quoteSummary = useMemo(() => getQuoteItemSummary(normalizedItems), [normalizedItems])

  useEffect(() => {
    if (!isOpen) return undefined
    return lockBodyScroll()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return undefined

    const handleEscape = (event) => {
      if (event.key !== 'Escape') return
      onClose?.()
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    const payload = normalizeForm(form)
    if (normalizedItems.length === 0) {
      setSubmitError('먼저 제품 상세에서 필요한 수량을 담아주세요.')
      setSubmitMessage('')
      return
    }

    if (!payload.companyName || !payload.contactName || !payload.email || !payload.phone) {
      setSubmitError('회사명, 담당자명, 이메일, 연락처는 필수 입력입니다.')
      setSubmitMessage('')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')
    setSubmitMessage('')

    try {
      await addDoc(collection(db, 'quoteRequests'), {
        ...payload,
        source: 'quote-request',
        requestType: 'b2b-quote',
        status: 'new',
        itemCount: quoteSummary.lineCount,
        totalQuantity: quoteSummary.totalQuantity,
        items: normalizedItems.map((item) => ({
          id: item.id,
          majorId: item.majorId,
          majorName: item.majorName,
          subcategory: item.subcategory,
          leaf: item.leaf,
          groupName: item.groupName,
          baseModel: item.baseModel,
          optionModel: item.optionModel,
          displayModel: item.displayModel,
          quantity: item.quantity,
          thumbnailUrl: item.thumbnailUrl,
          wattage: item.wattage,
          pdfUrl: item.pdfUrl,
          addedAt: item.addedAt,
        })),
        createdAt: serverTimestamp(),
        createdAtClient: new Date().toISOString(),
      })

      setForm(initialForm)
      onClearItems?.()
      setSubmitMessage('B2B 견적요청이 정상적으로 접수되었습니다. 담당자가 확인 후 회신드리겠습니다.')
    } catch (error) {
      setSubmitError('견적요청 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[1200] bg-[#f3f4f6]">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="quote-request-modal-title"
        className="flex h-dvh flex-col overflow-hidden bg-[#f3f4f6]"
      >
        <header className="shrink-0 bg-white">
          <div className="mx-auto grid h-[72px] max-w-[1180px] grid-cols-[1fr_auto_1fr] items-center px-5 max-[640px]:h-[58px] max-[640px]:px-3">
            <button type="button" className="inline-flex items-center gap-1.5 justify-self-start bg-transparent px-0 py-2 text-sm font-black text-[#0068d9] transition hover:text-[#004ea8]" onClick={() => onNavigateProducts?.()}>
              <span>계속 담기</span>
              <span className="text-lg leading-none" aria-hidden="true">›</span>
            </button>
            <h1 id="quote-request-modal-title" className="m-0 text-[22px] font-black text-slate-950 max-[640px]:text-lg">
              견적요청서
            </h1>
            <button type="button" className="grid h-10 w-10 place-items-center justify-self-end rounded-full bg-slate-100 text-xl font-black text-slate-700 transition hover:bg-slate-200 max-[640px]:h-9 max-[640px]:w-9" onClick={() => onClose?.()} aria-label="견적요청서 닫기">
              ×
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto grid max-w-[1180px] gap-6 px-5 py-9 lg:grid-cols-[minmax(0,1fr)_380px] max-[980px]:py-5 max-[640px]:px-3 max-[640px]:py-3">
            <div className="grid content-start gap-5">
              <section className="rounded-[18px] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70 max-[640px]:rounded-2xl max-[640px]:p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="m-0 text-[11px] font-black uppercase tracking-[0.12em] text-[#d53232]">B2B Quote</p>
                    <h2 className="m-0 mt-2 text-[21px] font-black text-slate-900">민웰파워 견적요청서</h2>
                    <p className="m-0 mt-3 text-sm font-semibold leading-6 text-slate-500">
                      견적 검토가 필요한 품목과 수량을 확인하고 담당자 정보를 입력해 주세요.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-black text-[#b4262e]">
                    B2B 검토 대상
                  </span>
                </div>
              </section>

              <section className="grid gap-4 rounded-[18px] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70 max-[640px]:rounded-2xl max-[640px]:p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="m-0 text-[11px] font-black uppercase tracking-[0.12em] text-[#d53232]">MWPOWER</p>
                    <h2 className="m-0 mt-2 text-[21px] font-black text-slate-900">견적목록</h2>
                  </div>
                  {normalizedItems.length > 0 ? (
                    <button
                      type="button"
                      className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-200"
                      onClick={() => onClearItems?.()}
                    >
                      목록 비우기
                    </button>
                  ) : null}
                </div>

              {normalizedItems.length === 0 ? (
                <div className="grid gap-3 rounded-2xl bg-slate-50 px-4 py-12 text-center ring-1 ring-dashed ring-slate-300">
                  <strong className="text-lg font-black text-slate-900">아직 담긴 품목이 없습니다.</strong>
                  <p className="m-0 text-sm leading-6 text-slate-500">제품 상세에서 수량을 정한 뒤 견적목록에 담아주세요.</p>
                  <div>
                    <button
                      type="button"
                      className="inline-flex h-11 items-center rounded-full bg-[#d53232] px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#bd2929]"
                      onClick={() => onNavigateProducts?.()}
                    >
                      제품 페이지로 이동
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3">
                  {normalizedItems.map((item) => (
                    <article key={item.id} className="rounded-[22px] bg-[#f8fafc] p-3 ring-1 ring-slate-200/80">
                      <div className="grid gap-4 md:grid-cols-[132px_minmax(0,1fr)] max-[640px]:grid-cols-[104px_minmax(0,1fr)]">
                        <div className="overflow-hidden rounded-[18px] bg-white p-2 ring-1 ring-slate-200/70">
                          {item.thumbnailUrl ? (
                            <img src={item.thumbnailUrl} alt={item.displayModel} className="aspect-[4/3] h-full w-full object-contain" loading="lazy" />
                          ) : (
                            <div className="grid aspect-[4/3] h-full w-full place-items-center text-[11px] font-black text-slate-400">NO IMAGE</div>
                          )}
                        </div>

                        <div className="grid gap-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="m-0 break-all text-[20px] font-black text-slate-950 max-[640px]:text-[17px]">{item.displayModel}</h3>
                              {item.optionModel && item.optionModel !== item.baseModel ? (
                                <p className="m-0 mt-1 text-xs font-semibold text-slate-500">기본 모델: {item.baseModel}</p>
                              ) : null}
                              {item.wattage ? <p className="m-0 mt-2 text-sm font-semibold text-slate-600">Wattage: {item.wattage}</p> : null}
                              {isOutOfStockQuoteItem(item) ? (
                                <span className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-[12px] font-black text-slate-500 ring-1 ring-slate-200">
                                  현재 재고 없음
                                </span>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              className="inline-flex h-9 items-center rounded-full bg-white px-3 text-xs font-extrabold text-slate-500 ring-1 ring-slate-100 transition hover:bg-rose-50 hover:text-[#b4262e] hover:ring-rose-100"
                              onClick={() => onRemoveItem?.(item.id)}
                            >
                              항목 삭제
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                              <span>
                                수량<em className="not-italic text-[#d33131]"> *</em>
                              </span>
                              <input
                                type="number"
                                min="1"
                                inputMode="numeric"
                                value={item.quantity}
                                onChange={(event) => onUpdateQuantity?.(item.id, event.target.value)}
                                className="h-10 w-24 rounded-full border border-slate-200 bg-white px-3 text-center text-base font-bold text-slate-950 outline-none focus:border-[#d53232] focus:shadow-[0_0_0_2px_#f7d8db]"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              </section>
            </div>

            <aside className="grid content-start gap-4">
              <form className="grid gap-5 rounded-[18px] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70 max-[640px]:p-4" onSubmit={handleSubmit} noValidate>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="m-0 text-xl font-black text-slate-900">요청 정보</h2>
                  </div>
                  <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                    {quoteSummary.lineCount}개 / {quoteSummary.totalQuantity}개
                  </span>
                </div>

              <div className="grid gap-4">
                <QuoteField label="회사명" required>
                  <input
                    name="companyName"
                    value={form.companyName}
                    onChange={handleChange}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none focus:border-[#d53232] focus:bg-white focus:shadow-[0_0_0_2px_#f7d8db]"
                  />
                </QuoteField>

                <QuoteField label="담당자명" required>
                  <input
                    name="contactName"
                    value={form.contactName}
                    onChange={handleChange}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none focus:border-[#d53232] focus:bg-white focus:shadow-[0_0_0_2px_#f7d8db]"
                  />
                </QuoteField>

                <QuoteField label="이메일" required>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none focus:border-[#d53232] focus:bg-white focus:shadow-[0_0_0_2px_#f7d8db]"
                  />
                </QuoteField>

                <QuoteField label="연락처" required>
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none focus:border-[#d53232] focus:bg-white focus:shadow-[0_0_0_2px_#f7d8db]"
                  />
                </QuoteField>

              </div>

              <QuoteField label="요청 메모">
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  className="min-h-[150px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none focus:border-[#d53232] focus:bg-white focus:shadow-[0_0_0_2px_#f7d8db]"
                  placeholder="예: 인증서 필요 여부, 예상 발주 시점, 납기 조건, 프로젝트 개요"
                ></textarea>
              </QuoteField>

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-[52px] rounded-full bg-[#d53232] px-4 text-base font-extrabold text-white shadow-sm transition hover:bg-[#bd2929] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? '견적요청 전송 중...' : '견적요청서 보내기'}
              </button>

              {submitMessage ? <p className="m-0 rounded-2xl bg-[#effcf3] px-3 py-3 text-sm font-semibold text-[#0f6d3d]">{submitMessage}</p> : null}
              {submitError ? <p className="m-0 rounded-2xl bg-[#fff1f2] px-3 py-3 text-sm font-semibold text-[#b42323]">{submitError}</p> : null}
              </form>

              <div className="rounded-[18px] bg-slate-900 px-5 py-4 text-white">
                <p className="m-0 text-sm font-black">상담문의 010-6358-3144</p>
                <p className="m-0 mt-1 text-xs font-semibold leading-5 text-white/65">긴급 납기나 대량 견적은 전화로 문의해주세요.</p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>,
    document.body
  )
}
