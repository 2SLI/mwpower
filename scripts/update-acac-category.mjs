import { initializeApp } from 'firebase/app'
import { doc, setDoc, getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyB6HRLq6vFlBy7uvuMpd-VeKKdyKN4abY4',
  authDomain: 'meanwellpower-103ae.firebaseapp.com',
  projectId: 'meanwellpower-103ae',
  storageBucket: 'meanwellpower-103ae.firebasestorage.app',
  messagingSenderId: '459112128979',
  appId: '1:459112128979:web:dc0782d0d6c64318588f26',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const acac = {
  id: 'ac-ac',
  name: 'AC/AC',
  order: 4,
  subcategories: ['VFD'],
}

await setDoc(doc(db, 'majorCategories', acac.id), acac, { merge: true })
console.log('Updated majorCategories/ac-ac with single VFD subcategory.')
