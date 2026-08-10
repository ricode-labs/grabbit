import { app, Menu } from "electron/main"
import started from "electron-squirrel-startup"
import { startAria2, stopAria2 } from "./aria2"
import { registerIpcHandlers } from "./ipc"
import { updateTrackers } from "./aria2.conf"
import { createTray } from "./tray"
import { showWindow } from "./window"
import {
  addLaunchLinks,
  registerFileAssociations,
  registerProtocolClient,
} from "./protocol"

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit()
}

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  registerFileAssociations()
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

  if (process.platform === "linux") {
    app.setDesktopName("io.github.ricodelabs.Grabbit")
  }
  if (process.platform === "win32") {
    app.setAppUserModelId("io.github.ricodelabs.Grabbit")
  }

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(async () => {
    Menu.setApplicationMenu(null)
    try {
      await startAria2()
    } catch (error) {
      console.error("Failed to start aria2", error)
    }
    try {
      updateTrackers()
    } catch {
      /* empty */
    }
    registerIpcHandlers()
    showWindow()
    createTray()
    addLaunchLinks(process.argv)

    app.on("activate", () => {
      showWindow()
    })
  })
}
