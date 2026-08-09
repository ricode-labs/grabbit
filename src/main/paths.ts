import { app } from "electron"
import { join } from "node:path"

const userDataPath = app.getPath("userData")

export function getAria2Executable() {
  let executableName: string | undefined
  const platform = process.platform
  const arch = process.arch
  if (platform === "linux" && arch === "x64") {
    executableName = "aria2c-linux-x86_64"
  } else if (platform === "linux" && arch === "arm64") {
    executableName = "aria2c-linux-arm64"
  } else if (platform === "darwin" && arch === "arm64") {
    executableName = "aria2c-macos-arm64"
  } else if (platform === "win32" && arch === "x64") {
    executableName = "aria2c-windows-x86_64.exe"
  }
  if (!executableName) {
    throw new Error(
      `Unsupported aria2 platform: ${platform}-${arch}`
    )
  }
  if (app.isPackaged) {
    return join(process.resourcesPath, "aria2", executableName)
  }
  return join(app.getAppPath(), "resources", "aria2", executableName)
}

export const btTrackerPath = join(userDataPath, "aria2.bt-tracker.txt")
export const downloadDirectoryPath = join(
  app.getPath("downloads"),
  "Grabbit"
)
export const sessionPath = join(userDataPath, "aria2.session")
export const logPath = join(userDataPath, "aria2.log")
export const netrcPath = join(userDataPath, "aria2.netrc")
export const serverStatPath = join(userDataPath, "aria2.server-stat")
export const dhtPath = join(userDataPath, "aria2.dht.dat")
export const dht6Path = join(userDataPath, "aria2.dht6.dat")
export const preferencesPath = join(userDataPath, "preferences.json")

export function getIconPathLinux() {
  if (process.platform !== "linux") return undefined
  return app.isPackaged
    ? join(process.resourcesPath, "icons", "icon-512.png")
    : join(process.cwd(), "resources", "icons", "icon-512.png")
}

export const trayIconPath = app.isPackaged
  ? join(process.resourcesPath, "icons", "icon.png")
  : join(process.cwd(), "resources", "icons", "icon.png")
