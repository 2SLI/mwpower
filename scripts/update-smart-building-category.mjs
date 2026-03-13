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

const smartBuilding = {
  id: 'smart-building-solutions',
  name: 'Smart Building Solutions',
  order: 8,
  subcategories: ['Smart camera', 'UPS', 'Face recognition machine'],
}

await setDoc(doc(db, 'majorCategories', smartBuilding.id), smartBuilding, { merge: true })
console.log('Updated majorCategories/smart-building-solutions from screenshot-based list.')
