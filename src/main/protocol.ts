import { app } from "electron/main"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { aria2Process, callAria2 } from "./aria2"
import { readFile } from "fs-extra"
import { createKey, HKEY, RegistryValueType, setValue } from "registry-js"
import { getMainWindow, showWindow } from "./window"
import type { LaunchInput } from "../shared/aria2"

const appProtocol = "grabbit"
const magnetProtocol = "magnet"
let pendingLaunchArgs: string[] = []
let pendingLaunchInputs: LaunchInput[] = []

export type LaunchLink =
  GrabbitLaunchLink | TorrentLaunchLink | MetalinkLaunchLink

type GrabbitLaunchLink = {
  kind: "url"
  payload: GrabbitPayload
}

type TorrentLaunchLink = {
  kind: "torrent"
  value: string
}

type MetalinkLaunchLink = {
  kind: "metalink"
  value: string
}

type GrabbitPayload = {
  url: string
  header: string[]
}

// Register the custom `grabbit:` URL scheme with the OS.
export function registerProtocolClient() {
  for (const protocol of [appProtocol, magnetProtocol]) {
    if (process.defaultApp) {
      if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient(protocol, process.execPath, [
          resolve(process.argv[1]),
        ])
      }
    } else {
      app.setAsDefaultProtocolClient(protocol)
    }
  }
}

// Register Windows file associations for torrent and metalink files.
export function registerFileAssociations() {
  if (process.platform !== "win32") return

  const executablePath = app.getPath("exe")
  const registrations = [
    {
      extension: ".torrent",
      progId: "Grabbit.torrent",
      contentType: "application/x-bittorrent",
    },
    {
      extension: ".metalink",
      progId: "Grabbit.metalink",
      contentType: "application/metalink+xml",
    },
    {
      extension: ".meta4",
      progId: "Grabbit.meta4",
      contentType: "application/metalink4+xml",
    },
  ]

  const setRegistryValue = (
    subkey: string,
    valueName: string,
    value: string
  ) => {
    if (!createKey(HKEY.HKEY_CURRENT_USER, subkey)) {
      throw new Error(`Failed to create registry key: ${subkey}`)
    }
    if (
      !setValue(
        HKEY.HKEY_CURRENT_USER,
        subkey,
        valueName,
        RegistryValueType.REG_SZ,
        value
      )
    ) {
      throw new Error(`Failed to set registry value: ${subkey}\\${valueName}`)
    }
  }

  for (const registration of registrations) {
    const classKey = `Software\\Classes\\${registration.extension}`
    const progIdKey = `Software\\Classes\\${registration.progId}`
    const openCommand = `"${executablePath}" %*`

    setRegistryValue(classKey, "", registration.progId)
    setRegistryValue(classKey, "Content Type", registration.contentType)
    setRegistryValue(progIdKey, "", `Grabbit ${registration.extension} file`)
    setRegistryValue(`${progIdKey}\\DefaultIcon`, "", `${executablePath},0`)
    setRegistryValue(`${progIdKey}\\shell\\open\\command`, "", openCommand)
  }

  const magnetKey = "Software\\Classes\\magnet"
  setRegistryValue(magnetKey, "", "URL:Magnet Protocol")
  setRegistryValue(magnetKey, "URL Protocol", "")
  setRegistryValue(
    `${magnetKey}\\shell\\open\\command`,
    "",
    `"${executablePath}" "%1"`
  )
}

// Parse a `grabbit:?payload=...` launch argument into a URL launch link.
function parseProtocolLaunchLink(value: string): GrabbitLaunchLink | null {
  if (value.startsWith(`${appProtocol}:?`)) {
    const payload = new URL(value).searchParams.get("payload")
    if (!payload) return null
    return { kind: "url", payload: JSON.parse(payload) }
  }
  return null
}

function parseMagnetLaunchLink(value: string): GrabbitLaunchLink | null {
  if (value.startsWith(`${magnetProtocol}:`)) {
    return { kind: "url", payload: { url: value, header: [] } }
  }
  return null
}

// Convert a file URL into a local path when needed.
function normalizeFileLaunchPath(value: string) {
  if (value.startsWith("file://")) {
    return fileURLToPath(value)
  }
  return value
}

// Parse local torrent and metalink paths into launch links.
function parseFileLaunchLink(value: string): LaunchLink | null {
  const filePath = normalizeFileLaunchPath(value)
  if (filePath.endsWith(".torrent")) {
    return { kind: "torrent", value: filePath }
  }
  if (filePath.endsWith(".metalink") || filePath.endsWith(".meta4")) {
    return { kind: "metalink", value: filePath }
  }
  return null
}

// Parse launch arguments from URL schemes and file paths.
function getLaunchLinks(argv: string[]): LaunchLink[] {
  return argv.flatMap((value) => {
    return (
      parseMagnetLaunchLink(value) ??
      parseProtocolLaunchLink(value) ??
      parseFileLaunchLink(value) ??
      []
    )
  })
}

// Submit metalink files directly; URL and torrent inputs need user options first.
async function addLaunchLinks(launchLinks: LaunchLink[]) {
  return await Promise.allSettled(
    launchLinks.map(async (launchLink) => {
      if (launchLink.kind !== "metalink") return

      const file = await readFile(launchLink.value)
      return await callAria2<string>("aria2.addMetalink", [
        file.toString("base64"),
      ])
    })
  )
}

export function takePendingLaunchInputs() {
  const inputs = pendingLaunchInputs
  pendingLaunchInputs = []
  return inputs
}

function dispatchLaunchInputs() {
  const mainWindow = getMainWindow()
  if (!mainWindow || mainWindow.webContents.isLoading()) return
  const inputs = takePendingLaunchInputs()
  if (inputs.length > 0) {
    mainWindow.webContents.send("grabbit.launchInputs", inputs)
  }
}

// Queue launch arguments until aria2 is available, then process them and show the window.
export function handleLaunchArgs(argv: string[]) {
  pendingLaunchArgs.push(...argv)
  if (aria2Process) {
    showWindow()
    const launchLinks = getLaunchLinks(pendingLaunchArgs)
    pendingLaunchInputs.push(
      ...launchLinks.flatMap((launchLink): LaunchInput[] => {
        if (launchLink.kind === "torrent") {
          return [{ kind: "torrent", value: launchLink.value }]
        }
        if (launchLink.kind === "url") {
          return [
            {
              kind: "url",
              value: launchLink.payload.url,
              header: launchLink.payload.header,
            },
          ]
        }
        return []
      })
    )
    void addLaunchLinks(launchLinks)
    dispatchLaunchInputs()
    pendingLaunchArgs = []
  }
}
