import { useEffect, useState } from 'react'
import { loginWithGoogle } from '../features/authService'

export function LoginView({ isActive, authUser = null, onNavigateMyOrders }) {
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isActive) return
    setError('')
  }, [isActive])

  const handleSubmit = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)
    setError('')
    try {
      await loginWithGoogle()
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
          <h1 className="m-0 mt-2 text-[32px] font-black tracking-[-0.02em] text-slate-950">로그인</h1>
          <p className="m-0 mt-2 text-sm font-bold text-slate-500">Google 계정으로 간편하게 로그인하고 주문내역을 확인하세요.</p>
        </div>

        {authUser ? (
          <div className="grid gap-3 rounded-2xl bg-white p-5 text-center shadow-sm">
            <p className="m-0 text-sm font-bold text-slate-500">이미 로그인되어 있습니다.</p>
            <p className="m-0 text-lg font-black text-slate-950">{authUser.email}</p>
            <button type="button" onClick={onNavigateMyOrders} className="h-12 rounded-xl bg-slate-950 px-4 text-sm font-black text-white">
              마이페이지 보기
            </button>
          </div>
        ) : (
          <div className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm">
            {error ? <p className="m-0 rounded-xl bg-[#fff1f2] px-3 py-2 text-sm font-bold text-[#b42323]">{error}</p> : null}
            <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="flex h-12 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 shadow-sm hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
                <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z" />
                <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.37l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
                <path fill="#FBBC05" d="M6.39 13.92A6.02 6.02 0 0 1 6.07 12c0-.67.12-1.31.32-1.92V7.46H3.04A10 10 0 0 0 2 12c0 1.63.39 3.17 1.04 4.54l3.35-2.62Z" />
                <path fill="#EA4335" d="M12 5.95c1.47 0 2.79.5 3.82 1.5l2.88-2.88A9.66 9.66 0 0 0 12 2a10 10 0 0 0-8.96 5.46l3.35 2.62C7.18 7.71 9.39 5.95 12 5.95Z" />
              </svg>
              {isSubmitting ? 'Google 로그인 중...' : 'Google 계정으로 로그인'}
            </button>
            <p className="m-0 text-center text-xs font-bold leading-5 text-slate-400">별도의 회원가입 없이 Google 계정으로 바로 이용할 수 있습니다.</p>
          </div>
        )}
      </div>
    </section>
  )
}
