import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process"
import { app, BrowserWindow, dialog, ipcMain, shell } from "electron"
import fs from "node:fs/promises"
import path from "node:path"
import started from "electron-squirrel-startup"
import { normalizeAria2Options, buildGlobalAria2Options, defaultGrabbitPreferences, type GrabbitPreferences } from "../shared/grabbit"

if (started) {
  app.quit()
}

type JsonRpcSuccess<T> = {
  id: string
  jsonrpc: "2.0"
  result: T
}

type JsonRpcFailure = {
  id: string
  jsonrpc: "2.0"
  error: {
    code: number
    message: string
  }
}

type Aria2Task = {
  gid: string
  status: string
  totalLength: string
  completedLength: string
  downloadSpeed: string
  uploadSpeed: string
  connections: string
  dir: string
  files?: Array<{
    path: string
    length: string
    completedLength: string
    selected: string
  }>
}

type AddTaskPayload = {
  uris: string[]
  options?: Record<string, string | number | boolean | undefined>
}

const RPC_PORT = 16800
const RPC_SECRET = "grabbit"
const RPC_URL = `http://127.0.0.1:${RPC_PORT}/jsonrpc`

let mainWindow: BrowserWindow | null = null
let aria2Process: ChildProcessWithoutNullStreams | null = null

const getAria2Executable = () => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "aria2", "linux-x64", "aria2c")
  }

  return path.join(app.getAppPath(), "resources", "aria2", "linux-x64", "aria2c")
}

const getSessionPath = () => path.join(app.getPath("userData"), "aria2.session")
const getPreferencesPath = () => path.join(app.getPath("userData"), "preferences.json")
const getFallbackDownloadDir = () => path.join(app.getPath("downloads"), "Grabbit")

const readPreferences = async (): Promise<GrabbitPreferences> => {
  const defaults = defaultGrabbitPreferences(getFallbackDownloadDir())

  try {
    const raw = await fs.readFile(getPreferencesPath(), "utf8")
    const preferences = JSON.parse(raw) as Partial<GrabbitPreferences>
    return {
      ...defaults,
      ...preferences,
      downloadDir: preferences.downloadDir || defaults.downloadDir,
      maxConcurrentDownloads:
        preferences.maxConcurrentDownloads ?? defaults.maxConcurrentDownloads,
      maxConnectionPerServer:
        preferences.maxConnectionPerServer ?? defaults.maxConnectionPerServer,
      split: preferences.split ?? defaults.split,
      maxOverallDownloadLimit:
        preferences.maxOverallDownloadLimit ?? defaults.maxOverallDownloadLimit,
      maxOverallUploadLimit:
        preferences.maxOverallUploadLimit ?? defaults.maxOverallUploadLimit,
      continueDownloads: preferences.continueDownloads ?? defaults.continueDownloads,
      allProxy: preferences.allProxy ?? defaults.allProxy,
    }
  } catch {
    return defaults
  }
}

const writePreferences = async (preferences: GrabbitPreferences) => {
  const defaults = defaultGrabbitPreferences(getFallbackDownloadDir())
  const nextPreferences = {
    ...defaults,
    ...preferences,
    downloadDir: preferences.downloadDir || defaults.downloadDir,
  }
  await fs.mkdir(app.getPath("userData"), { recursive: true })
  await fs.writeFile(getPreferencesPath(), JSON.stringify(nextPreferences, null, 2), "utf8")

  if (aria2Process) {
    await fs.mkdir(nextPreferences.downloadDir, { recursive: true })
    await callAria2("aria2.changeGlobalOption", [buildGlobalAria2Options(nextPreferences)])
  }

  return nextPreferences
}

const getDefaultDownloadDir = async () => (await readPreferences()).downloadDir

