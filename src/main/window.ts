import { BrowserWindow } from "electron/main"
import { join } from "node:path"

let mainWindow: BrowserWindow | null = null
let isQuitting = false

export function showWindow() {
  // Show the browser window.
  if (mainWindow) {
    mainWindow.show()
    return
  }
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
    mainWindow?.hide()
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

export function closeWindow() {
  isQuitting = true
}

export function toggleDevTools() {
  showWindow()
  mainWindow?.webContents.toggleDevTools()
}
