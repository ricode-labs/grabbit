import fs from "fs-extra"
import extractZip from "extract-zip"
import { extract } from "tar"
import ky from "ky"
import { mkdtemp } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

const targetDir = join(process.cwd(), "resources", "aria2")
const releaseBase = "https://github.com/ricode-labs/aria2/releases/latest/download"

const assets = [
  {
    archiveName: "aria2-linux-x86_64.tar.gz",
    fileName: "aria2c-linux-x86_64",
    extract: (archivePath) => extract({ file: archivePath, cwd: targetDir }),
  },
  {
    archiveName: "aria2-linux-arm64.tar.gz",
    fileName: "aria2c-linux-arm64",
    extract: (archivePath) => extract({ file: archivePath, cwd: targetDir }),
  },
  {
    archiveName: "aria2-macos-arm64.tar.gz",
    fileName: "aria2c-macos-arm64",
    extract: (archivePath) => extract({ file: archivePath, cwd: targetDir }),
  },
  {
    archiveName: "aria2-windows-x86_64.zip",
    fileName: "aria2c-windows-x86_64.exe",
    extract: (archivePath) => extractZip(archivePath, { dir: targetDir }),
  },
]

async function download(url, filePath) {
  const response = await ky.get(url)
  await fs.writeFile(filePath, Buffer.from(await response.arrayBuffer()))
}

async function updateAsset({ archiveName, fileName, extract: extractor }) {
  const tempDir = await mkdtemp(join(tmpdir(), "grabbit-aria2-"))
  const archivePath = join(tempDir, archiveName)
  try {
    await download(`${releaseBase}/${archiveName}`, archivePath)
    await fs.remove(join(targetDir, fileName))
    await extractor(archivePath)
    console.log(`updated ${fileName}`)
  } finally {
    await fs.remove(tempDir)
  }
}

await fs.ensureDir(targetDir)
for (const asset of assets) {
  await updateAsset(asset)
}
