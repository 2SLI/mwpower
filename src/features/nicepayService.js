const NICEPAY_SDK_URL = import.meta.env.VITE_NICEPAY_SDK_URL || 'https://pay.nicepay.co.kr/v1/js/'
const DEFAULT_NICEPAY_CLIENT_KEY = 'S2_712398b21c5f4a59a95b6b9d1a05f59c'
const NICEPAY_CLIENT_KEY = String(import.meta.env.VITE_NICEPAY_CLIENT_KEY || DEFAULT_NICEPAY_CLIENT_KEY).trim()
const NICEPAY_RETURN_URL = import.meta.env.VITE_NICEPAY_RETURN_URL || '/api/nicepay/confirm'

let nicepaySdkPromise = null

function getAbsoluteUrl(pathOrUrl = '') {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  if (typeof window === 'undefined') return pathOrUrl
  return new URL(pathOrUrl, window.location.origin).toString()
}

function normalizeDigits(value = '') {
  return String(value ?? '').replace(/\D/g, '')
}

function loadNicepaySdk() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('브라우저에서만 결제를 시작할 수 있습니다.'))
  }
  if (window.AUTHNICE?.requestPay) return Promise.resolve(window.AUTHNICE)
  if (nicepaySdkPromise) return nicepaySdkPromise

  nicepaySdkPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${NICEPAY_SDK_URL}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(window.AUTHNICE), { once: true })
      existing.addEventListener('error', () => reject(new Error('나이스페이 결제창을 불러오지 못했습니다.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = NICEPAY_SDK_URL
    script.async = true
    script.onload = () => {
      if (window.AUTHNICE?.requestPay) {
        resolve(window.AUTHNICE)
      } else {
        reject(new Error('나이스페이 결제창 초기화에 실패했습니다.'))
      }
    }
    script.onerror = () => reject(new Error('나이스페이 결제창을 불러오지 못했습니다.'))
    document.head.appendChild(script)
  })

  return nicepaySdkPromise
}

export async function requestNicepayVbankPayment(order = {}) {
  const clientId = NICEPAY_CLIENT_KEY || DEFAULT_NICEPAY_CLIENT_KEY
  if (!clientId) {
    throw new Error('나이스페이 클라이언트 키가 설정되지 않았습니다.')
  }

  const orderId = String(order.orderNumber || order.id || '').trim()
  const amount = Number(order.totalPrice)
  if (!orderId || !Number.isFinite(amount) || amount <= 0) {
    throw new Error('결제할 주문 정보가 올바르지 않습니다.')
  }

  const nicepay = await loadNicepaySdk()
  nicepay.requestPay({
    clientId,
    method: 'vbank',
    orderId,
    amount,
    goodsName: String(order.productName || '민웰파워 상품').slice(0, 40),
    returnUrl: getAbsoluteUrl(NICEPAY_RETURN_URL),
    mallReserved: typeof window === 'undefined' ? undefined : window.location.origin,
    vbankHolder: String(order.customerName || '민웰파워').slice(0, 40),
    buyerName: order.customerName || undefined,
    buyerTel: normalizeDigits(order.phone) || undefined,
    buyerEmail: order.email || undefined,
    fnError(result) {
      const message = result?.errorMsg || result?.resultMsg || '나이스페이 결제창 호출 중 오류가 발생했습니다.'
      window.alert(message)
    },
  })
}
