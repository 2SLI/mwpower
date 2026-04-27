import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { formatQuoteItemPath, getQuoteItemSummary, normalizeQuoteItems } from '../features/quoteCart'
import { lockBodyScroll } from '../utils/bodyScrollLock'

const initialForm = {
  companyName: '',
  contactName: '',
  department: '',
  email: '',
  phone: '',
  businessNumber: '',
  shippingRegion: '',
  message: '',
}

function normalizeText(value = '') {
  return String(value ?? '').trim()
}

function normalizeForm(form = {}) {
  return {
    companyName: normalizeText(form.companyName),
    contactName: normalizeText(form.contactName),
    department: normalizeText(form.department),
    email: normalizeText(form.email),
    phone: normalizeText(form.phone),
    businessNumber: normalizeText(form.businessNumber),
    shippingRegion: normalizeText(form.shippingRegion),
    message: normalizeText(form.message),
  }
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

export function QuoteRequestView({ isOpen, items, onClose, onUpdateQuantity, onRemoveItem, onClearItems }) {
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
    <div className="fixed inset-0 z-[1200] p-4 max-[640px]:p-2.5">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/45"
        onClick={() => onClose?.()}
        aria-label="견적요청 모달 닫기"
      ></button>

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="quote-request-modal-title"
        className="relative mx-auto flex h-[calc(100dvh-32px)] max-w-[1380px] flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-slate-100 shadow-[0_32px_80px_rgba(15,23,42,0.34)] max-[640px]:h-[calc(100dvh-20px)] max-[640px]:rounded-[28px]"
      >
        <header className="border-b border-[#edd2d6] bg-[linear-gradient(135deg,#fff8f7_0%,#fff1f1_48%,#f8fafc_100%)] px-5 py-4 max-[640px]:px-4 max-[640px]:py-3.5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-[820px]">
              <p className="m-0 text-[11px] font-black uppercase tracking-[0.12em] text-[#be272f]">B2B Quote Flow</p>
              <h1 id="quote-request-modal-title" className="m-0 mt-2 text-[clamp(28px,2.5vw,42px)] font-black leading-[1.05] tracking-[-0.03em] text-slate-900">
                견적요청서
              </h1>
              <p className="m-0 mt-2 text-sm leading-6 text-slate-600">
                현재 보고 있던 화면은 그대로 유지한 채 견적서를 정리할 수 있게 모달로 열립니다. 품목별 수량과 메모를 확인한 뒤 바로 전송하세요.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start">
              <span className="rounded-full bg-[#fff3f4] px-3 py-1.5 text-xs font-black text-[#b4262e]">
                {quoteSummary.lineCount}개 항목 / 총 {quoteSummary.totalQuantity}개
              </span>
              <button
                type="button"
                className="inline-flex h-11 items-center rounded-full border border-slate-300 bg-white px-4 text-sm font-extrabold text-slate-700 transition hover:border-[#d4555b] hover:bg-[#fff6f7] hover:text-[#b4262e]"
                onClick={() => onClose?.()}
              >
                계속 담기
              </button>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-xl font-black text-slate-700 transition hover:border-[#d4555b] hover:bg-[#fff6f7] hover:text-[#b4262e]"
                onClick={() => onClose?.()}
                aria-label="견적요청 모달 닫기"
              >
                ×
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 max-[640px]:px-3.5 max-[640px]:py-3.5">
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
            <section className="grid gap-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_16px_34px_rgba(15,23,42,0.06)] max-[640px]:rounded-3xl max-[640px]:p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="m-0 text-[11px] font-black uppercase tracking-[0.08em] text-[#be272f]">Order List</p>
                  <h2 className="m-0 mt-1 text-[24px] font-black tracking-[-0.02em] text-slate-900">주문목록</h2>
                </div>
                {normalizedItems.length > 0 ? (
                  <button
                    type="button"
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-700 transition hover:bg-slate-50"
                    onClick={() => onClearItems?.()}
                  >
                    목록 비우기
                  </button>
                ) : null}
              </div>

              {normalizedItems.length === 0 ? (
                <div className="grid gap-3 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
                  <strong className="text-lg font-black text-slate-900">아직 담긴 품목이 없습니다.</strong>
                  <p className="m-0 text-sm leading-6 text-slate-500">제품 상세에서 수량을 정한 뒤 주문목록에 담아주세요.</p>
                  <div>
                    <button
                      type="button"
                      className="inline-flex h-11 items-center rounded-full bg-[linear-gradient(135deg,#e1453b_0%,#b9252d_100%)] px-5 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(185,37,45,0.24)]"
                      onClick={() => onClose?.()}
                    >
                      제품으로 돌아가기
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3">
                  {normalizedItems.map((item) => (
                    <article key={item.id} className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="m-0 text-[11px] font-black uppercase tracking-[0.08em] text-[#be272f]">{formatQuoteItemPath(item) || '제품 정보'}</p>
                          <h3 className="m-0 mt-1 break-all text-[22px] font-black tracking-[-0.02em] text-slate-900">{item.displayModel}</h3>
                          {item.optionModel && item.optionModel !== item.baseModel ? (
                            <p className="m-0 mt-1 text-xs font-semibold text-slate-500">기본 모델: {item.baseModel}</p>
                          ) : null}
                          {item.wattage ? <p className="m-0 mt-2 text-sm font-semibold text-slate-600">Wattage: {item.wattage}</p> : null}
                        </div>
                        <button
                          type="button"
                          className="inline-flex h-10 items-center rounded-full border border-[#e6b1b7] bg-white px-3 text-xs font-extrabold text-[#b4262e] transition hover:bg-[#fff5f6]"
                          onClick={() => onRemoveItem?.(item.id)}
                        >
                          항목 삭제
                        </button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-[130px]">
                        <QuoteField label="수량" required>
                          <input
                            type="number"
                            min="1"
                            inputMode="numeric"
                            value={item.quantity}
                            onChange={(event) => onUpdateQuantity?.(item.id, event.target.value)}
                            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-base font-bold text-slate-900 outline-none focus:border-[#c83434] focus:shadow-[0_0_0_2px_#f7d8db]"
                          />
                        </QuoteField>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <form className="grid gap-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_16px_34px_rgba(15,23,42,0.06)] max-[640px]:rounded-3xl max-[640px]:p-3.5" onSubmit={handleSubmit} noValidate>
              <div>
                <p className="m-0 text-[11px] font-black uppercase tracking-[0.08em] text-[#be272f]">Company Information</p>
                <h2 className="m-0 mt-1 text-[24px] font-black tracking-[-0.02em] text-slate-900">견적 요청 정보</h2>
                <p className="m-0 mt-2 text-sm leading-6 text-slate-500">제품문의/기술문의와 분리된 B2B 견적 검토 전용 정보입니다.</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <QuoteField label="회사명" required>
                  <input
                    name="companyName"
                    value={form.companyName}
                    onChange={handleChange}
                    className="h-11 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-[#c83434] focus:bg-white focus:shadow-[0_0_0_2px_#f7d8db]"
                  />
                </QuoteField>

                <QuoteField label="담당자명" required>
                  <input
                    name="contactName"
                    value={form.contactName}
                    onChange={handleChange}
                    className="h-11 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-[#c83434] focus:bg-white focus:shadow-[0_0_0_2px_#f7d8db]"
                  />
                </QuoteField>

                <QuoteField label="부서 / 직함">
                  <input
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    className="h-11 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-[#c83434] focus:bg-white focus:shadow-[0_0_0_2px_#f7d8db]"
                  />
                </QuoteField>

                <QuoteField label="사업자등록번호">
                  <input
                    name="businessNumber"
                    value={form.businessNumber}
                    onChange={handleChange}
                    className="h-11 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-[#c83434] focus:bg-white focus:shadow-[0_0_0_2px_#f7d8db]"
                  />
                </QuoteField>

                <QuoteField label="이메일" required>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className="h-11 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-[#c83434] focus:bg-white focus:shadow-[0_0_0_2px_#f7d8db]"
                  />
                </QuoteField>

                <QuoteField label="연락처" required>
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    className="h-11 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-[#c83434] focus:bg-white focus:shadow-[0_0_0_2px_#f7d8db]"
                  />
                </QuoteField>

              </div>

              <QuoteField label="납품 지역 / 현장">
                <input
                  name="shippingRegion"
                  value={form.shippingRegion}
                  onChange={handleChange}
                  className="h-11 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-[#c83434] focus:bg-white focus:shadow-[0_0_0_2px_#f7d8db]"
                />
              </QuoteField>

              <QuoteField label="요청 메모">
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  className="min-h-[148px] rounded-2xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none focus:border-[#c83434] focus:bg-white focus:shadow-[0_0_0_2px_#f7d8db]"
                  placeholder="예: 인증서 필요 여부, 예상 발주 시점, 납기 조건, 프로젝트 개요"
                ></textarea>
              </QuoteField>

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-[52px] rounded-2xl bg-[linear-gradient(135deg,#e1453b_0%,#b9252d_100%)] px-4 text-base font-extrabold text-white shadow-[0_16px_30px_rgba(185,37,45,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
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
