import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process"
import { app, BrowserWindow, dialog, ipcMain, shell } from "electron"
import path from "node:path"
import started from "electron-squirrel-startup"

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
const getDefaultDownloadDir = () => path.join(app.getPath("downloads"), "Grabbit")

const startAria2 = () => {
  if (aria2Process) {
    return
  }

  const aria2Path = getAria2Executable()
  const downloadDir = getDefaultDownloadDir()
  const sessionPath = getSessionPath()

  aria2Process = spawn(
    aria2Path,
    [
      "--enable-rpc=true",
      "--rpc-listen-all=false",
      `--rpc-listen-port=${RPC_PORT}`,
      `--rpc-secret=${RPC_SECRET}`,
      `--dir=${downloadDir}`,
      `--input-file=${sessionPath}`,
      `--save-session=${sessionPath}`,
      "--save-session-interval=15",
      "--continue=true",
      "--max-connection-per-server=16",
      "--split=16",
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

const normalizeOptions = (
  options: AddTaskPayload["options"] = {}
): Record<string, string> => {
  const result: Record<string, string> = {}

  for (const [key, value] of Object.entries(options)) {
    if (value === undefined || value === "") {
      continue
    }

    const kebabKey = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
    result[kebabKey] = String(value)
  }

  return result
}

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
  startAria2()
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
    defaultPath: getDefaultDownloadDir(),
    properties: ["openDirectory", "createDirectory"],
  })

  return result.canceled ? null : result.filePaths[0]
})
ipcMain.handle("app:open-path", (_event, targetPath: string) => shell.openPath(targetPath))
ipcMain.handle("app:get-default-dir", () => getDefaultDownloadDir())
