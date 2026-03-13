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

const majorCategories = [
  {
    id: 'ac-dc',
    name: 'AC/DC',
    order: 1,
    subcategories: [
      'Enclosed Type',
      'Programmable Power',
      'DIN Rail',
      'Open Frame',
      'Security & Specific',
      'Rack Power',
      'Configurable',
      'LED Driver',
      'Charger',
      'Adaptor',
      'KNX',
      'AC/DC Green Bidirectional Power',
      'LED Accessory',
    ],
  },
  {
    id: 'dc-dc',
    name: 'DC/DC',
    order: 2,
    subcategories: ['Isolated Converter', 'Non-Isolated Converter', 'Quarter Brick', 'Half Brick'],
  },
  {
    id: 'dc-ac',
    name: 'DC/AC',
    order: 3,
    subcategories: ['Inverter', 'Grid-Tie Inverter', 'Pure Sine Wave', 'Vehicle Inverter'],
  },
  {
    id: 'ac-ac',
    name: 'AC/AC',
    order: 4,
    subcategories: ['UPS System', 'Frequency Converter', 'Voltage Stabilizer'],
  },
  {
    id: 'peripheral-accessory',
    name: 'Peripheral Accessory',
    order: 5,
    subcategories: ['Battery Module', 'Communication Module', 'Remote Controller', 'Power Cable'],
  },
  {
    id: 'automation',
    name: 'Automation',
    order: 6,
    subcategories: ['PLC', 'HMI', 'Industrial Control', 'I/O Module'],
  },
  {
    id: 'green-energy-solutions',
    name: 'Green Energy Solutions',
    order: 7,
    subcategories: ['PV Inverter', 'Energy Storage', 'EV Charger', 'Micro Inverter'],
  },
  {
    id: 'smart-building-solutions',
    name: 'Smart Building Solutions',
    order: 8,
    subcategories: ['KNX Power', 'DALI Control', 'Security System', 'Smart Lighting'],
  },
]

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

for (const category of majorCategories) {
  await setDoc(doc(db, 'majorCategories', category.id), category)
}

console.log(`Seeded ${majorCategories.length} majorCategories docs.`)
