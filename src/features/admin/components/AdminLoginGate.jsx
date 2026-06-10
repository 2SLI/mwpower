export function AdminLoginGate({ password, authError, onPasswordChange, onSubmit }) {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-[460px] rounded-2xl border border-[#e8b2b9] bg-white p-5 shadow-[0_18px_40px_rgba(185,28,28,0.12)]">
        <p className="m-0 text-[11px] font-black uppercase tracking-[0.08em] text-[#b42323]">Admin</p>
        <h1 className="mb-0 mt-1 text-[28px] font-black tracking-[-0.02em] text-slate-900">관리자 로그인</h1>
        <p className="mb-0 mt-1 text-sm font-semibold text-slate-500">문의함, 견적함, 뉴스 관리를 위해 인증이 필요합니다.</p>

        <form className="mt-5 grid gap-3" onSubmit={onSubmit}>
          <label className="grid gap-1.5 text-sm font-bold text-slate-700" htmlFor="admin-password-input">
            비밀번호
            <input
              id="admin-password-input"
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              className="h-11 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-[#c9252f] focus:ring-2 focus:ring-[#f8d7db]"
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password"
            />
          </label>
          {authError ? <p className="m-0 rounded-lg bg-[#fff1f2] px-3 py-2 text-sm font-semibold text-[#b42323]">{authError}</p> : null}

          <button type="submit" className="h-11 rounded-lg border border-[#c9252f] bg-[#c9252f] text-sm font-extrabold text-white transition hover:bg-[#b81f29]">
            관리자 로그인
          </button>
          <a href="/" className="text-center text-sm font-bold text-slate-600 underline-offset-2 hover:underline">
            메인으로 이동
          </a>
        </form>
      </section>
    </div>
  )
}
