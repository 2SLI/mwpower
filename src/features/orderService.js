import { collection, doc, getDoc, getDocs, orderBy, query, runTransaction, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { productInventoryByModelKey } from '../data/productInventory'
import { DEFAULT_PRODUCT_PRICE, productPriceByModelKey } from '../data/productPrices'
import { db } from '../firebase'
import { normalizeLabel } from './productCatalogService'

export const BANK_ACCOUNT = {
  bank: '국민은행',
  accountNumber: '000000-00-000000',
  holder: '주식회사 예시',
}

export const PAYMENT_STATUS_LABELS = {
  waiting: '입금대기',
  paid: '입금완료',
  failed: '결제실패',
  cancelled: '결제취소',
  expired: '입금기한만료',
}

export const ORDER_STATUS_LABELS = {
  pending: '접수대기',
  preparing: '상품준비중',
}

function normalizeText(value = '') {
  return String(value ?? '').trim()
}

export function normalizePhoneForOrder(value = '') {
  return String(value ?? '').replace(/[^\d-]/g, '')
}

export function formatOrderPrice(value) {
  const price = Number(value)
  if (!Number.isFinite(price) || price <= 0) return '별도 안내'
  return `${price.toLocaleString('ko-KR')}원`
}

export function formatOrderDate(value, fallback = '-') {
  if (!value) return fallback
  try {
    if (typeof value?.toDate === 'function') return value.toDate().toLocaleString('ko-KR')
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) return date.toLocaleString('ko-KR')
  } catch {
    return fallback
  }
  return fallback
}

export function generateOrderNumber() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  return `${y}${m}${d}-${random}`
}

export function resolveProductForOrder(productId = '') {
  const rawProductId = normalizeText(productId)
  const productKey = normalizeLabel(rawProductId)
  if (!productKey) {
    throw new Error('상품 정보가 없습니다.')
  }

  const inventoryRecord = productInventoryByModelKey[productKey] ?? null
  const productName = normalizeText(inventoryRecord?.model) || rawProductId
  const productPrice = Number(productPriceByModelKey[productKey] ?? DEFAULT_PRODUCT_PRICE)
  const stockQuantity = Number(inventoryRecord?.quantity)

  return {
    productId: productKey,
    productName,
    productPrice: Number.isFinite(productPrice) ? productPrice : 0,
    stockQuantity: Number.isFinite(stockQuantity) ? stockQuantity : null,
    inStock: inventoryRecord ? inventoryRecord.inStock === true && stockQuantity > 0 : false,
  }
}

export function validateOrderPayload(payload = {}) {
  const errors = {}
  const quantity = Number(payload.quantity)
  const stockQuantity = Number(payload.stockQuantity)
  const phone = normalizePhoneForOrder(payload.phone)

  if (!normalizeText(payload.customerName)) errors.customerName = '주문자명을 입력해주세요.'
  if (!phone) errors.phone = '연락처를 입력해주세요.'
  if (phone && !/^[\d-]+$/.test(phone)) errors.phone = '연락처는 숫자와 하이픈만 입력해주세요.'
  if (!normalizeText(payload.address)) errors.address = '주소를 입력해주세요.'
  if (!normalizeText(payload.detailAddress)) errors.detailAddress = '상세주소를 입력해주세요.'
  if (!Number.isFinite(quantity) || quantity < 1) errors.quantity = '수량은 1개 이상이어야 합니다.'
  if (Number.isFinite(quantity) && Number.isFinite(stockQuantity) && quantity > stockQuantity) {
    errors.quantity = `현재 재고 ${stockQuantity.toLocaleString('ko-KR')}개까지만 주문할 수 있습니다.`
  }

  return errors
}

function getInventoryStockRef(productId = '') {
  const id = normalizeLabel(productId)
  if (!id) throw new Error('상품 정보가 없습니다.')
  return doc(db, 'inventoryStock', id)
}

function getTransactionStockQuantity(snapshot, fallbackQuantity = null) {
  if (snapshot.exists()) {
    const quantity = Number(snapshot.data()?.quantity)
    return Number.isFinite(quantity) ? quantity : null
  }
  return Number.isFinite(Number(fallbackQuantity)) ? Number(fallbackQuantity) : null
}

async function createUniqueOrderRef(transaction) {
  let orderNumber = generateOrderNumber()
  let orderRef = doc(db, 'orders', orderNumber)

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const existing = await transaction.get(orderRef)
    if (!existing.exists()) return { orderNumber, orderRef }
    orderNumber = generateOrderNumber()
    orderRef = doc(db, 'orders', orderNumber)
  }

  throw new Error('주문번호 생성에 실패했습니다. 다시 시도해주세요.')
}

