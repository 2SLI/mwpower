import { promises as fs } from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()
const sourceDir = path.join(projectRoot, '1. 민웰 통합_사양서+썸네일 (2)')
const targetDir = path.join(projectRoot, 'dist', '1. 민웰 통합_사양서+썸네일 (2)')

async function exists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

if (await exists(sourceDir)) {
  await fs.cp(sourceDir, targetDir, { recursive: true, force: true })
  console.log(`Copied catalog assets to ${targetDir}`)
} else {
  console.log(`Skipped copy: source directory not found -> ${sourceDir}`)
}
