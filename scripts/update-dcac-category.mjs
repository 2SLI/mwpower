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

const dcac = {
  id: 'dc-ac',
  name: 'DC/AC',
  order: 3,
  subcategories: [
    'Modified Sine Wave',
    'True Sine Wave',
    'Solar Inverter',
    'AC↔DC Green Bidirectional Power',
  ],
}

await setDoc(doc(db, 'majorCategories', dcac.id), dcac, { merge: true })
console.log('Updated majorCategories/dc-ac from screenshot-based list.')
