import path from 'node:path'
import { promises as fs } from 'node:fs'

const projectRoot = process.cwd()
const catalogRoot = path.join(projectRoot, 'public', 'catalog', 'meanwell')
const allowedExt = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp'])

async function exists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

async function walkFiles(rootDir) {
  const files = []
  const stack = [rootDir]

  while (stack.length > 0) {
    const current = stack.pop()
    const entries = await fs.readdir(current, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(fullPath)
      } else {
        files.push(fullPath)
      }
    }
  }

  return files
}

function toModelName(sourcePath) {
  const ext = path.extname(sourcePath)
  const baseName = path.basename(sourcePath, ext)
  const parentName = path.basename(path.dirname(sourcePath))
  const normalizedBase = baseName.trim().toLowerCase()

  if (normalizedBase === 'spec' || normalizedBase === 'image' || normalizedBase === 'thumbnail' || normalizedBase === 'thumb') {
    return parentName.trim()
  }

  return baseName.trim()
}

async function sameFileContent(pathA, pathB) {
  const [statA, statB] = await Promise.all([fs.stat(pathA), fs.stat(pathB)])
  if (statA.size !== statB.size) return false
  const [bufA, bufB] = await Promise.all([fs.readFile(pathA), fs.readFile(pathB)])
  return bufA.equals(bufB)
}

async function getConflictPath(basePath) {
  const ext = path.extname(basePath)
  const stem = basePath.slice(0, -ext.length)
  let index = 1
  while (await exists(`${stem}__dup${index}${ext}`)) index += 1
  return `${stem}__dup${index}${ext}`
}

async function removeEmptyDirs(rootDir) {
  const entries = await fs.readdir(rootDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const fullPath = path.join(rootDir, entry.name)
    await removeEmptyDirs(fullPath)
  }

  const remaining = await fs.readdir(rootDir)
  if (remaining.length === 0) {
    await fs.rmdir(rootDir)
  }
}

async function run() {
  if (!(await exists(catalogRoot))) {
    console.log(`Skipped: catalog root not found -> ${catalogRoot}`)
    return
  }

  const files = await walkFiles(catalogRoot)
  let moved = 0
  let removedDuplicate = 0
  let removedDsStore = 0
  let conflictRenamed = 0

  for (const sourcePath of files) {
    const fileName = path.basename(sourcePath)
    if (fileName === '.DS_Store') {
      await fs.unlink(sourcePath)
      removedDsStore += 1
      continue
    }

    const ext = path.extname(sourcePath).toLowerCase()
    if (!allowedExt.has(ext)) continue

    const relative = path.relative(catalogRoot, sourcePath)
    const normalizedRelative = relative.split(path.sep).join('/').toLowerCase()
    if (normalizedRelative.startsWith('thumbnails/')) continue

    const segments = relative.split(path.sep).filter(Boolean)
    if (segments.length <= 1) continue

    const modelName = toModelName(sourcePath)
    if (!modelName) continue

    const targetPath = path.join(catalogRoot, `${modelName}${ext}`)
    if (targetPath === sourcePath) continue

    await fs.mkdir(path.dirname(targetPath), { recursive: true })

    if (await exists(targetPath)) {
      if (await sameFileContent(sourcePath, targetPath)) {
        await fs.unlink(sourcePath)
        removedDuplicate += 1
        continue
      }

      const conflictPath = await getConflictPath(targetPath)
      await fs.rename(sourcePath, conflictPath)
      conflictRenamed += 1
      moved += 1
      continue
    }

    await fs.rename(sourcePath, targetPath)
    moved += 1
  }

  const topEntries = await fs.readdir(catalogRoot, { withFileTypes: true })
  for (const entry of topEntries) {
    if (!entry.isDirectory()) continue
    await removeEmptyDirs(path.join(catalogRoot, entry.name))
  }

  console.log(`Catalog root: ${catalogRoot}`)
  console.log(`Moved files: ${moved}`)
  console.log(`Removed duplicate files: ${removedDuplicate}`)
  console.log(`Renamed conflict files: ${conflictRenamed}`)
  console.log(`Removed .DS_Store: ${removedDsStore}`)
}

await run()
