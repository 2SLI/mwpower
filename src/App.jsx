import { useEffect, useState } from 'react'
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

function setMetaByName(name, content) {
  if (!name || !content) return
  let tag = document.querySelector(`meta[name="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function setMetaByProperty(property, content) {
  if (!property || !content) return
  let tag = document.querySelector(`meta[property="${property}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('property', property)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

export default function App() {
  const [activeView, setActiveView] = useState('home')
  const [firebaseStatus, setFirebaseStatus] = useState('Firebase initialized: App/Auth/Firestore connected.')

  useEffect(() => {
    const pageMeta = {
      home: {
        title: '민웰파워 | MEAN WELL 정품 공급업체',
        description: '민웰파워 사이트. MEAN WELL 전원공급장치 제품 정보와 기술지원, 정품확인, 상담 서비스를 제공합니다.',
      },
      products: {
        title: '상품 카테고리 | 민웰파워',
        description: 'MEAN WELL 제품 카테고리, 시리즈, 모델별 정보를 확인하고 스펙 문서를 조회할 수 있습니다.',
      },
      service: {
        title: '기술/정품 서비스 | 민웰파워',
        description: '민웰 정품 확인 방법과 기술 서비스 안내를 제공합니다.',
      },
      contact: {
        title: '문의하기 | 민웰파워',
        description: '민웰파워 제품 문의, 기술 상담, 공급 일정 상담을 접수하세요.',
      },
    }

    const current = pageMeta[activeView] ?? pageMeta.home
    document.title = current.title
    setMetaByName('description', current.description)
    setMetaByProperty('og:title', current.title)
    setMetaByProperty('og:description', current.description)
    setMetaByName('twitter:title', current.title)
    setMetaByName('twitter:description', current.description)
  }, [activeView])

  function handleNavigate(view) {
    setActiveView(normalizeView(view))
  }

  return (
    <>
      <a
        href="#"
        className={`inquiry-fab fixed right-2.5 top-1/2 z-40 grid h-[46px] w-[46px] -translate-y-1/2 place-items-center rounded-full bg-[#ea332d] max-[640px]:right-2 max-[640px]:h-10 max-[640px]:w-10 ${activeView === 'contact' ? 'is-hidden' : ''}`}
        aria-label="Sales inquiry"
        onClick={(event) => {
          event.preventDefault()
          handleNavigate('contact')
        }}
      >
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

      </div>
    </>
  )
}
