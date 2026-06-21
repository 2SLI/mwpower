import { useEffect, useState } from 'react'
import { loadUserProfile, requestPasswordReset, updateUserProfile } from '../features/authService'
import { BANK_ACCOUNT, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, formatOrderDate, formatOrderPrice, loadUserOrders, normalizePhoneForOrder } from '../features/orderService'

export function MyOrdersView({ isActive, authUser = null, onNavigateLogin }) {
  const [orders, setOrders] = useState([])
  const [profile, setProfile] = useState(null)
  const [profileForm, setProfileForm] = useState({ displayName: '', phone: '' })
  const [error, setError] = useState('')
  const [profileError, setProfileError] = useState('')
  const [profileMessage, setProfileMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isProfileSaving, setIsProfileSaving] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)

  const refreshOrders = async () => {
    if (!authUser?.uid) return
    setIsLoading(true)
    setError('')
    try {
      setOrders(await loadUserOrders(authUser.uid))
    } catch {
      setOrders([])
      setError('주문내역을 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (!authUser?.uid) return
    setProfileError('')
    try {
      const nextProfile = await loadUserProfile(authUser)
      setProfile(nextProfile)
      setProfileForm({
        displayName: nextProfile?.displayName || authUser.displayName || '',
        phone: nextProfile?.phone || '',
      })
    } catch {
      setProfileError('회원 정보를 불러오지 못했습니다.')
    }
  }

  useEffect(() => {
    if (!isActive) return
    if (!authUser?.uid) {
      setOrders([])
      setProfile(null)
      setProfileForm({ displayName: '', phone: '' })
      return
    }
    refreshProfile()
    refreshOrders()
  }, [isActive, authUser?.uid])

  const handleProfileChange = (key, value) => {
    setProfileForm((prev) => ({ ...prev, [key]: key === 'phone' ? normalizePhoneForOrder(value) : value }))
    if (profileError) setProfileError('')
    if (profileMessage) setProfileMessage('')
  }

  const handleProfileSubmit = async (event) => {
    event.preventDefault()
    if (!authUser?.uid || isProfileSaving) return
    setIsProfileSaving(true)
    setProfileError('')
    setProfileMessage('')
    try {
      const saved = await updateUserProfile({ user: authUser, ...profileForm })
      setProfile((prev) => ({ ...(prev || {}), ...saved }))
      setProfileMessage('회원 정보가 저장되었습니다.')
    } catch (saveError) {
      setProfileError(saveError.message || '회원 정보를 저장하지 못했습니다.')
    } finally {
      setIsProfileSaving(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!authUser?.email || isResettingPassword) return
    setIsResettingPassword(true)
    setProfileError('')
    setProfileMessage('')
    try {
      await requestPasswordReset(authUser.email)
      setProfileMessage('비밀번호 재설정 메일을 보냈습니다.')
    } catch (resetError) {
      setProfileError(resetError.message || '비밀번호 재설정 메일을 보내지 못했습니다.')
    } finally {
      setIsResettingPassword(false)
    }
  }

  return (
    <section className={`${isActive ? '' : 'is-hidden'} bg-[#f3f5f8] px-4 py-10 text-slate-800`} id="my-orders-page">
      <div className="mx-auto grid max-w-[960px] gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-3xl bg-white p-6 shadow-sm">
          <div>
            <p className="m-0 text-[12px] font-black uppercase tracking-[0.08em] text-[#d53232]">My Page</p>
            <h1 className="m-0 mt-2 text-[32px] font-black tracking-[-0.02em] text-slate-950">마이페이지</h1>
            <p className="m-0 mt-2 text-sm font-bold text-slate-500">회원 정보와 주문내역을 한 곳에서 확인합니다.</p>
          </div>
          {authUser ? (
            <button type="button" onClick={refreshOrders} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-200">
              주문 새로고침
            </button>
          ) : null}
        </div>

        {!authUser ? (
          <div className="grid gap-3 rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="m-0 text-sm font-bold text-slate-500">로그인이 필요합니다.</p>
            <button type="button" onClick={onNavigateLogin} className="mx-auto h-12 rounded-xl bg-[#d53232] px-6 text-sm font-black text-white">
              로그인하러 가기
            </button>
          </div>
        ) : (
          <>
            <section className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="m-0 text-[12px] font-black uppercase tracking-[0.08em] text-[#d53232]">Account</p>
                  <h2 className="m-0 mt-1 text-2xl font-black text-slate-950">회원 정보</h2>
                </div>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={isResettingPassword}
                  className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white disabled:bg-slate-300"
                >
                  {isResettingPassword ? '메일 발송 중...' : '비밀번호 재설정'}
                </button>
              </div>

              <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-700 sm:grid-cols-2">
                <div>
                  <p className="m-0 text-xs text-slate-500">이메일</p>
                  <p className="m-0 mt-1 break-all text-base font-black text-slate-950">{authUser.email || '-'}</p>
                </div>
                <div>
                  <p className="m-0 text-xs text-slate-500">가입 이름</p>
                  <p className="m-0 mt-1 text-base font-black text-slate-950">{profile?.displayName || authUser.displayName || '-'}</p>
                </div>
              </div>

              <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleProfileSubmit}>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  이름
                  <input value={profileForm.displayName} onChange={(event) => handleProfileChange('displayName', event.target.value)} className="h-11 rounded-xl bg-slate-50 px-3 text-sm outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-[#f0b7bd]" />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  연락처
                  <input value={profileForm.phone} onChange={(event) => handleProfileChange('phone', event.target.value)} placeholder="010-0000-0000" className="h-11 rounded-xl bg-slate-50 px-3 text-sm outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-[#f0b7bd]" />
                </label>
                <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                  <button type="submit" disabled={isProfileSaving} className="h-11 rounded-xl bg-[#d53232] px-5 text-sm font-black text-white disabled:bg-slate-300">
                    {isProfileSaving ? '저장 중...' : '회원 정보 저장'}
                  </button>
                  <button type="button" onClick={refreshProfile} className="h-11 rounded-xl bg-slate-100 px-5 text-sm font-black text-slate-700 hover:bg-slate-200">
                    정보 새로고침
                  </button>
                </div>
              </form>

              {profileError ? <p className="m-0 rounded-xl bg-[#fff1f2] px-3 py-2 text-sm font-bold text-[#b42323]">{profileError}</p> : null}
              {profileMessage ? <p className="m-0 rounded-xl bg-[#ecfdf3] px-3 py-2 text-sm font-bold text-[#087443]">{profileMessage}</p> : null}
            </section>

            {isLoading ? <p className="m-0 rounded-2xl bg-white p-4 text-sm font-bold text-slate-500 shadow-sm">주문내역을 불러오는 중입니다...</p> : null}
            {error ? <p className="m-0 rounded-2xl bg-white p-4 text-sm font-bold text-[#b42323] shadow-sm">{error}</p> : null}

            {orders.length === 0 && !isLoading ? (
              <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
                <p className="m-0 text-sm font-bold text-slate-500">아직 로그인 계정으로 주문한 내역이 없습니다.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {orders.map((order) => (
                  <article key={order.id || order.orderNumber} className="rounded-2xl bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="m-0 text-xl font-black text-slate-950">{order.orderNumber || order.id}</h2>
                        <p className="m-0 mt-1 text-sm font-bold text-slate-500">{formatOrderDate(order.createdAt, order.createdAtClient || '-')}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#fff7e6] px-3 py-1.5 text-sm font-black text-[#8a5a00]">
                          {PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus || '-'}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-black text-slate-700">
                          {ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus || '-'}
                        </span>
                      </div>
                    </div>
                    <dl className="mt-5 grid gap-3 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="font-bold text-slate-500">상품명</dt>
                        <dd className="m-0 text-right font-black text-slate-950">{order.productName || '-'}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="font-bold text-slate-500">수량</dt>
                        <dd className="m-0 font-black text-slate-950">{Number(order.quantity || 0).toLocaleString('ko-KR')}개</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="font-bold text-slate-500">금액</dt>
                        <dd className="m-0 font-black text-[#0aa04f]">{formatOrderPrice(order.totalPrice)}</dd>
                      </div>
                      <div className="grid gap-1 border-t border-slate-100 pt-3">
                        <dt className="font-bold text-slate-500">입금계좌</dt>
                        <dd className="m-0 font-bold leading-6 text-slate-800">
                          {order.nicepay?.vbank || order.paymentVbank
                            ? `${(order.nicepay?.vbank || order.paymentVbank).vbankName} ${(order.nicepay?.vbank || order.paymentVbank).vbankNumber}`
                            : `${BANK_ACCOUNT.bank} ${BANK_ACCOUNT.accountNumber} / ${BANK_ACCOUNT.holder}`}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
