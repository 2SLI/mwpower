import { initializeApp } from 'firebase/app'
import { collection, doc, getDocs, getFirestore, writeBatch } from 'firebase/firestore'
import { defaultMajorCategories } from '../src/data/defaultMajorCategories.js'

const firebaseConfig = {
  apiKey: 'AIzaSyB6HRLq6vFlBy7uvuMpd-VeKKdyKN4abY4',
  authDomain: 'meanwellpower-103ae.firebaseapp.com',
  projectId: 'meanwellpower-103ae',
  storageBucket: 'meanwellpower-103ae.firebasestorage.app',
  messagingSenderId: '459112128979',
  appId: '1:459112128979:web:dc0782d0d6c64318588f26',
}

const MAJOR_COLLECTION = 'majorCategories'
const TREE_COLLECTION = 'leafModelTrees'
const BATCH_LIMIT = 400

function normalizeLabel(value = '') {
  return String(value ?? '')
    .normalize('NFKC')
    .replaceAll('⇄', '/')
    .replaceAll('↔', '/')
    .replaceAll('—', '-')
    .replaceAll('–', '-')
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function normalizeModelKey(value = '') {
  return normalizeLabel(value)
    .replace(/_+\d+$/g, '')
    .replace(/-spec$/g, '')
    .replace(/[^a-z0-9-]+/g, '')
}

async function deleteAllDocs(db, collectionName) {
  const snap = await getDocs(collection(db, collectionName))
  if (snap.empty) return 0

  let batch = writeBatch(db)
  let batchCount = 0
  let deleted = 0

  for (const docSnap of snap.docs) {
    batch.delete(doc(db, collectionName, docSnap.id))
    batchCount += 1
    deleted += 1

    if (batchCount >= BATCH_LIMIT) {
      await batch.commit()
      batch = writeBatch(db)
      batchCount = 0
    }
  }

  if (batchCount > 0) await batch.commit()
  return deleted
}

async function seedMajorCategories(db) {
  let batch = writeBatch(db)
  let batchCount = 0
  let created = 0

  for (let index = 0; index < defaultMajorCategories.length; index += 1) {
    const category = defaultMajorCategories[index]
    batch.set(doc(db, MAJOR_COLLECTION, category.id), {
      id: category.id,
      name: category.name,
      order: index + 1,
      subcategories: Array.isArray(category.subcategories) ? category.subcategories : [],
    })
    batchCount += 1
    created += 1

    if (batchCount >= BATCH_LIMIT) {
      await batch.commit()
      batch = writeBatch(db)
      batchCount = 0
    }
  }

  if (batchCount > 0) await batch.commit()
  return created
}

async function seedLeafModelTrees(db) {
  const now = new Date().toISOString()
  let batch = writeBatch(db)
  let batchCount = 0
  let created = 0

  for (const category of defaultMajorCategories) {
    const models = Array.isArray(category.subcategories) ? category.subcategories : []
    for (const model of models) {
      const modelName = String(model ?? '').trim()
      if (!modelName) continue

      const modelKey = normalizeModelKey(modelName)
      if (!modelKey) continue

      const key = `${category.name}|${modelName}|${modelName}`
      const docId = `${category.id}__${modelKey}`

      batch.set(doc(db, TREE_COLLECTION, docId), {
        key,
        major: category.name,
        subcategory: modelName,
        leaf: modelName,
        groups: [],
        models: [modelName],
        modelAssets: [],
        modelAssetsByKey: {},
        assetsUpdatedAt: now,
      })
      batchCount += 1
      created += 1

      if (batchCount >= BATCH_LIMIT) {
        await batch.commit()
        batch = writeBatch(db)
        batchCount = 0
      }
    }
  }

  if (batchCount > 0) await batch.commit()
  return created
}

async function run() {
  const app = initializeApp(firebaseConfig)
  const db = getFirestore(app)

  const deletedMajor = await deleteAllDocs(db, MAJOR_COLLECTION)
  const deletedTrees = await deleteAllDocs(db, TREE_COLLECTION)

  const createdMajor = await seedMajorCategories(db)
  const createdTrees = await seedLeafModelTrees(db)

  console.log(`Deleted ${MAJOR_COLLECTION}: ${deletedMajor}`)
  console.log(`Deleted ${TREE_COLLECTION}: ${deletedTrees}`)
  console.log(`Created ${MAJOR_COLLECTION}: ${createdMajor}`)
  console.log(`Created ${TREE_COLLECTION}: ${createdTrees}`)
}

await run()
