export function initBannerSlider(root = document) {
  const slides = Array.from(root.querySelectorAll('.banner-slide'))
  const dots = Array.from(root.querySelectorAll('.banner-dot'))
  const prevButton = root.querySelector('.banner-arrow.prev')
  const nextButton = root.querySelector('.banner-arrow.next')

  if (slides.length === 0) return

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
    if (autoplayTimer) clearInterval(autoplayTimer)
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
}