function buildStockRequestMap(items = []) {
  const stockRequests = new Map()
  items.forEach((item) => {
    const productId = normalizeText(item.productId)
    if (!productId) return
    const current = stockRequests.get(productId) ?? {
      productId,
      productName: item.productName,
      requestedQuantity: 0,
      fallbackQuantity: item.stockQuantity,
    }
    current.requestedQuantity += Math.max(1, Math.floor(Number(item.quantity) || 1))
    stockRequests.set(productId, current)
  })
  return Array.from(stockRequests.values())
}

function getOrderUserFields(payload = {}) {
  const userId = normalizeText(payload.userId)
  if (!userId) return { orderType: 'guest', userId: null, userEmail: '', userDisplayName: '' }
  return {
    orderType: 'member',
    userId,
    userEmail: normalizeText(payload.userEmail),
    userDisplayName: normalizeText(payload.userDisplayName),
  }
}

async function reserveStockAndCreateOrder({ items = [], orderDataFactory }) {
  return runTransaction(db, async (transaction) => {
    const stockRequests = buildStockRequestMap(items)
    const stockSnapshots = []

    for (const request of stockRequests) {
      const stockRef = getInventoryStockRef(request.productId)
      const snapshot = await transaction.get(stockRef)
      const currentQuantity = getTransactionStockQuantity(snapshot, request.fallbackQuantity)

      if (!Number.isFinite(currentQuantity) || currentQuantity <= 0) {
        throw new Error(`${request.productName}은 재고가 없어 주문할 수 없습니다.`)
      }
      if (request.requestedQuantity > currentQuantity) {
        throw new Error(
          `${request.productName}은 현재 재고 ${currentQuantity.toLocaleString('ko-KR')}개까지만 주문할 수 있습니다.`
        )
      }

      stockSnapshots.push({ ...request, stockRef, snapshot, currentQuantity })
    }

    const { orderNumber, orderRef } = await createUniqueOrderRef(transaction)
    const orderData = orderDataFactory(orderNumber)
    transaction.set(orderRef, orderData)

    stockSnapshots.forEach(({ stockRef, snapshot, productId, productName, requestedQuantity, fallbackQuantity, currentQuantity }) => {
      const nextQuantity = currentQuantity - requestedQuantity
      const payload = {
        modelKey: productId,
        model: productName,
        quantity: nextQuantity,
        inStock: nextQuantity > 0,
        lastOrderNumber: orderNumber,
        lastReservedQuantity: requestedQuantity,
        updatedAt: serverTimestamp(),
        updatedAtClient: new Date().toISOString(),
      }

      if (snapshot.exists()) {
        transaction.update(stockRef, payload)
      } else {
        transaction.set(stockRef, {
          ...payload,
          initialQuantity: Number.isFinite(Number(fallbackQuantity)) ? Number(fallbackQuantity) : currentQuantity,
          createdAt: serverTimestamp(),
          createdAtClient: new Date().toISOString(),
        })
      }
    })

    return orderData
  })
}

function normalizeOrderItemForCreate(item = {}) {
  const productId = normalizeText(item.productId || item.optionModel || item.displayModel || item.baseModel)
  const product = resolveProductForOrder(productId)
  const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1))
  return {
    productId: product.productId,
    productName: product.productName,
    productPrice: product.productPrice,
    quantity,
    totalPrice: product.productPrice * quantity,
    thumbnailUrl: normalizeText(item.thumbnailUrl),
    wattage: normalizeText(item.wattage),
    inStock: product.inStock,
    stockQuantity: product.stockQuantity,
  }
}

export async function createGuestOrder(payload = {}) {
  const product = resolveProductForOrder(payload.productId)
  if (!product.inStock) {
    throw new Error('재고가 없는 상품은 주문할 수 없습니다. 견적요청으로 문의해주세요.')
  }

  const quantity = Math.max(1, Math.floor(Number(payload.quantity)))
  const errors = validateOrderPayload({ ...payload, quantity, stockQuantity: product.stockQuantity })
  if (Object.keys(errors).length > 0) {
    const error = new Error('필수값을 확인해주세요.')
    error.validationErrors = errors
    throw error
  }

  const totalPrice = product.productPrice * quantity
  const nowClient = new Date().toISOString()

  return reserveStockAndCreateOrder({
    items: [{ ...product, quantity }],
    orderDataFactory: (orderNumber) => ({
      id: orderNumber,
      orderNumber,
      productId: product.productId,
      productName: product.productName,
      productPrice: product.productPrice,
      quantity,
      totalPrice,
      customerName: normalizeText(payload.customerName),
      phone: normalizePhoneForOrder(payload.phone),
      email: normalizeText(payload.email),
      address: normalizeText(payload.address),
      detailAddress: normalizeText(payload.detailAddress),
      deliveryMemo: normalizeText(payload.deliveryMemo),
      ...getOrderUserFields(payload),
      paymentMethod: 'manual_bank_transfer',
      paymentStatus: 'waiting',
      orderStatus: 'pending',
      adminMemo: '',
      paidAt: null,
      stockReserved: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdAtClient: nowClient,
      updatedAtClient: nowClient,
    }),
  })
}

