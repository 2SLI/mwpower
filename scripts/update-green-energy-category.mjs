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

const greenEnergy = {
  id: 'green-energy-solutions',
  name: 'Green Energy Solutions',
  order: 7,
  subcategories: [
    'Solar Panel',
    'Micro Inverter',
    'MPPT Controller',
    'Protable Power Station',
    'Balcony Storage Power',
    'Online UPS System',
    'Battery',
  ],
}

await setDoc(doc(db, 'majorCategories', greenEnergy.id), greenEnergy, { merge: true })
console.log('Updated majorCategories/green-energy-solutions from screenshot-based list.')
