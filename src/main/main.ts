import { app, BrowserWindow } from "electron/main"
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
import { join } from "node:path"
import { createTray } from "./tray"

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit()
}

let mainWindow: BrowserWindow
let isQuitting = false

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
    },
  })

  mainWindow.on("close", (event) => {
    if (isQuitting) {
      return
    }

    event.preventDefault()
    mainWindow.hide()
  })

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(
      join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    )
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // registerProtocolClients()
  // createNativeMenu()

  // sendExternalIntents(collectExternalIntents(process.argv))
  try {
    await startAria2()
  } catch (error) {
    console.error("Failed to start aria2", error)
  }
  updateTrackers()
  registerIpcHandlers()
  createWindow()
  createTray()
  // void readPreferences().then(applyLoginItemPreference)

  app.on("activate", () => {
    mainWindow.show()
    mainWindow.focus()
  })
})

// // stay active until the user quits explicitly with Cmd + Q.
// app.on("window-all-closed", () => {})

app.on("before-quit", () => {
  isQuitting = true
  stopAria2()
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