export async function createGuestOrderFromItems(payload = {}) {
  const items = Array.isArray(payload.items) ? payload.items.map(normalizeOrderItemForCreate) : []
  if (items.length === 0) {
    throw new Error('주문할 상품이 없습니다.')
  }

  const outOfStockItem = items.find((item) => !item.inStock)
  if (outOfStockItem) {
    throw new Error(`${outOfStockItem.productName}은 재고가 없어 주문할 수 없습니다.`)
  }

  const overStockItem = items.find((item) => Number.isFinite(Number(item.stockQuantity)) && item.quantity > Number(item.stockQuantity))
  if (overStockItem) {
    throw new Error(
      `${overStockItem.productName}은 현재 재고 ${Number(overStockItem.stockQuantity).toLocaleString('ko-KR')}개까지만 주문할 수 있습니다.`
    )
  }

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
  const validationErrors = validateOrderPayload({ ...payload, quantity: totalQuantity })
  if (Object.keys(validationErrors).length > 0) {
    const error = new Error('필수값을 확인해주세요.')
    error.validationErrors = validationErrors
    throw error
  }

  const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0)
  const firstItem = items[0]
  const productName = items.length === 1 ? firstItem.productName : `${firstItem.productName} 외 ${items.length - 1}개 품목`
  const nowClient = new Date().toISOString()

  return reserveStockAndCreateOrder({
    items,
    orderDataFactory: (orderNumber) => ({
      id: orderNumber,
      orderNumber,
      productId: firstItem.productId,
      productName,
      productPrice: firstItem.productPrice,
      quantity: totalQuantity,
      totalPrice,
      items: items.map(({ inStock, stockQuantity, ...item }) => item),
      customerName: normalizeText(payload.customerName),
      phone: normalizePhoneForOrder(payload.phone),
      email: normalizeText(payload.email),
      address: normalizeText(payload.address),
      detailAddress: normalizeText(payload.detailAddress),
      deliveryMemo: normalizeText(payload.deliveryMemo),
      ...getOrderUserFields(payload),
      paymentMethod: 'manual_bank_transfer',
      paymentStatus: 'waiting',
      orderStatus: 'pending',
      adminMemo: '',
      paidAt: null,
      stockReserved: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdAtClient: nowClient,
      updatedAtClient: nowClient,
    }),
  })
}

export async function getOrderByOrderNumber(orderNumber = '') {
  const id = normalizeText(orderNumber)
  if (!id) return null
  const snapshot = await getDoc(doc(db, 'orders', id))
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() }
}

export async function findGuestOrder(orderNumber = '', phone = '') {
  const order = await getOrderByOrderNumber(orderNumber)
  if (!order) return null
  if (normalizePhoneForOrder(order.phone) !== normalizePhoneForOrder(phone)) return null
  return order
}

function sortOrdersByCreatedAtDesc(items = []) {
  return [...items].sort((a, b) => {
    const at = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAtClient || 0).getTime()
    const bt = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAtClient || 0).getTime()
    return (Number.isFinite(bt) ? bt : 0) - (Number.isFinite(at) ? at : 0)
  })
}

export async function loadAdminOrders() {
  try {
    const snapshot = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')))
    return sortOrdersByCreatedAtDesc(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
  } catch {
    const snapshot = await getDocs(collection(db, 'orders'))
    return sortOrdersByCreatedAtDesc(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
  }
}

export async function loadUserOrders(userId = '') {
  const id = normalizeText(userId)
  if (!id) return []

  try {
    const snapshot = await getDocs(query(collection(db, 'orders'), where('userId', '==', id), orderBy('createdAt', 'desc')))
    return sortOrdersByCreatedAtDesc(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
  } catch {
    const snapshot = await getDocs(query(collection(db, 'orders'), where('userId', '==', id)))
    return sortOrdersByCreatedAtDesc(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
  }
}

export async function markOrderPaid(orderNumber = '') {
  const id = normalizeText(orderNumber)
  if (!id) throw new Error('주문번호가 없습니다.')
  await updateDoc(doc(db, 'orders', id), {
    paymentStatus: 'paid',
    orderStatus: 'preparing',
    paidAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedAtClient: new Date().toISOString(),
  })
}

export async function syncNicepayPayment(orderNumber = '') {
  const id = normalizeText(orderNumber)
  if (!id) throw new Error('주문번호가 없습니다.')

  const response = await fetch('/api/nicepay/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderId: id }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.ok !== true) {
    throw new Error(data.message || '나이스페이 입금 상태 확인에 실패했습니다.')
  }

  return data
}

export async function saveOrderAdminMemo(orderNumber = '', adminMemo = '') {
  const id = normalizeText(orderNumber)
  if (!id) throw new Error('주문번호가 없습니다.')
  await updateDoc(doc(db, 'orders', id), {
    adminMemo: normalizeText(adminMemo),
    updatedAt: serverTimestamp(),
    updatedAtClient: new Date().toISOString(),
  })
}
