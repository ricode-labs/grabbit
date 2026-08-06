import { app } from "electron"
import path from "node:path"

const userDataPath = app.getPath("userData")

export function getAria2Executable() {
  const executableName =
    process.platform === "linux" && process.arch === "x64"
      ? "aria2c-linux-x86_64"
      : process.platform === "darwin" && process.arch === "arm64"
        ? "aria2c-macos-arm64"
        : process.platform === "win32" && process.arch === "x64"
          ? "aria2c-windows-x86_64.exe"
          : null

  if (!executableName) {
    throw new Error(
      `Unsupported aria2 platform: ${process.platform}-${process.arch}`
    )
  }

  if (app.isPackaged) {
    return path.join(process.resourcesPath, "aria2", executableName)
  }

  return path.join(
    app.getAppPath(),
    "resources",
    "aria2",
    executableName
  )
}

// export const getSchedulerPath = () =>
//   path.join(app.getPath("userData"), "scheduler.json")

// export const getWindowStatePath = () =>
//   path.join(app.getPath("userData"), "window-state.json")

// export const getFallbackDownloadDir = () =>
//   path.join(app.getPath("downloads"), "Grabbit")

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
