import { app } from "electron"
import path from "node:path"

import {
  parseExternalTaskIntents,
  supportedExternalProtocols,
  type ExternalTaskIntent,
} from "../shared/grabbit"
import { getMainWindow } from "./app-state"
import { showMainWindow } from "./window"

let pendingExternalIntents: ExternalTaskIntent[] = []

const isSupportedExternalValue = (value: string) =>
  /^(https?|ftp|magnet|thunder|mo|motrix):/i.test(value) ||
  /\.torrent(?:$|[?#])/i.test(value)

export const collectExternalIntents = (values: string[]) =>
  parseExternalTaskIntents(values.filter(isSupportedExternalValue))

export const registerProtocolClients = () => {
  for (const protocol of supportedExternalProtocols) {
    if (process.defaultApp && process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(protocol, process.execPath, [
        path.resolve(process.argv[1]),
      ])
    } else {
      app.setAsDefaultProtocolClient(protocol)
    }
  }
}

export const sendExternalIntents = (intents: ExternalTaskIntent[]) => {
  if (intents.length === 0) {
    return
  }

  const mainWindow = getMainWindow()
  if (!mainWindow || mainWindow.webContents.isLoading()) {
    pendingExternalIntents.push(...intents)
    return
  }

  showMainWindow()
  mainWindow.webContents.send("external:task-intents", intents)
}

export const flushExternalIntents = () => {
  if (pendingExternalIntents.length === 0) {
    return
  }

  const nextIntents = pendingExternalIntents
  pendingExternalIntents = []
  sendExternalIntents(nextIntents)
}
