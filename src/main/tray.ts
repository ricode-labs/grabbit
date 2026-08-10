import { Menu, Tray } from "electron"
import { showWindow, toggleDevTools } from "./window"
import { app, type MenuItemConstructorOptions } from "electron/main"
import { getPreferences } from "./preferences"
import type { Language } from "../shared/preferences"
import { trayIconPath } from "./paths"

// save a reference to the Tray object globally to avoid garbage collection
let tray: Tray | null = null

const trayTranslations: Record<Language, { toggleDevTools: string }> = {
  zh: {
    toggleDevTools: "切换开发者工具",
  },
  en: {
    toggleDevTools: "Toggle DevTools",
  },
  ja: {
    toggleDevTools: "開発者ツールを切り替え",
  },
}

export function createTray() {
  // image.setTemplateImage(process.platform === "darwin")
  tray = new Tray(trayIconPath)
  tray.setToolTip("Grabbit")
  updateTrayMenu()

  tray.on("click", () => {
    showWindow()
  })
}

export function updateTrayMenu() {
  if (!tray) return

  const { language } = getPreferences()
  const labels = trayTranslations[language]
  const menuItems: MenuItemConstructorOptions[] = []

  if (!app.isPackaged) {
    menuItems.push({ label: labels.toggleDevTools, click: toggleDevTools })
  }
  menuItems.push({ role: "quit" })
  const contextMenu = Menu.buildFromTemplate(menuItems)
  tray.setContextMenu(contextMenu)
}
