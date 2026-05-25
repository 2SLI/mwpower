const crypto = require('node:crypto')
const admin = require('firebase-admin')
const { onRequest } = require('firebase-functions/v2/https')
const { logger } = require('firebase-functions')

admin.initializeApp()

const db = admin.firestore()

const NICEPAY_CLIENT_KEY = process.env.NICEPAY_CLIENT_KEY || ''
const NICEPAY_SECRET_KEY = process.env.NICEPAY_SECRET_KEY || ''
const NICEPAY_API_ORIGIN =
  process.env.NICEPAY_API_ORIGIN || (NICEPAY_CLIENT_KEY.startsWith('S') ? 'https://sandbox-api.nicepay.co.kr' : 'https://api.nicepay.co.kr')
const APP_ORIGIN = process.env.APP_ORIGIN || 'https://meanwellpower-103ae.web.app'

function sha256(value = '') {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function timingSafeEqualString(a = '', b = '') {
  const left = Buffer.from(String(a), 'utf8')
  const right = Buffer.from(String(b), 'utf8')
  return left.length === right.length && crypto.timingSafeEqual(left, right)
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body
  const raw = Buffer.isBuffer(req.rawBody) ? req.rawBody.toString('utf8') : String(req.body || '')
  const contentType = String(req.headers['content-type'] || '')

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(raw || '{}')
    } catch {
      return {}
    }
  }

  return Object.fromEntries(new URLSearchParams(raw))
}

