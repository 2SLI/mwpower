import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

function normalizeText(value = '') {
  return String(value ?? '').trim()
}

function getAuthErrorMessage(error) {
  const code = String(error?.code || '')
  if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password')) return '이메일 또는 비밀번호가 일치하지 않습니다.'
  if (code.includes('auth/user-not-found')) return '가입된 계정을 찾을 수 없습니다.'
  if (code.includes('auth/email-already-in-use')) return '이미 가입된 이메일입니다.'
  if (code.includes('auth/weak-password')) return '비밀번호는 6자 이상으로 입력해주세요.'
  if (code.includes('auth/invalid-email')) return '이메일 형식이 올바르지 않습니다.'
  if (code.includes('auth/missing-email')) return '이메일을 입력해주세요.'
  if (code.includes('auth/too-many-requests')) return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
  if (code.includes('auth/operation-not-allowed')) return 'Firebase Authentication에서 이메일/비밀번호 로그인을 활성화해주세요.'
  return error?.message || '로그인 처리 중 오류가 발생했습니다.'
}

export function subscribeAuthState(callback) {
  return onAuthStateChanged(auth, callback)
}

export async function ensureUserProfile(user, profile = {}) {
  if (!user?.uid) return null

  const userRef = doc(db, 'users', user.uid)
  const snapshot = await getDoc(userRef)
  const nowClient = new Date().toISOString()
  const payload = {
    uid: user.uid,
    email: normalizeText(user.email || profile.email),
    displayName: normalizeText(profile.displayName || user.displayName || ''),
    phone: normalizeText(profile.phone || ''),
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

export async function registerWithEmail({ email = '', password = '', displayName = '', phone = '' }) {
  try {
    const credential = await createUserWithEmailAndPassword(auth, normalizeText(email), password)
    const name = normalizeText(displayName)
    if (name) await updateProfile(credential.user, { displayName: name })
    await ensureUserProfile(credential.user, { displayName: name, phone })
    return credential.user
  } catch (error) {
    throw new Error(getAuthErrorMessage(error))
  }
}

export async function loginWithEmail({ email = '', password = '' }) {
  try {
    const credential = await signInWithEmailAndPassword(auth, normalizeText(email), password)
    await ensureUserProfile(credential.user)
    return credential.user
  } catch (error) {
    throw new Error(getAuthErrorMessage(error))
  }
}

export async function requestPasswordReset(email = '') {
  try {
    await sendPasswordResetEmail(auth, normalizeText(email))
  } catch (error) {
    throw new Error(getAuthErrorMessage(error))
  }
}

export async function logoutUser() {
  await signOut(auth)
}
