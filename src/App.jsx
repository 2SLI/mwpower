import { useState } from 'react'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { HomeView } from './views/HomeView'
import { ProductsView } from './views/ProductsView'
import { ServiceView } from './views/ServiceView'
import { ContactView } from './views/ContactView'
import { bannerImages } from './data/bannerImages'

function normalizeView(view) {
  if (view === 'products' || view === 'service' || view === 'contact') return view
  return 'home'
}

export default function App() {
  const [activeView, setActiveView] = useState('home')
  const [firebaseStatus, setFirebaseStatus] = useState('Firebase initialized: App/Auth/Firestore connected.')

  function handleNavigate(view) {
    setActiveView(normalizeView(view))
  }

  return (
    <>
      <a href="#" className={`inquiry-fab fixed right-2.5 top-1/2 z-40 grid h-[46px] w-[46px] -translate-y-1/2 place-items-center rounded-full bg-[#ea332d] max-[640px]:right-2 max-[640px]:h-10 max-[640px]:w-10 ${activeView === 'contact' ? 'is-hidden' : ''}`} aria-label="Sales inquiry">
        <i className="fa-solid fa-envelope text-[18px] text-white" aria-hidden="true"></i>
      </a>

      <div className="min-h-screen bg-slate-100 text-slate-600">
        <Header activeView={activeView} onNavigate={handleNavigate} />
        <main className="pt-[92px] max-[1280px]:pt-[62px]">
          <HomeView isActive={activeView === 'home'} bannerImages={bannerImages} onNavigate={handleNavigate} />
          <ProductsView isActive={activeView === 'products'} onStatusChange={setFirebaseStatus} />
          <ServiceView isActive={activeView === 'service'} />
          <ContactView isActive={activeView === 'contact'} />
        </main>
        <Footer />

        <section className="px-4 pb-16 pt-3 text-xs text-neutral-500" id="firebase-status">
          {firebaseStatus}
        </section>

        <aside className="fixed inset-x-0 bottom-0 z-50 flex min-h-[34px] items-center gap-2 bg-[#544d55] px-2.5 py-1.5 text-white max-[640px]:flex-wrap">
          <p className="m-0 text-[clamp(12px,0.8vw,29px)]">
            We use cookies to enhance your experience. By continuing to visit this site
            you agree to our use of cookies.
            <a className="text-[#e6cd3d]" href="#">
              {' '}
              More info
            </a>
          </p>
          <button type="button" className="ml-auto min-w-[98px] rounded bg-[#e6cd3d] px-2.5 py-1.5 text-[clamp(12px,0.82vw,22px)] text-black max-[640px]:ml-0">
            Got it!
          </button>
        </aside>
      </div>
    </>
  )
}
