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
    const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth)

    savedState = {
      body: readInlineStyleSnapshot(body, ['overflow', 'paddingRight', 'touchAction', 'overscrollBehavior']),
      html: readInlineStyleSnapshot(html, ['overflow', 'overscrollBehavior']),
    }

    body.style.overflow = 'hidden'
    body.style.touchAction = 'none'
    body.style.overscrollBehavior = 'none'
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`
    }
    html.style.overflow = 'hidden'
    html.style.overscrollBehavior = 'none'
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
    savedState = null
  }
}
