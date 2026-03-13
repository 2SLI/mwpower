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

const peripheral = {
  id: 'peripheral-accessory',
  name: 'Peripheral Accessory',
  order: 5,
  subcategories: [
    'AC Fan/DC Fan',
    'Distribution Component',
    'Lighting Fixtures',
    'Wire/Cable',
    'Distribution Box',
    '19 Rack Cabinet',
    'Accessory',
  ],
}

await setDoc(doc(db, 'majorCategories', peripheral.id), peripheral, { merge: true })
console.log('Updated majorCategories/peripheral-accessory from screenshot-based list.')