function getSafeRedirectOrigin(value = '') {
  const origin = String(value || '').trim()
  if (!/^https?:\/\//i.test(origin)) return APP_ORIGIN

  try {
    const url = new URL(origin)
    return url.origin
  } catch {
    return APP_ORIGIN
  }
}

function redirectToOrder(res, orderId = '', query = {}, origin = APP_ORIGIN) {
  const params = new URLSearchParams(query)
  const suffix = params.toString() ? `?${params.toString()}` : ''
  const target = orderId ? `/order-complete/${encodeURIComponent(orderId)}${suffix}` : `/order-search${suffix}`
  res.redirect(303, new URL(target, getSafeRedirectOrigin(origin)).toString())
}

function getBasicAuthHeader() {
  const credentials = Buffer.from(`${NICEPAY_CLIENT_KEY}:${NICEPAY_SECRET_KEY}`, 'utf8').toString('base64')
  return `Basic ${credentials}`
}

function verifyAuthSignature(payload = {}) {
  const expected = sha256(`${payload.authToken || ''}${payload.clientId || ''}${payload.amount || ''}${NICEPAY_SECRET_KEY}`)
  return timingSafeEqualString(expected, payload.signature || '')
}

function verifyPaymentSignature(payload = {}) {
  if (!payload.signature || !payload.ediDate) return false
  const expected = sha256(`${payload.tid || ''}${payload.amount || ''}${payload.ediDate || ''}${NICEPAY_SECRET_KEY}`)
  return timingSafeEqualString(expected, payload.signature)
}

function normalizeSignatureHeader(value = '') {
  return String(value || '')
    .replace(/^signature\s+/i, '')
    .replace(/^sha256=/i, '')
    .trim()
}

function getRawBodyString(req) {
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody.toString('utf8')
  if (typeof req.body === 'string') return req.body
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8')
  return JSON.stringify(req.body || {})
}

function verifyWebhookSignature(req, authorization = '') {
  const signature = normalizeSignatureHeader(authorization)
  if (!signature) return false
  return timingSafeEqualString(sha256(`${getRawBodyString(req)}${NICEPAY_SECRET_KEY}`), signature)
}

function getNicepayPaymentStatus(status = '') {
  if (status === 'paid') return 'paid'
  if (status === 'failed') return 'failed'
  if (status === 'cancelled' || status === 'partialCancelled') return 'cancelled'
  if (status === 'expired') return 'expired'
  return 'waiting'
}

function isVbankPayment(payment = {}) {
  return String(payment.payMethod || '').toLowerCase() === 'vbank' || Boolean(payment.vbank)
}

function buildNicepayUpdate(payment = {}) {
  const paymentStatus = getNicepayPaymentStatus(payment.status)
  const now = new Date()
  const vbank = payment.vbank || null
  const update = {
    paymentMethod: 'nicepay_vbank',
    paymentStatus,
    paymentVbank: vbank,
    nicepay: {
      tid: payment.tid || null,
      status: payment.status || null,
      payMethod: payment.payMethod || null,
      amount: Number(payment.amount) || null,
      receiptUrl: payment.receiptUrl || null,
      resultCode: payment.resultCode || null,
      resultMsg: payment.resultMsg || null,
      vbank,
      paidAt: payment.paidAt || null,
      failedAt: payment.failedAt || null,
      cancelledAt: payment.cancelledAt || null,
      raw: payment,
    },
    updatedAt: now,
    updatedAtClient: now.toISOString(),
  }

  if (paymentStatus === 'paid') {
    update.orderStatus = 'preparing'
    update.paidAt = now
  }

  return update
}

async function approvePayment(tid, amount) {
  const body = {
    amount: Number(amount),
  }

  const response = await fetch(`${NICEPAY_API_ORIGIN}/v1/payments/${encodeURIComponent(tid)}`, {
    method: 'POST',
    headers: {
      Authorization: getBasicAuthHeader(),
      'Content-Type': 'application/json;charset=utf-8',
    },
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.resultMsg || `나이스페이 승인 API 오류: ${response.status}`)
    error.payment = data
    throw error
  }
  return data
}

exports.nicepayConfirm = onRequest({ region: 'asia-northeast3' }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed')
    return
  }

  if (!NICEPAY_CLIENT_KEY || !NICEPAY_SECRET_KEY) {
    res.status(500).send('Nicepay is not configured')
    return
  }

  const payload = parseBody(req)
  const orderId = String(payload.orderId || '').trim()
  const redirectOrigin = payload.mallReserved

  try {
    if (payload.authResultCode !== '0000') {
      await db.collection('orders').doc(orderId || 'unknown').set(
        {
          paymentMethod: 'nicepay_vbank',
          paymentStatus: 'failed',
          nicepay: {
            authResultCode: payload.authResultCode || null,
            authResultMsg: payload.authResultMsg || null,
            rawAuth: payload,
          },
          updatedAt: new Date(),
          updatedAtClient: new Date().toISOString(),
        },
        { merge: true }
      )
      redirectToOrder(res, orderId, { payment: 'failed' }, redirectOrigin)
      return
    }

    if (!orderId || !payload.tid || !payload.amount || !payload.authToken || !payload.signature) {
      throw new Error('나이스페이 인증 응답값이 부족합니다.')
    }
    if (payload.clientId !== NICEPAY_CLIENT_KEY) {
      throw new Error('나이스페이 클라이언트 키가 일치하지 않습니다.')
    }
    if (!verifyAuthSignature(payload)) {
      throw new Error('나이스페이 인증 서명이 일치하지 않습니다.')
    }

    const orderRef = db.collection('orders').doc(orderId)
    const orderSnapshot = await orderRef.get()
    if (!orderSnapshot.exists) throw new Error('주문 정보를 찾을 수 없습니다.')

    const order = orderSnapshot.data()
    const requestedAmount = Number(payload.amount)
    const orderAmount = Number(order.totalPrice)
    if (!Number.isFinite(requestedAmount) || requestedAmount !== orderAmount) {
      throw new Error('주문 금액과 결제 금액이 일치하지 않습니다.')
    }

    const payment = await approvePayment(payload.tid, requestedAmount)
    if (payment.resultCode !== '0000') {
      await orderRef.update({
        paymentMethod: 'nicepay_vbank',
        paymentStatus: 'failed',
        nicepay: {
          tid: payload.tid,
          resultCode: payment.resultCode || null,
          resultMsg: payment.resultMsg || null,
          rawAuth: payload,
          raw: payment,
        },
        updatedAt: new Date(),
        updatedAtClient: new Date().toISOString(),
      })
      redirectToOrder(res, orderId, { payment: 'failed' }, redirectOrigin)
      return
    }

    if (!isVbankPayment(payment)) {
      throw new Error('가상계좌 결제만 처리할 수 있습니다.')
    }

    if (!verifyPaymentSignature(payment)) {
      throw new Error('나이스페이 승인 응답 서명이 일치하지 않습니다.')
    }

    const update = buildNicepayUpdate(payment)
    update.nicepay.rawAuth = payload
    await orderRef.update(update)
    redirectToOrder(res, orderId, { payment: payment.status || 'ready' }, redirectOrigin)
  } catch (error) {
    logger.error('Nicepay confirm failed', { message: error.message, orderId, tid: payload.tid })
    if (orderId) {
      await db.collection('orders').doc(orderId).set(
        {
          paymentMethod: 'nicepay_vbank',
          paymentStatus: 'failed',
          'nicepay.error': error.message,
          'nicepay.rawAuth': payload,
          updatedAt: new Date(),
          updatedAtClient: new Date().toISOString(),
        },
        { merge: true }
      )
    }
    redirectToOrder(res, orderId, { payment: 'error' }, redirectOrigin)
  }
})

exports.nicepayWebhook = onRequest({ region: 'asia-northeast3' }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed')
    return
  }

  const payload = parseBody(req)
  const authorization = String(req.headers.authorization || '')
  if (NICEPAY_SECRET_KEY && !verifyWebhookSignature(req, authorization)) {
    res.status(400).type('text/html').send('Bad Request')
    return
  }

  const orderId = String(payload.orderId || '').trim()
  if (!orderId) {
    res.status(200).type('text/html').send('OK')
    return
  }

  try {
    const orderRef = db.collection('orders').doc(orderId)
    const orderSnapshot = await orderRef.get()
    if (!orderSnapshot.exists) {
      res.status(200).type('text/html').send('OK')
      return
    }

    const order = orderSnapshot.data()
    if (Number(payload.amount) === Number(order.totalPrice) && isVbankPayment(payload)) {
      await orderRef.update(buildNicepayUpdate(payload))
    } else {
      logger.error('Nicepay webhook skipped', { orderId, tid: payload.tid, payMethod: payload.payMethod })
    }
  } catch (error) {
    logger.error('Nicepay webhook failed', { message: error.message, orderId, tid: payload.tid })
  }

  res.status(200).type('text/html').send('OK')
})
