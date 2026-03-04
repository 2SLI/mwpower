import './style.css'
import './firebase'
import '@fortawesome/fontawesome-free/css/all.min.css'

const bannerImages = [
  '/meanwell/banner/a8718d83-799f-40da-8008-5e2da1617712.jpg',
  '/meanwell/banner/209e5256-9bb3-4192-990d-c0bbe5f64964.jpg',
  '/meanwell/banner/e95542d6-71b0-4e3c-9e38-9420a259e2b5.jpg',
  '/meanwell/banner/baa6c341-0498-47a2-918e-6279022f3626.jpg',
]

document.querySelector('#app').innerHTML = `
  <a href="#" class="inquiry-fab" aria-label="Sales inquiry">
    <img src="/meanwell/email.png" alt="inquiry" />
  </a>

  <div class="page">
    <header class="header-top">
      <div class="header-inner">
        <a href="#" class="logo" aria-label="MEAN WELL">
          <span class="logo-mw">MW</span>
          <span class="logo-text">Meanwell</span>
        </a>

        <nav class="main-nav">
          <a href="#">Profile</a>
          <a href="#">Products</a>
          <a href="#" class="active">Virtual Expo</a>
          <a href="#">News</a>
          <a href="#">Service</a>
          <a href="#">FAQ</a>
          <a href="#">Distributors</a>
          <a href="#">Contact Us</a>
          <a href="#">Career</a>
          <a href="#">SDG Group</a>
        </nav>

        <div class="header-tools">
          <a href="#">Group Links</a>
          <a href="#">Partners</a>
          <a href="#">Login</a>
        </div>
      </div>
    </header>

    <section class="banner" aria-label="Main banners">
      <div class="banner-track">
        ${bannerImages
          .map(
            (src, i) => `
          <div class="banner-slide${i === 0 ? ' is-active' : ''}">
            <img src="${src}" alt="MEAN WELL banner ${i + 1}" />
          </div>`
          )
          .join('')}
      </div>
      <button class="banner-arrow prev" type="button" aria-label="Previous banner">‹</button>
      <button class="banner-arrow next" type="button" aria-label="Next banner">›</button>
      <div class="banner-dots">
        ${bannerImages
          .map(
            (_, i) =>
              `<button type="button" class="banner-dot${i === 0 ? ' is-active' : ''}" data-index="${i}" aria-label="Go to banner ${i + 1}"></button>`
          )
          .join('')}
      </div>
    </section>

    <section class="solutions">
      <article class="solutions-intro">
        <h2>Solutions</h2>
        <p>
          Focusing on the standard SPS market, MEAN WELL carries over 10,000 models
          of standard power supply products, to provide the power solutions for all
          types of applications.
        </p>
        <div class="solution-pager">
          <button type="button" aria-label="previous">‹</button>
          <button type="button" aria-label="next">›</button>
        </div>
      </article>

      <article class="solution-card">
        <img class="photo" src="/meanwell/index_1.jpg" alt="DC/DC" />
        <span class="icon-wrap"><img src="/meanwell/337c52c8-b570-4eef-b1ac-5f510a20a74b.png" alt="" /></span>
        <h3>DC/DC Converter Power Solutions</h3>
      </article>

      <article class="solution-card">
        <img class="photo" src="/meanwell/index-solutions-pic1.jpg" alt="LED" />
        <span class="icon-wrap"><img src="/meanwell/index-solutions-pics1_150x112.png" alt="" /></span>
        <h3>LED Power Solution</h3>
      </article>

      <article class="solution-card">
        <img class="photo" src="/meanwell/index-solutions-pic6.jpg" alt="Medical" />
        <span class="icon-wrap"><img src="/meanwell/index-solutions-pics2_150x112.png" alt="" /></span>
        <h3>Medical Power Solution</h3>
      </article>

      <article class="solution-card">
        <img class="photo" src="/meanwell/index-solutions-pic4.jpg" alt="Display" />
        <span class="icon-wrap"><img src="/meanwell/index-solutions-pics3_150x112.png" alt="" /></span>
        <h3>LED Display Solution</h3>
      </article>

      <article class="solution-card">
        <img class="photo" src="/meanwell/index-solutions-pic3.jpg" alt="Configurable" />
        <span class="icon-wrap"><img src="/meanwell/index-solutions-pics5_150x112.png" alt="" /></span>
        <h3>Configurable Power Solution</h3>
      </article>

      <article class="solution-card">
        <img class="photo" src="/meanwell/index-solutions-pic5.jpg" alt="Building" />
        <span class="icon-wrap"><img src="/meanwell/index-solutions-pics6_150x112.png" alt="" /></span>
        <h3>Building Power Solution</h3>
      </article>
    </section>

    <section class="news-panel">
      <div class="news-col">
        <h2>SDG Industry News</h2>
        <ul>
          <li><time>2025-08-12</time> SDG Group Drives Industrial Recovery Through ...</li>
          <li><time>2025-05-30</time> MEAN WELL Advances Boundary-Breaking Strategy...</li>
          <li><time>2025-04-22</time> MEAN WELL Group Releases 2024 Sustainability ...</li>
        </ul>
        <a href="#" class="more-link">-more-</a>
      </div>
      <div class="news-col">
        <h2>New Products</h2>
        <ul>
          <li><time>2026-02-25</time> ES-SU1K/3K Series: 1kW & 3kW Online UPS Syste...</li>
          <li><time>2026-01-28</time> BIC-5K Series: 5kW AC⇄DC Grid-Tied Bidirectio...</li>
          <li><time>2026-01-23</time> PLC-DPLC-32MT/ET Series: New Generation Progr...</li>
        </ul>
        <a href="#" class="more-link">-more-</a>
      </div>
      <div class="news-col">
        <h2>Product Notice</h2>
        <ul>
          <li><time>2025-12-30</time> Discontinued And End of Life Products Are Upd...</li>
          <li><time>2026-01-26</time> Product Upgrade Notice: UHP-1500/2500, PHP-35...</li>
          <li><time>2025-12-31</time> MEAN WELL Strengthens Global Certification wi...</li>
        </ul>
        <a href="#" class="more-link">-more-</a>
      </div>
    </section>

    <footer class="footer-links">
      <div class="social-col">
        <div class="social-icons-row">
          <a href="#" class="yt-text">YouTube</a>
          <a href="#" class="social-icon-box" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
          <a href="#" class="social-icon-box" aria-label="LinkedIn"><i class="fa-brands fa-linkedin-in"></i></a>
        </div>

        <div class="app-icons-row">
          <a href="#" class="app-icon-box"><i class="fa-solid fa-city"></i></a>
          <a href="#" class="app-icon-box"><i class="fa-brands fa-apple"></i></a>
          <a href="#" class="app-icon-box"><i class="fa-brands fa-google-play"></i></a>
        </div>

        <button type="button" class="subscribe-btn">E-NEWS SUBSCRIBE</button>
      </div>

      <div class="link-col">
        <h3>Profile</h3>
        <a href="#">About MEAN WELL</a>
        <a href="#">Message from Founder</a>
        <a href="#">Products & Services</a>
        <a href="#">Brand Story</a>
        <a href="#">Milestones</a>
      </div>

      <div class="link-col">
        <h3>Products</h3>
        <a href="#">Series Search</a>
        <a href="#">Quick Search</a>
        <a href="#">Downloads</a>
        <a href="#">Installation Manual</a>
      </div>

      <div class="link-col">
        <h3>Services</h3>
        <a href="#">Sales Inquiry</a>
        <a href="#">Technical Service</a>
        <a href="#">QC Report</a>
        <a href="#">Product Warranty Statement</a>
        <a href="#">Product Liability Disclaimer</a>
      </div>

      <div class="link-col">
        <h3>Group Links</h3>
        <a href="#">MEAN WELL GUANGZHOU</a>
        <a href="#">MEAN WELL SUZHOU</a>
        <a href="#">MEAN WELL USA, INC.</a>
        <a href="#">MEAN WELL EUROPE N.V.</a>
      </div>
    </footer>

    <section class="firebase-note">Firebase initialized: App/Auth/Firestore connected.</section>

    <aside class="cookie-bar">
      <p>
        We use cookies to enhance your experience. By continuing to visit this site
        you agree to our use of cookies.
        <a href="#">More info</a>
      </p>
      <button type="button">Got it!</button>
    </aside>
  </div>
`

const slides = Array.from(document.querySelectorAll('.banner-slide'))
const dots = Array.from(document.querySelectorAll('.banner-dot'))
const prevButton = document.querySelector('.banner-arrow.prev')
const nextButton = document.querySelector('.banner-arrow.next')

let currentSlide = 0
let autoplayTimer = null

function showSlide(index) {
  currentSlide = (index + slides.length) % slides.length

  slides.forEach((slide, i) => {
    slide.classList.toggle('is-active', i === currentSlide)
  })

  dots.forEach((dot, i) => {
    dot.classList.toggle('is-active', i === currentSlide)
  })
}

function restartAutoplay() {
  if (autoplayTimer) {
    clearInterval(autoplayTimer)
  }

  autoplayTimer = setInterval(() => {
    showSlide(currentSlide + 1)
  }, 4500)
}

prevButton?.addEventListener('click', () => {
  showSlide(currentSlide - 1)
  restartAutoplay()
})

nextButton?.addEventListener('click', () => {
  showSlide(currentSlide + 1)
  restartAutoplay()
})

dots.forEach((dot) => {
  dot.addEventListener('click', () => {
    const index = Number(dot.dataset.index)
    showSlide(index)
    restartAutoplay()
  })
})

restartAutoplay()