const startAria2 = async () => {
  if (aria2Process) {
    return
  }

  const aria2Path = getAria2Executable()
  const preferences = await readPreferences()
  const downloadDir = preferences.downloadDir
  await fs.mkdir(downloadDir, { recursive: true })
  await fs.mkdir(app.getPath("userData"), { recursive: true })
  const sessionPath = getSessionPath()
  const globalOptions = buildGlobalAria2Options(preferences)

  aria2Process = spawn(
    aria2Path,
    [
      "--enable-rpc=true",
      "--rpc-listen-all=false",
      `--rpc-listen-port=${RPC_PORT}`,
      `--rpc-secret=${RPC_SECRET}`,
      `--dir=${globalOptions.dir}`,
      `--input-file=${sessionPath}`,
      `--save-session=${sessionPath}`,
      "--save-session-interval=15",
      `--continue=${globalOptions.continue}`,
      `--max-concurrent-downloads=${globalOptions["max-concurrent-downloads"]}`,
      `--max-connection-per-server=${globalOptions["max-connection-per-server"]}`,
      `--split=${globalOptions.split}`,
      `--max-overall-download-limit=${globalOptions["max-overall-download-limit"]}`,
      `--max-overall-upload-limit=${globalOptions["max-overall-upload-limit"]}`,
      ...(globalOptions["all-proxy"] ? [`--all-proxy=${globalOptions["all-proxy"]}`] : []),
      "--min-split-size=1M",
      "--summary-interval=0",
    ],
    {
      stdio: "pipe",
    }
  )

  aria2Process.on("exit", () => {
    aria2Process = null
  })

  aria2Process.stderr.on("data", (chunk) => {
    console.error(`[aria2] ${chunk}`)
  })
}

const stopAria2 = async () => {
  if (!aria2Process) {
    return
  }

  try {
    await callAria2("aria2.saveSession")
  } catch (error) {
    console.error("Failed to save aria2 session", error)
  }

  aria2Process.kill()
  aria2Process = null
}

const callAria2 = async <T = unknown>(
  method: string,
  params: unknown[] = []
): Promise<T> => {
  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: crypto.randomUUID(),
      jsonrpc: "2.0",
      method,
      params: [`token:${RPC_SECRET}`, ...params],
    }),
  })

  if (!response.ok) {
    throw new Error(`aria2 RPC failed: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as JsonRpcSuccess<T> | JsonRpcFailure
  if ("error" in data) {
    throw new Error(data.error.message)
  }

  return data.result
}

const normalizeOptions = normalizeAria2Options

const fetchTasks = async (status: "active" | "waiting" | "stopped") => {
  const keys = [
    "gid",
    "status",
    "totalLength",
    "completedLength",
    "downloadSpeed",
    "uploadSpeed",
    "connections",
    "dir",
    "files",
  ]

  if (status === "active") {
    const [active, waiting] = await Promise.all([
      callAria2<Aria2Task[]>("aria2.tellActive", [keys]),
      callAria2<Aria2Task[]>("aria2.tellWaiting", [0, 100, keys]),
    ])

    return [...active, ...waiting]
  }

  if (status === "waiting") {
    return callAria2<Aria2Task[]>("aria2.tellWaiting", [0, 100, keys])
  }

  return callAria2<Aria2Task[]>("aria2.tellStopped", [0, 100, keys])
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1120,
    height: 720,
    minWidth: 920,
    minHeight: 600,
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  })

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    )
  }
}

app.on("ready", () => {
  void startAria2()
  createWindow()
})

app.on("before-quit", () => {
  void stopAria2()
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

ipcMain.handle("tasks:list", (_event, status: "active" | "waiting" | "stopped") =>
  fetchTasks(status)
)

ipcMain.handle("tasks:add-uri", async (_event, payload: AddTaskPayload) => {
  const options = normalizeOptions(payload.options)
  const gids = await Promise.all(
    payload.uris.map((uri) => callAria2<string>("aria2.addUri", [[uri], options]))
  )

  return gids
})

ipcMain.handle("tasks:pause", (_event, gid: string) => callAria2("aria2.pause", [gid]))
ipcMain.handle("tasks:resume", (_event, gid: string) => callAria2("aria2.unpause", [gid]))
ipcMain.handle("tasks:remove", (_event, gid: string) => callAria2("aria2.remove", [gid]))
ipcMain.handle("tasks:remove-result", (_event, gid: string) =>
  callAria2("aria2.removeDownloadResult", [gid])
)
ipcMain.handle("tasks:pause-all", () => callAria2("aria2.pauseAll"))
ipcMain.handle("tasks:resume-all", () => callAria2("aria2.unpauseAll"))
ipcMain.handle("app:select-directory", async () => {
  const window = BrowserWindow.getFocusedWindow() ?? mainWindow
  const result = await dialog.showOpenDialog(window!, {
    defaultPath: await getDefaultDownloadDir(),
    properties: ["openDirectory", "createDirectory"],
  })

  return result.canceled ? null : result.filePaths[0]
})
ipcMain.handle("app:open-path", (_event, targetPath: string) => shell.openPath(targetPath))
ipcMain.handle("app:get-preferences", () => readPreferences())
ipcMain.handle("app:set-preferences", (_event, preferences: GrabbitPreferences) =>
  writePreferences(preferences)
)
ipcMain.handle("app:get-default-dir", () => getDefaultDownloadDir())
