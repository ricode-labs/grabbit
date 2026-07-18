import { app, Menu } from "electron/main"
import started from "electron-squirrel-startup"
import { startAria2, stopAria2 } from "./aria2"
// import { setIsQuitting } from "./app-state"
// import {
//   collectExternalIntents,
//   flushExternalIntents,
//   registerProtocolClients,
//   sendExternalIntents,
// } from "./external-intents"
import { registerIpcHandlers } from "./ipc"
// import { createNativeMenu } from "./menu"
// import { applyLoginItemPreference, readPreferences } from "./stores"
// import { createTray } from "./tray"
// import {
//   createWindow,
//   setWindowDidFinishLoadHandler,
//   showMainWindow,
// } from "./window"
import { updateTrackers } from "./aria2.conf"
import { createTray } from "./tray"
import { closeWindow, showWindow } from "./window"

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit()
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on("second-instance", () => {
    showWindow()
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // registerProtocolClients()
  Menu.setApplicationMenu(null)

  // sendExternalIntents(collectExternalIntents(process.argv))
  try {
    await startAria2()
  } catch (error) {
    console.error("Failed to start aria2", error)
  }
  updateTrackers()
  registerIpcHandlers()
  showWindow()
  createTray()
  // void readPreferences().then(applyLoginItemPreference)

  app.on("activate", () => {
    showWindow()
  })
})

// // stay active until the user quits explicitly with Cmd + Q.
// app.on("window-all-closed", () => {})

app.on("before-quit", async () => {
  closeWindow()
  await stopAria2()
})

// setWindowDidFinishLoadHandler(flushExternalIntents)

// const gotSingleInstanceLock = app.requestSingleInstanceLock()

// if (!gotSingleInstanceLock) {
//   app.quit()
// } else {
//   app.on("second-instance", (_event, argv) => {
//     showMainWindow()
//     sendExternalIntents(collectExternalIntents(argv))
//   })
// }

// app.on("open-url", (event, url) => {
//   event.preventDefault()
//   sendExternalIntents(collectExternalIntents([url]))
// })

// app.on("open-file", (event, filePath) => {
//   if (/\.torrent$/i.test(filePath)) {
//     event.preventDefault()
//     sendExternalIntents([{ kind: "torrent", value: filePath }])
//   }
// })
