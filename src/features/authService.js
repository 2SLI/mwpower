import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, updateProfile } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

function normalizeText(value = '') {
  return String(value ?? '').trim()
}

function getAuthErrorMessage(error) {
  const code = String(error?.code || '')
  if (code.includes('auth/popup-closed-by-user') || code.includes('auth/cancelled-popup-request')) return 'Google 로그인이 취소되었습니다.'
  if (code.includes('auth/popup-blocked')) return '브라우저에서 로그인 팝업이 차단되었습니다. 팝업을 허용한 뒤 다시 시도해주세요.'
  if (code.includes('auth/account-exists-with-different-credential')) return '같은 이메일로 가입된 다른 로그인 방식이 있습니다.'
  if (code.includes('auth/unauthorized-domain')) return '현재 도메인이 Firebase의 승인된 도메인에 등록되지 않았습니다.'
  if (code.includes('auth/too-many-requests')) return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
  if (code.includes('auth/operation-not-allowed')) return 'Firebase Authentication에서 Google 로그인을 활성화해주세요.'
  return error?.message || '로그인 처리 중 오류가 발생했습니다.'
}

export function subscribeAuthState(callback) {
  return onAuthStateChanged(auth, callback)
}

export async function ensureUserProfile(user, profile = {}) {
  if (!user?.uid) return null

  const userRef = doc(db, 'users', user.uid)
  const snapshot = await getDoc(userRef)
  const savedProfile = snapshot.exists() ? snapshot.data() : {}
  const nowClient = new Date().toISOString()
  const payload = {
    uid: user.uid,
    email: normalizeText(user.email || profile.email || savedProfile.email),
    displayName: normalizeText(
      Object.prototype.hasOwnProperty.call(profile, 'displayName')
        ? profile.displayName
        : savedProfile.displayName || user.displayName || ''
    ),
    phone: normalizeText(Object.prototype.hasOwnProperty.call(profile, 'phone') ? profile.phone : savedProfile.phone || ''),
    updatedAt: serverTimestamp(),
    updatedAtClient: nowClient,
  }

  await setDoc(
    userRef,
    snapshot.exists()
      ? payload
      : {
          ...payload,
          createdAt: serverTimestamp(),
          createdAtClient: nowClient,
        },
    { merge: true }
  )

  return { id: user.uid, ...payload }
}

export async function loadUserProfile(user) {
  if (!user?.uid) return null

  const userRef = doc(db, 'users', user.uid)
  const snapshot = await getDoc(userRef)
  if (!snapshot.exists()) return ensureUserProfile(user)
  return { id: snapshot.id, ...snapshot.data() }
}

export async function updateUserProfile({ user = auth.currentUser, displayName = '', phone = '' } = {}) {
  if (!user?.uid) throw new Error('로그인이 필요합니다.')

  const name = normalizeText(displayName)
  const normalizedPhone = normalizeText(phone)
  await updateProfile(user, { displayName: name })
  await ensureUserProfile(user, { displayName: name, phone: normalizedPhone })
  return { displayName: name, phone: normalizedPhone }
}

export async function loginWithGoogle() {
  try {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    const credential = await signInWithPopup(auth, provider)
    await ensureUserProfile(credential.user)
    return credential.user
  } catch (error) {
    throw new Error(getAuthErrorMessage(error))
  }
}

export async function logoutUser() {
  await signOut(auth)
}
