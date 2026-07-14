import { app } from "electron"
import path from "node:path"

export const getAria2Executable = () => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "aria2", "linux-x64", "aria2c")
  }

  return path.join(
    app.getAppPath(),
    "resources",
    "aria2",
    "linux-x64",
    "aria2c"
  )
}

export const getSessionPath = () =>
  path.join(app.getPath("userData"), "aria2.session")

export const getPreferencesPath = () =>
  path.join(app.getPath("userData"), "preferences.json")

export const getSchedulerPath = () =>
  path.join(app.getPath("userData"), "scheduler.json")

export const getWindowStatePath = () =>
  path.join(app.getPath("userData"), "window-state.json")

export const getFallbackDownloadDir = () =>
  path.join(app.getPath("downloads"), "Grabbit")
