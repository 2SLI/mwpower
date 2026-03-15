import { promises as fs } from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()
const sourceDir = path.join(projectRoot, 'public', 'catalog', 'meanwell')
const targetDir = path.join(projectRoot, 'dist', 'catalog', 'meanwell')

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
