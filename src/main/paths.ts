import { app } from "electron"
import path from "node:path"

const userDataPath = app.getPath("userData")

export function getAria2Executable() {
  let executableName: string | undefined
  const platform = process.platform
  const arch = process.arch
  if (platform === "linux" && arch === "x64") {
    executableName = "aria2c-linux-x86_64"
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
    return path.join(process.resourcesPath, "aria2", executableName)
  }
  return path.join(app.getAppPath(), "resources", "aria2", executableName)
}

export const btTrackerPath = path.join(userDataPath, "aria2.bt-tracker.txt")
export const downloadDirectoryPath = path.join(
  app.getPath("downloads"),
  "Grabbit"
)
export const sessionPath = path.join(userDataPath, "aria2.session")
export const logPath = path.join(userDataPath, "aria2.log")
export const netrcPath = path.join(userDataPath, "aria2.netrc")
export const serverStatPath = path.join(userDataPath, "aria2.server-stat")
export const dhtPath = path.join(userDataPath, "aria2.dht.dat")
export const dht6Path = path.join(userDataPath, "aria2.dht6.dat")
export const preferencesPath = path.join(userDataPath, "preferences.json")
