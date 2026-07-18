import { app } from "electron/main"
import { resolve } from "node:path"

const appProtocol = "grabbit"

export function registerProtocolClient() {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(appProtocol, process.execPath, [
        resolve(process.argv[1]),
      ])
    }
  } else {
    app.setAsDefaultProtocolClient(appProtocol)
  }
}

export function getProtocolUrls(argv: string[]) {
  const prefix = `${appProtocol}://`
  return argv.filter((value) => value.startsWith(prefix))
}
