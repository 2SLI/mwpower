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
    id: 'rs',
    name: 'RS 시리즈',
    order: 1,
    subcategories: ['RS-15', 'RS-25', 'RS-35', 'RS-50', 'RS-75', 'RS-100', 'RS-150'],
  },
  {
    id: 'lrs',
    name: 'LRS 시리즈',
    order: 2,
    subcategories: ['LRS-35', 'LRS-50', 'LRS-75', 'LRS-100', 'LRS-150', 'LRS-150F', 'LRS-200', 'LRS-350', 'LRS-450', 'LRS-600', 'LRS-1200'],
  },
  {
    id: 'mdr',
    name: 'MDR 시리즈',
    order: 3,
    subcategories: ['MDR-10', 'MDR-20', 'MDR-40', 'MDR-60', 'MDR-100'],
  },
  {
    id: 'ndr',
    name: 'NDR 시리즈',
    order: 4,
    subcategories: ['NDR-75', 'NDR-120', 'NDR-240', 'NDR-480'],
  },
  {
    id: 'ddr',
    name: 'DDR 시리즈',
    order: 5,
    subcategories: ['DDR-15', 'DDR-30', 'DDR-60', 'DDR-120', 'DDR-240', 'DDR-480'],
  },
  {
    id: 'dups',
    name: 'DUPS 시리즈',
    order: 6,
    subcategories: ['DUPS20'],
  },
  {
    id: 'sdr',
    name: 'SDR 시리즈',
    order: 7,
    subcategories: ['SDR-75', 'SDR-120', 'SDR-240', 'SDR-480', 'SDR-480P', 'SDR-960'],
  },
  {
    id: 'se',
    name: 'SE 시리즈',
    order: 8,
    subcategories: ['SE-450', 'SE-600', 'SE-1000', 'SE-1500'],
  },
  {
    id: 'hdr',
    name: 'HDR 시리즈',
    order: 9,
    subcategories: ['HDR-15', 'HDR-30', 'HDR-60', 'HDR-100', 'HDR-150'],
  },
  {
    id: 'hlg',
    name: 'HLG 시리즈',
    order: 10,
    subcategories: [
      'HLG-40H',
      'HLG-60H',
      'HLG-80H',
      'HLG-100H',
      'HLG-120H',
      'HLG-150H',
      'HLG-185H',
      'HLG-240H',
      'HLG-320H',
      'HLG-480H',
      'HLG-600H',
    ],
  },
  {
    id: 'epp',
    name: 'EPP 시리즈',
    order: 11,
    subcategories: ['EPP-100', 'EPP-120S', 'EPP-150', 'EPP-200', 'EPP-300', 'EPP-400', 'EPP-500'],
  },
  {
    id: 'hrp',
    name: 'HRP 시리즈',
    order: 12,
    subcategories: ['HRP-75', 'HRP-100', 'HRP-150', 'HRP-200', 'HRP-300', 'HRP-450', 'HRP-600'],
  },
  {
    id: 'lop',
    name: 'LOP 시리즈',
    order: 13,
    subcategories: ['LOP-200', 'LOP-300', 'LOP-400', 'LOP-500', 'LOP-600'],
  },
  {
    id: 'csp',
    name: 'CSP 시리즈',
    order: 14,
    subcategories: ['CSP-3000'],
  },
  {
    id: 'rsp',
    name: 'RSP 시리즈',
    order: 15,
    subcategories: [
      'RSP-75',
      'RSP-100',
      'RSP-150',
      'RSP-200',
      'RSP-320',
      'RSP-500',
      'RSP-750',
      'RSP-1000',
      'RSP-1500',
      'RSP-1600',
      'RSP-2000',
      'RSP-2400',
      'RSP-3000',
    ],
  },
  {
    id: 'rd',
    name: 'RD 시리즈',
    order: 16,
    subcategories: ['RD-35', 'RD-50', 'RD-65', 'RD-85', 'RD-125'],
  },
  {
    id: 'rt',
    name: 'RT 시리즈',
    order: 17,
    subcategories: ['RT-50', 'RT-65', 'RT-85', 'RT-125'],
  },
  {
    id: 'edr',
    name: 'EDR 시리즈',
    order: 18,
    subcategories: ['EDR-75', 'EDR-120', 'EDR-150'],
  },
]

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

for (const category of majorCategories) {
  await setDoc(doc(db, 'majorCategories', category.id), category)
}

console.log(`Seeded ${majorCategories.length} majorCategories docs.`)
