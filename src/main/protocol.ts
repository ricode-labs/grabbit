import { app } from "electron/main"
import { resolve } from "node:path"
import { callAria2 } from "./aria2"
import { readFile } from "fs-extra"
import {
  buildProtocolAddUriOptions,
  parseGrabbitProtocolPayload,
  type GrabbitProtocolPayload,
} from "../shared/grabbit"

const appProtocol = "grabbit"

export type LaunchLink =
  | {
      kind: "url"
      payload: GrabbitProtocolPayload
    }
  | {
      kind: "torrent" | "metalink"
      value: string
    }

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

function getLaunchLinks(argv: string[]): LaunchLink[] {
  const launchLinks: LaunchLink[] = []
  const appPrefix = `${appProtocol}://`
  const filePrefix = "file://"
  for (const value of argv) {
    if (value.startsWith(appPrefix)) {
      const payload = parseGrabbitProtocolPayload(value)
      if (payload) {
        launchLinks.push({ kind: "url", payload: payload })
      }
    } else if (value.startsWith(filePrefix)) {
      if (value.endsWith(".torrent")) {
        launchLinks.push({
          kind: "torrent",
          value: value.slice(filePrefix.length),
        })
      } else if (value.endsWith(".metalink") || value.endsWith(".meta4")) {
        launchLinks.push({
          kind: "metalink",
          value: value.slice(filePrefix.length),
        })
      }
    }
  }
  return launchLinks
}

export async function addLaunchLinks(argv: string[]) {
  const launchLinks = getLaunchLinks(argv)
  return await Promise.allSettled(
    launchLinks.map(async (launchLink) => {
      if (launchLink.kind === "url") {
        return await callAria2<string>("aria2.addUri", [
          [launchLink.payload.url],
          buildProtocolAddUriOptions(launchLink.payload),
        ])
      }
      if (launchLink.kind === "torrent") {
        const file = await readFile(launchLink.value)
        return await callAria2<string>("aria2.addTorrent", [
          file.toString("base64"),
        ])
      }
      if (launchLink.kind === "metalink") {
        const file = await readFile(launchLink.value)
        return await callAria2<string>("aria2.addMetalink", [
          file.toString("base64"),
        ])
      }
    })
  )
}
