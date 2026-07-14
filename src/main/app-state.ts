import type { BrowserWindow, Tray } from "electron"

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false
let closeToTrayEnabled = false

export const getMainWindow = () => mainWindow
export const setMainWindow = (window: BrowserWindow | null) => {
  mainWindow = window
}

export const getTray = () => tray
export const setTray = (nextTray: Tray | null) => {
  tray = nextTray
}

export const getIsQuitting = () => isQuitting
export const setIsQuitting = (value: boolean) => {
  isQuitting = value
}

export const getCloseToTrayEnabled = () => closeToTrayEnabled
export const setCloseToTrayEnabled = (value: boolean) => {
  closeToTrayEnabled = value
}
