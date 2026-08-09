import {
  mkdtemp,
  copyFile,
  rm,
  writeFile,
  readdir,
  mkdir,
  chmod,
  stat,
} from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)
const repoRoot = process.cwd()
const targetDir = join(repoRoot, "resources", "aria2")
const releaseBase =
  "https://github.com/ricode-labs/aria2/releases/latest/download"

const assets = [
  {
    url: `${releaseBase}/aria2-linux-x86_64.tar.gz`,
    name: "aria2c-linux-x86_64",
    extract: async (archivePath, destDir) => {
      await execFileAsync("tar", ["-xzf", archivePath, "-C", destDir])
    },
  },
  {
    url: `${releaseBase}/aria2-macos-arm64.tar.gz`,
    name: "aria2c-macos-arm64",
    extract: async (archivePath, destDir) => {
      await execFileAsync("tar", ["-xzf", archivePath, "-C", destDir])
    },
  },
  {
    url: `${releaseBase}/aria2-windows-x86_64.zip`,
    name: "aria2c-windows-x86_64.exe",
    extract: async (archivePath, destDir) => {
      await execFileAsync("unzip", ["-q", archivePath, "-d", destDir])
    },
  },
]

async function download(url, filePath) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`)
  }
  const bytes = Buffer.from(await response.arrayBuffer())
  await writeFile(filePath, bytes)
}

async function findFile(dir, fileName) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isFile() && entry.name === fileName) {
      return fullPath
    }
    if (entry.isDirectory()) {
      const nested = await findFile(fullPath, fileName)
      if (nested) return nested
    }
  }
  return null
}

async function updateAsset(asset) {
  const tempDir = await mkdtemp(join(tmpdir(), "grabbit-aria2-"))
  try {
    const archivePath = join(tempDir, asset.url.split("/").pop())
    const extractDir = join(tempDir, "extract")
    const targetPath = join(targetDir, asset.name)
    await download(asset.url, archivePath)
    await mkdir(extractDir, { recursive: true })
    await asset.extract(archivePath, extractDir)
    const sourcePath = await findFile(extractDir, asset.name)
    if (!sourcePath) {
      throw new Error(`Did not find ${asset.name} in ${asset.url}`)
    }
    await copyFile(sourcePath, targetPath)
    const sourceStat = await stat(sourcePath)
    await chmod(targetPath, sourceStat.mode)
    console.log(`updated ${asset.name}`)
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}

async function main() {
  await mkdir(targetDir, { recursive: true })
  for (const asset of assets) {
    await updateAsset(asset)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
