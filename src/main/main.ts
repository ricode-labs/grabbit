import { app, BrowserWindow } from "electron"
import started from "electron-squirrel-startup"
import { startAria2, stopAria2 } from "./aria2"
import { setIsQuitting } from "./app-state"
import {
  collectExternalIntents,
  flushExternalIntents,
  registerProtocolClients,
  sendExternalIntents,
} from "./external-intents"
import { registerIpcHandlers } from "./ipc"
import { createNativeMenu } from "./menu"
import { applyLoginItemPreference, readPreferences } from "./stores"
import { createTray } from "./tray"
import {
  createWindow,
  setWindowDidFinishLoadHandler,
  showMainWindow,
} from "./window"

if (started) {
  app.quit()
}

setWindowDidFinishLoadHandler(flushExternalIntents)
registerIpcHandlers()

const gotSingleInstanceLock = app.requestSingleInstanceLock()

if (!gotSingleInstanceLock) {
  app.quit()
} else {
  app.on("second-instance", (_event, argv) => {
    showMainWindow()
    sendExternalIntents(collectExternalIntents(argv))
  })
}

app.on("open-url", (event, url) => {
  event.preventDefault()
  sendExternalIntents(collectExternalIntents([url]))
})

app.on("open-file", (event, filePath) => {
  if (/\.torrent$/i.test(filePath)) {
    event.preventDefault()
    sendExternalIntents([{ kind: "torrent", value: filePath }])
  }
})

app.on("ready", () => {
  registerProtocolClients()
  createNativeMenu()
  createTray()
  sendExternalIntents(collectExternalIntents(process.argv))
  void startAria2()
  void createWindow()
  void readPreferences().then(applyLoginItemPreference)
})

app.on("before-quit", () => {
  setIsQuitting(true)
  void stopAria2()
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow()
  }
})
