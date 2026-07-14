import { BrowserWindow } from "electron"
import path from "node:path"

import {
  getCloseToTrayEnabled,
  getIsQuitting,
  getMainWindow,
  getTray,
  setMainWindow,
} from "./app-state"
import { readWindowState, writeWindowState } from "./stores"

let didFinishLoadHandler: (() => void) | null = null

export const setWindowDidFinishLoadHandler = (handler: () => void) => {
  didFinishLoadHandler = handler
}

const saveWindowState = async () => {
  const mainWindow = getMainWindow()
  if (!mainWindow) {
    return
  }

  const bounds = mainWindow.getBounds()
  await writeWindowState({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    maximized: mainWindow.isMaximized(),
  })
}

// export const createWindow = async () => {
//   const windowState = await readWindowState()
//   const mainWindow = new BrowserWindow({
//     width: windowState.width,
//     height: windowState.height,
//     x: windowState.x,
//     y: windowState.y,
//     minWidth: 920,
//     minHeight: 600,
//     titleBarStyle: "hiddenInset",
//     webPreferences: {
//       preload: path.join(__dirname, "preload.js"),
//     },
//   })
//   setMainWindow(mainWindow)

//   if (windowState.maximized) {
//     mainWindow.maximize()
//   }

//   mainWindow.on("close", (event) => {
//     void saveWindowState().catch((error) => {
//       console.error("Failed to save window state", error)
//     })

//     if (!getIsQuitting() && getCloseToTrayEnabled() && getTray()) {
//       event.preventDefault()
//       mainWindow.hide()
//     }
//   })

//   mainWindow.on("closed", () => {
//     setMainWindow(null)
//   })

//   if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
//     mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
//   } else {
//     mainWindow.loadFile(
//       path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
//     )
//   }

//   if (didFinishLoadHandler) {
//     mainWindow.webContents.once("did-finish-load", didFinishLoadHandler)
//   }
// }

// export const showMainWindow = () => {
//   const mainWindow = getMainWindow()
//   if (!mainWindow) {
//     void createWindow()
//     return
//   }
//   mainWindow.show()
//   mainWindow.focus()
// }
