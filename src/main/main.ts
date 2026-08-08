import { nativeImage } from "electron"
import { app, Menu } from "electron/main"
import started from "electron-squirrel-startup"
import { join } from "node:path"
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
import { showWindow } from "./window"
import { addLaunchLinks, registerProtocolClient } from "./protocol"

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit()
}

if (process.platform === "linux") {
  app.setDesktopName("grabbit.desktop")
}

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  registerProtocolClient()

  app.on("second-instance", (_event, argv) => {
    addLaunchLinks(argv)
    showWindow()
  })

  app.on("open-url", (event, url) => {
    event.preventDefault()
    addLaunchLinks([url])
    if (app.isReady()) {
      showWindow()
    }
  })

  app.on("open-file", (event, filePath) => {
    event.preventDefault()
    addLaunchLinks([filePath])
    if (app.isReady()) {
      showWindow()
    }
  })

  app.on("before-quit", async () => {
    // closeWindow()
    await stopAria2()
  })

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(async () => {
    Menu.setApplicationMenu(null)
    setDockIcon()
    try {
      await startAria2()
    } catch (error) {
      console.error("Failed to start aria2", error)
    }
    updateTrackers()
    registerIpcHandlers()
    showWindow()
    createTray()
    addLaunchLinks(process.argv)

    app.on("activate", () => {
      showWindow()
    })
  })
}

function setDockIcon() {
  if (process.platform !== "darwin" || !app.dock) return

  const iconPaths = app.isPackaged
    ? [
        join(process.resourcesPath, "icons", "mac", "icon-512.png"),
        join(process.resourcesPath, "icon.icns"),
      ]
    : [
        join(process.cwd(), "resources", "icons", "mac", "icon-512.png"),
        join(process.cwd(), "resources", "icons", "icon.icns"),
      ]

  for (const iconPath of iconPaths) {
    const icon = nativeImage.createFromPath(iconPath)
    if (!icon.isEmpty()) {
      app.dock.setIcon(icon)
      return
    }
  }
}
