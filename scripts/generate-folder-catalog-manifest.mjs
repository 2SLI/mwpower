import { promises as fs } from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()
const catalogRoot = path.join(projectRoot, '1. 민웰 통합_사양서+썸네일 (2)')
const structureFile = path.join(catalogRoot, '00_CATEGORY_STRUCTURE.txt')
const outputFile = path.join(projectRoot, 'src', 'data', 'folderCatalogManifest.js')

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

async function exists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

function parseStructure(content) {
  const lines = content.split(/\r?\n/)
  const subNodes = []

  let currentMajor = null
  let currentSub = null

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    if (!line) continue

    const majorMatch = line.match(/^(\d+_[^<]+?)\s*<=\s*(.+)$/)
    if (majorMatch && !line.startsWith('-') && !line.startsWith('*')) {
      currentMajor = {
        folder: majorMatch[1].trim(),
        label: majorMatch[2].trim(),
      }
      currentSub = null
      continue
    }

    const subMatch = line.match(/^\s*-\s+([^<]+?)\s*<=\s*(.+)$/)
    if (subMatch && currentMajor) {
      currentSub = {
        majorFolder: currentMajor.folder,
        majorLabel: currentMajor.label,
        folder: subMatch[1].trim(),
        label: subMatch[2].trim(),
        leafNodes: [],
      }
      subNodes.push(currentSub)
      continue
    }

    const leafMatch = line.match(/^\s*\*\s+([^<]+?)\s*<=\s*(.+)$/)
    if (leafMatch && currentMajor && currentSub) {
      currentSub.leafNodes.push({
        leafFolder: leafMatch[1].trim(),
        leafLabel: leafMatch[2].trim(),
      })
    }
  }

  const leafNodes = []
  for (const sub of subNodes) {
    if (sub.leafNodes.length > 0) {
      sub.leafNodes.forEach((leaf) => {
        leafNodes.push({
          majorFolder: sub.majorFolder,
          majorLabel: sub.majorLabel,
          subFolder: sub.folder,
          subLabel: sub.label,
          leafFolder: leaf.leafFolder,
          leafLabel: leaf.leafLabel,
        })
      })
      continue
    }

    leafNodes.push({
      majorFolder: sub.majorFolder,
      majorLabel: sub.majorLabel,
      subFolder: sub.folder,
      subLabel: sub.label,
      leafFolder: '',
      leafLabel: sub.label,
    })
  }

  return leafNodes
}

async function generate() {
  if (!(await exists(structureFile))) {
    throw new Error(`Category structure file not found: ${structureFile}`)
  }

  const structureContent = await fs.readFile(structureFile, 'utf8')
  const leafNodes = parseStructure(structureContent)
  const manifest = {}

  leafNodes.forEach((leaf) => {
    const key = [leaf.majorLabel, leaf.subLabel, leaf.leafLabel].map((label) => normalizeLabel(label)).join('|')
    manifest[key] = {
      labels: {
        major: leaf.majorLabel,
        subcategory: leaf.subLabel,
        leaf: leaf.leafLabel,
      },
      entries: [],
    }
  })

  const fileContent = `export const folderCatalogManifest = ${JSON.stringify(manifest, null, 2)}\n`
  await fs.writeFile(outputFile, fileContent, 'utf8')
  console.log(`Generated category-only manifest: ${outputFile}`)
}

await generate()
