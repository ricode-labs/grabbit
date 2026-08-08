import { mkdirSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const desktopPath = join(
  homedir(),
  ".local",
  "share",
  "applications",
  "grabbit.desktop"
)

const quoteExecArg = (value) => `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`

const desktopEntry = `[Desktop Entry]
Type=Application
Name=grabbit
Comment=Download manager
Exec=npm --prefix ${quoteExecArg(projectRoot)} start
Icon=${join(projectRoot, "resources", "icons", "linux", "icon-512.png")}
Terminal=false
Categories=Network;FileTransfer;
StartupNotify=true
StartupWMClass=grabbit
`

mkdirSync(dirname(desktopPath), { recursive: true })
writeFileSync(desktopPath, desktopEntry)

console.log(`Installed ${desktopPath}`)
