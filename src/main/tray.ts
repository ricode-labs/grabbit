import { Menu, nativeImage, Tray } from "electron"

import { showWindow, toggleDevTools } from "./window"
import { app, type MenuItemConstructorOptions } from "electron/main"
import { getPreferences } from "./preferences"
import type { Language } from "../shared/types"

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
  const image = nativeImage.createFromDataURL(
    "data:image/svg+xml;utf8," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#18181b"/><path d="M16 6v14m0 0 6-6m-6 6-6-6M9 25h14" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      )
  )
  // image.setTemplateImage(process.platform === "darwin")
  tray = new Tray(image)
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
  const menuItems: MenuItemConstructorOptions[] = [
  ]

  if (!app.isPackaged) {
    menuItems.push({ label: labels.toggleDevTools, click: toggleDevTools })
  }
  menuItems.push({ role: "quit" })
  const contextMenu = Menu.buildFromTemplate(menuItems)
  tray.setContextMenu(contextMenu)
}
