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
import path from "node:path"

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit()
}

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  })

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    )
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // registerProtocolClients()
  // createNativeMenu()
  // createTray()
  // sendExternalIntents(collectExternalIntents(process.argv))
  startAria2()
  registerIpcHandlers()
  createWindow()
  // void readPreferences().then(applyLoginItemPreference)

  app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
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

// app.on("before-quit", () => {
//   setIsQuitting(true)
//   void stopAria2()
// })
