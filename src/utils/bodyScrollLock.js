let lockCount = 0
let savedState = null

function readInlineStyleSnapshot(element, keys) {
  const snapshot = {}
  keys.forEach((key) => {
    snapshot[key] = element.style[key]
  })
  return snapshot
}

function applyInlineStyleSnapshot(element, snapshot) {
  Object.entries(snapshot).forEach(([key, value]) => {
    element.style[key] = value
  })
}

export function lockBodyScroll() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {}
  }

  const body = document.body
  const html = document.documentElement

  if (!body || !html) {
    return () => {}
  }

  if (lockCount === 0) {
    const scrollY = window.scrollY || window.pageYOffset || 0
    const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth)

    savedState = {
      scrollY,
      body: readInlineStyleSnapshot(body, ['overflow', 'position', 'top', 'left', 'right', 'width', 'paddingRight']),
      html: readInlineStyleSnapshot(html, ['overflow']),
    }

    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`
    }
    html.style.overflow = 'hidden'
  }

  lockCount += 1
  let released = false

  return () => {
    if (released) return
    released = true
    lockCount = Math.max(0, lockCount - 1)
    if (lockCount !== 0) return
    if (!savedState) return

    applyInlineStyleSnapshot(body, savedState.body)
    applyInlineStyleSnapshot(html, savedState.html)
    window.scrollTo(0, savedState.scrollY)
    savedState = null
  }
}

