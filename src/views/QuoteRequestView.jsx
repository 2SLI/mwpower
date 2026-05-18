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
    <div className="fixed inset-0 z-[1200] bg-slate-100/95 p-4 backdrop-blur-sm max-[640px]:p-2.5">
      <button
        type="button"
        className="absolute inset-0"
        onClick={() => onClose?.()}
        aria-label="견적요청 모달 닫기"
      ></button>

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="quote-request-modal-title"
        className="relative mx-auto flex h-[calc(100dvh-32px)] max-w-[1280px] flex-col overflow-hidden rounded-[28px] bg-[#f4f7fb] shadow-[0_18px_48px_rgba(15,23,42,0.16)] ring-1 ring-slate-200/80 max-[640px]:h-[calc(100dvh-20px)] max-[640px]:rounded-[24px]"
      >
        <header className="border-b border-slate-200/80 bg-white px-6 py-5 max-[640px]:px-4 max-[640px]:py-3.5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-[820px]">
              <p className="m-0 text-[11px] font-black uppercase tracking-[0.12em] text-[#d53232]">B2B Quote Flow</p>
              <h1 id="quote-request-modal-title" className="m-0 mt-1.5 text-[clamp(27px,2.2vw,38px)] font-black leading-[1.08] text-slate-950">
                견적요청서
              </h1>
            </div>

            <div className="flex items-center gap-2 self-start">
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">
                {quoteSummary.lineCount}개 항목 / 총 {quoteSummary.totalQuantity}개
              </span>
              <button
                type="button"
                className="inline-flex h-10 items-center gap-1.5 bg-transparent px-0 text-sm font-black text-[#0068d9] transition hover:text-[#004ea8]"
                onClick={() => onNavigateProducts?.()}
              >
                <span>계속 담기</span>
                <span className="text-lg leading-none" aria-hidden="true">›</span>
              </button>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl font-black text-slate-700 transition hover:bg-slate-200"
                onClick={() => onClose?.()}
                aria-label="견적요청 모달 닫기"
              >
                ×
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 max-[640px]:px-3.5 max-[640px]:py-3.5">
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
            <section className="grid gap-4 rounded-[24px] bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70 max-[640px]:rounded-[22px] max-[640px]:p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="m-0 text-[11px] font-black uppercase tracking-[0.08em] text-[#d53232]">Quote List</p>
                  <h2 className="m-0 mt-1 text-[22px] font-black text-slate-950">견적목록</h2>
                </div>
                {normalizedItems.length > 0 ? (
                  <button
                    type="button"
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-extrabold text-slate-600 transition hover:bg-slate-200"
                    onClick={() => onClearItems?.()}
                  >
                    목록 비우기
                  </button>
                ) : null}
              </div>

              {normalizedItems.length === 0 ? (
                <div className="grid gap-3 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
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

            <form className="grid gap-4 rounded-[24px] bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70 max-[640px]:rounded-[22px] max-[640px]:p-3.5" onSubmit={handleSubmit} noValidate>
              <div>
                <h2 className="m-0 text-[22px] font-black text-slate-950">견적 요청 정보</h2>
                <p className="m-0 mt-2 text-sm leading-6 text-slate-500">제품문의/기술문의와 분리된 B2B 견적 검토 전용 정보입니다.</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <QuoteField label="회사명" required>
                  <input
                    name="companyName"
                    value={form.companyName}
                    onChange={handleChange}
                    className="h-11 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none focus:border-[#d53232] focus:bg-white focus:shadow-[0_0_0_2px_#f7d8db]"
                  />
                </QuoteField>

                <QuoteField label="담당자명" required>
                  <input
                    name="contactName"
                    value={form.contactName}
                    onChange={handleChange}
                    className="h-11 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none focus:border-[#d53232] focus:bg-white focus:shadow-[0_0_0_2px_#f7d8db]"
                  />
                </QuoteField>

                <QuoteField label="이메일" required>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className="h-11 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none focus:border-[#d53232] focus:bg-white focus:shadow-[0_0_0_2px_#f7d8db]"
                  />
                </QuoteField>

                <QuoteField label="연락처" required>
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    className="h-11 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none focus:border-[#d53232] focus:bg-white focus:shadow-[0_0_0_2px_#f7d8db]"
                  />
                </QuoteField>

              </div>

              <QuoteField label="요청 메모">
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  className="min-h-[148px] rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none focus:border-[#d53232] focus:bg-white focus:shadow-[0_0_0_2px_#f7d8db]"
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
          </div>
        </div>
      </section>
    </div>,
    document.body
  )
}
