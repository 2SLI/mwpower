import { useEffect, useState } from 'react'
import { loginWithEmail, registerWithEmail } from '../features/authService'
import { normalizePhoneForOrder } from '../features/orderService'

const INITIAL_FORM = {
  email: '',
  password: '',
  displayName: '',
  phone: '',
}

export function LoginView({ isActive, authUser = null, onNavigateMyOrders }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState(INITIAL_FORM)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isActive) return
    setError('')
  }, [isActive, mode])

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: key === 'phone' ? normalizePhoneForOrder(value) : value }))
    if (error) setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    setError('')
    try {
      if (mode === 'signup') {
        await registerWithEmail(form)
      } else {
        await loginWithEmail(form)
      }
      onNavigateMyOrders?.()
    } catch (submitError) {
      setError(submitError.message || '로그인 처리 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className={`${isActive ? '' : 'is-hidden'} bg-[#f3f5f8] px-4 py-10 text-slate-800`} id="login-page">
      <div className="mx-auto grid max-w-[520px] gap-5">
        <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
          <p className="m-0 text-[12px] font-black uppercase tracking-[0.08em] text-[#d53232]">Account</p>
          <h1 className="m-0 mt-2 text-[32px] font-black tracking-[-0.02em] text-slate-950">{mode === 'signup' ? '회원가입' : '로그인'}</h1>
          <p className="m-0 mt-2 text-sm font-bold text-slate-500">로그인하면 주문번호 없이 내 주문내역을 확인할 수 있습니다.</p>
        </div>

        {authUser ? (
          <div className="grid gap-3 rounded-2xl bg-white p-5 text-center shadow-sm">
            <p className="m-0 text-sm font-bold text-slate-500">이미 로그인되어 있습니다.</p>
            <p className="m-0 text-lg font-black text-slate-950">{authUser.email}</p>
            <button type="button" onClick={onNavigateMyOrders} className="h-12 rounded-xl bg-slate-950 px-4 text-sm font-black text-white">
              내 주문내역 보기
            </button>
          </div>
        ) : (
          <form className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
              <button type="button" onClick={() => setMode('login')} className={`h-10 rounded-lg text-sm font-black ${mode === 'login' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>
                로그인
              </button>
              <button type="button" onClick={() => setMode('signup')} className={`h-10 rounded-lg text-sm font-black ${mode === 'signup' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>
                회원가입
              </button>
            </div>

            {mode === 'signup' ? (
              <>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  이름
                  <input value={form.displayName} onChange={(event) => handleChange('displayName', event.target.value)} className="h-11 rounded-xl bg-slate-50 px-3 text-sm outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-[#f0b7bd]" />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  연락처
                  <input value={form.phone} onChange={(event) => handleChange('phone', event.target.value)} placeholder="010-0000-0000" className="h-11 rounded-xl bg-slate-50 px-3 text-sm outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-[#f0b7bd]" />
                </label>
              </>
            ) : null}

            <label className="grid gap-1.5 text-sm font-bold text-slate-700">
              이메일
              <input type="email" value={form.email} onChange={(event) => handleChange('email', event.target.value)} className="h-11 rounded-xl bg-slate-50 px-3 text-sm outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-[#f0b7bd]" />
            </label>
            <label className="grid gap-1.5 text-sm font-bold text-slate-700">
              비밀번호
              <input type="password" value={form.password} onChange={(event) => handleChange('password', event.target.value)} className="h-11 rounded-xl bg-slate-50 px-3 text-sm outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-[#f0b7bd]" />
            </label>

            {error ? <p className="m-0 rounded-xl bg-[#fff1f2] px-3 py-2 text-sm font-bold text-[#b42323]">{error}</p> : null}

            <button type="submit" disabled={isSubmitting} className="h-12 rounded-xl bg-[#d53232] px-4 text-sm font-black text-white disabled:bg-slate-300">
              {isSubmitting ? '처리 중...' : mode === 'signup' ? '회원가입' : '로그인'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
