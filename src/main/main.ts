import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process"
import {
  app,
  BrowserWindow,
  Menu,
  Notification,
  Tray,
  dialog,
  ipcMain,
  nativeImage,
  shell,
  type MenuItemConstructorOptions,
} from "electron"
import fs from "node:fs/promises"
import path from "node:path"
import parseTorrent from "parse-torrent"
import started from "electron-squirrel-startup"
import {
  buildGlobalAria2Options,
  buildSchedulerGlobalOptions,
  defaultGrabbitPreferences,
  defaultTaskSchedulerRule,
  normalizeAria2Options,
  normalizeDownloadDirectoryHistory,
  normalizeTaskSchedulerRule,
  parseExternalTaskIntents,
  supportedExternalProtocols,
  type ExternalTaskIntent,
  type GrabbitPreferences,
  type ParsedTorrentInfo,
  type TaskSchedulerRule,
  type TorrentFileEntry,
} from "../shared/grabbit"

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
    index?: string
    path: string
    length: string
    completedLength: string
    selected: string
    uris?: Array<{ uri: string; status: string }>
  }>
  bittorrent?: {
    announceList?: string[][]
    comment?: string
    creationDate?: string
    mode?: string
    info?: { name?: string }
  }
  verifiedLength?: string
  verifyIntegrityPending?: string
  numSeeders?: string
  seeder?: string
  errorCode?: string
  errorMessage?: string
}

type AddTaskPayload = {
  uris: string[]
  options?: Record<string, string | number | boolean | undefined>
}

type AddTorrentPayload = {
  torrentPath: string
  options?: Record<string, string | number | boolean | undefined>
}

type ParsedTorrentFile = {
  path?: string
  name?: string
  length?: number
}

type ParsedTorrent = {
  name?: string
  files?: ParsedTorrentFile[]
  length?: number
}

type RestartTaskPayload = {
  task: Aria2Task
  options?: Record<string, string | number | boolean | undefined>
}

type DeleteTaskFilesResult = {
  deleted: string[]
  skipped: Array<{ path: string; reason: string }>
  failed: Array<{ path: string; error: string }>
}

const RPC_PORT = 16800
const RPC_SECRET = "grabbit"
const RPC_URL = `http://127.0.0.1:${RPC_PORT}/jsonrpc`

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let pendingExternalIntents: ExternalTaskIntent[] = []
let aria2Process: ChildProcessWithoutNullStreams | null = null
let schedulerTimer: NodeJS.Timeout | null = null
let taskMonitorTimer: NodeJS.Timeout | null = null
let completedNotificationPrimed = false
let isQuitting = false
let closeToTrayEnabled = false
const notifiedCompletedGids = new Set<string>()

const isSupportedExternalValue = (value: string) =>
  /^(https?|ftp|magnet|thunder|mo|motrix):/i.test(value) ||
  /\.torrent(?:$|[?#])/i.test(value)

const collectExternalIntents = (values: string[]) =>
  parseExternalTaskIntents(values.filter(isSupportedExternalValue))

const registerProtocolClients = () => {
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

const sendExternalIntents = (intents: ExternalTaskIntent[]) => {
  if (intents.length === 0) {
    return
  }

  if (!mainWindow || mainWindow.webContents.isLoading()) {
    pendingExternalIntents.push(...intents)
    return
  }

  mainWindow.show()
  mainWindow.focus()
  mainWindow.webContents.send("external:task-intents", intents)
}

const flushExternalIntents = () => {
  if (pendingExternalIntents.length === 0) {
    return
  }

  const nextIntents = pendingExternalIntents
  pendingExternalIntents = []
  sendExternalIntents(nextIntents)
}

const showMainWindow = () => {
  if (!mainWindow) {
    void createWindow()
    return
  }
  mainWindow.show()
  mainWindow.focus()
}

const createNativeMenu = () => {
  const template: MenuItemConstructorOptions[] = [
    ...(process.platform === "darwin"
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          } satisfies MenuItemConstructorOptions,
        ]
      : []),
    {
      label: "任务",
      submenu: [
        {
          label: "新建下载任务",
          accelerator: "CmdOrCtrl+N",
          click: () =>
            sendExternalIntents([
              { kind: "command", value: "menu:new-task", command: "new-task" },
            ]),
        },
        {
          label: "打开 Torrent 文件…",
          accelerator: "CmdOrCtrl+O",
          click: async () => {
            const { canceled, filePaths } = await dialog.showOpenDialog({
              properties: ["openFile"],
              filters: [{ name: "Torrent", extensions: ["torrent"] }],
            })
            if (!canceled) {
              sendExternalIntents(
                filePaths.map((filePath) => ({
                  kind: "torrent",
                  value: filePath,
                }))
              )
            }
          },
        },
        { type: "separator" },
        { label: "暂停全部", click: () => void callAria2("aria2.pauseAll") },
        { label: "开始全部", click: () => void callAria2("aria2.unpauseAll") },
      ],
    },
    {
      label: "视图",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "窗口",
      submenu: [{ role: "minimize" }, { role: "close" }],
    },
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

const createTray = () => {
  if (tray) {
    return
  }

  const image = nativeImage.createFromDataURL(
    "data:image/svg+xml;utf8," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#18181b"/><path d="M16 6v14m0 0 6-6m-6 6-6-6M9 25h14" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      )
  )
  image.setTemplateImage(process.platform === "darwin")

  tray = new Tray(image)
  tray.setToolTip("Grabbit")
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "显示 Grabbit", click: showMainWindow },
      {
        label: "新建下载任务",
        click: () =>
          sendExternalIntents([
            { kind: "command", value: "tray:new-task", command: "new-task" },
          ]),
      },
      {
        label: "打开 Torrent 文件…",
        click: async () => {
          const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ["openFile"],
            filters: [{ name: "Torrent", extensions: ["torrent"] }],
          })
          if (!canceled) {
            sendExternalIntents(
              filePaths.map((filePath) => ({
                kind: "torrent",
                value: filePath,
              }))
            )
          }
        },
      },
      { type: "separator" },
      { label: "退出", click: () => app.quit() },
    ])
  )
  tray.on("click", showMainWindow)
}

const getAria2Executable = () => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "aria2", "linux-x64", "aria2c")
  }

  return path.join(
    app.getAppPath(),
    "resources",
    "aria2",
    "linux-x64",
    "aria2c"
  )
}

const getSessionPath = () => path.join(app.getPath("userData"), "aria2.session")
const getPreferencesPath = () =>
  path.join(app.getPath("userData"), "preferences.json")
const getSchedulerPath = () =>
  path.join(app.getPath("userData"), "scheduler.json")
const getWindowStatePath = () =>
  path.join(app.getPath("userData"), "window-state.json")
const getFallbackDownloadDir = () =>
  path.join(app.getPath("downloads"), "Grabbit")

type WindowState = {
  width: number
  height: number
  x?: number
  y?: number
  maximized?: boolean
}

const defaultWindowState: WindowState = {
  width: 1120,
  height: 720,
}

const readWindowState = async (): Promise<WindowState> => {
  try {
    const raw = await fs.readFile(getWindowStatePath(), "utf8")
    const state = JSON.parse(raw) as Partial<WindowState>
    return {
      width: Math.max(920, Number(state.width) || defaultWindowState.width),
      height: Math.max(600, Number(state.height) || defaultWindowState.height),
      x: Number.isFinite(state.x) ? state.x : undefined,
      y: Number.isFinite(state.y) ? state.y : undefined,
      maximized: state.maximized === true,
    }
  } catch {
    return defaultWindowState
  }
}

const saveWindowState = async () => {
  if (!mainWindow) {
    return
  }

  const bounds = mainWindow.getBounds()
  const state: WindowState = {
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    maximized: mainWindow.isMaximized(),
  }
  await fs.mkdir(app.getPath("userData"), { recursive: true })
  await fs.writeFile(
    getWindowStatePath(),
    JSON.stringify(state, null, 2),
    "utf8"
  )
}

const applyLoginItemPreference = (
  preferences: Pick<GrabbitPreferences, "openAtLogin">
) => {
  if (!app.isReady()) {
    return
  }

  app.setLoginItemSettings({
    openAtLogin: preferences.openAtLogin,
    path: process.execPath,
  })
}

const readPreferences = async (): Promise<GrabbitPreferences> => {
  const defaults = defaultGrabbitPreferences(getFallbackDownloadDir())

  try {
    const raw = await fs.readFile(getPreferencesPath(), "utf8")
    const preferences = JSON.parse(raw) as Partial<GrabbitPreferences>
    const nextPreferences = {
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
      continueDownloads:
        preferences.continueDownloads ?? defaults.continueDownloads,
      allProxy: preferences.allProxy ?? defaults.allProxy,
      openAtLogin: preferences.openAtLogin ?? defaults.openAtLogin,
      notifyOnDownloadComplete:
        preferences.notifyOnDownloadComplete ??
        defaults.notifyOnDownloadComplete,
      showDockProgress:
        preferences.showDockProgress ?? defaults.showDockProgress,
      theme:
        preferences.theme === "light" ||
        preferences.theme === "dark" ||
        preferences.theme === "system"
          ? preferences.theme
          : defaults.theme,
      resumeAllOnLaunch:
        preferences.resumeAllOnLaunch ?? defaults.resumeAllOnLaunch,
      closeToTray: preferences.closeToTray ?? defaults.closeToTray,
      downloadDirectoryHistory: normalizeDownloadDirectoryHistory(
        preferences.downloadDir || defaults.downloadDir,
        preferences.downloadDirectoryHistory ??
          defaults.downloadDirectoryHistory
      ),
    }
    closeToTrayEnabled = nextPreferences.closeToTray
    return nextPreferences
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
    downloadDirectoryHistory: normalizeDownloadDirectoryHistory(
      preferences.downloadDir || defaults.downloadDir,
      preferences.downloadDirectoryHistory ?? defaults.downloadDirectoryHistory
    ),
  }
  await fs.mkdir(app.getPath("userData"), { recursive: true })
  await fs.writeFile(
    getPreferencesPath(),
    JSON.stringify(nextPreferences, null, 2),
    "utf8"
  )

  closeToTrayEnabled = nextPreferences.closeToTray
  applyLoginItemPreference(nextPreferences)

  if (aria2Process) {
    await fs.mkdir(nextPreferences.downloadDir, { recursive: true })
    await callAria2("aria2.changeGlobalOption", [
      buildGlobalAria2Options(nextPreferences),
    ])
  }

  return nextPreferences
}

const readSchedulerRule = async (): Promise<TaskSchedulerRule> => {
  try {
    const raw = await fs.readFile(getSchedulerPath(), "utf8")
    return normalizeTaskSchedulerRule(
      JSON.parse(raw) as Partial<TaskSchedulerRule>
    )
  } catch {
    return defaultTaskSchedulerRule()
  }
}

const writeSchedulerRule = async (rule: TaskSchedulerRule) => {
  const nextRule = normalizeTaskSchedulerRule(rule)
  await fs.mkdir(app.getPath("userData"), { recursive: true })
  await fs.writeFile(
    getSchedulerPath(),
    JSON.stringify(nextRule, null, 2),
    "utf8"
  )
  await applySchedulerRule()
  return nextRule
}

const applySchedulerRule = async () => {
  if (!aria2Process) {
    return
  }

  const [preferences, schedulerRule] = await Promise.all([
    readPreferences(),
    readSchedulerRule(),
  ])
  const nextOptions = buildSchedulerGlobalOptions(schedulerRule, preferences)

  await callAria2("aria2.changeGlobalOption", [nextOptions])
}

const ensureSchedulerTimer = () => {
  if (schedulerTimer) {
    return
  }

  schedulerTimer = setInterval(() => {
    void applySchedulerRule().catch((error) => {
      console.error("Failed to apply scheduler rule", error)
    })
  }, 60_000)
}

const clearSchedulerTimer = () => {
  if (schedulerTimer) {
    clearInterval(schedulerTimer)
    schedulerTimer = null
  }
}

const updateTaskProgressAndNotifications = async () => {
  if (!mainWindow || !aria2Process) {
    return
  }

  const preferences = await readPreferences()

  if (preferences.showDockProgress) {
    const activeTasks = await callAria2<Aria2Task[]>("aria2.tellActive", [
      ["gid", "totalLength", "completedLength"],
    ])
    const total = activeTasks.reduce(
      (sum, task) => sum + Number(task.totalLength || 0),
      0
    )
    const completed = activeTasks.reduce(
      (sum, task) => sum + Number(task.completedLength || 0),
      0
    )
    mainWindow.setProgressBar(total > 0 ? Math.min(1, completed / total) : -1)
  } else {
    mainWindow.setProgressBar(-1)
  }

  if (!preferences.notifyOnDownloadComplete || !Notification.isSupported()) {
    return
  }

  const stoppedTasks = await callAria2<Aria2Task[]>("aria2.tellStopped", [
    0,
    50,
    ["gid", "status", "files", "bittorrent"],
  ])
  const completedTasks = stoppedTasks.filter(
    (task) => task.status === "complete"
  )

  if (!completedNotificationPrimed) {
    completedTasks.forEach((task) => notifiedCompletedGids.add(task.gid))
    completedNotificationPrimed = true
    return
  }

  for (const task of completedTasks) {
    if (notifiedCompletedGids.has(task.gid)) {
      continue
    }
    notifiedCompletedGids.add(task.gid)
    new Notification({
      title: "下载完成",
      body: task.bittorrent?.info?.name || task.files?.[0]?.path || task.gid,
    }).show()
  }
}

const ensureTaskMonitorTimer = () => {
  if (taskMonitorTimer) {
    return
  }

  taskMonitorTimer = setInterval(() => {
    void updateTaskProgressAndNotifications().catch((error) => {
      console.error("Failed to update task progress/notifications", error)
    })
  }, 2_000)
}

const clearTaskMonitorTimer = () => {
  if (taskMonitorTimer) {
    clearInterval(taskMonitorTimer)
    taskMonitorTimer = null
  }
  if (mainWindow) {
    mainWindow.setProgressBar(-1)
  }
}

const getDefaultDownloadDir = async () => (await readPreferences()).downloadDir

const startAria2 = async () => {
  if (aria2Process) {
    return
  }

  const aria2Path = getAria2Executable()
  const preferences = await readPreferences()
  const schedulerRule = await readSchedulerRule()
  const downloadDir = preferences.downloadDir
  await fs.mkdir(downloadDir, { recursive: true })
  await fs.mkdir(app.getPath("userData"), { recursive: true })
  const sessionPath = getSessionPath()
  const globalOptions = {
    ...buildGlobalAria2Options(preferences),
    ...buildSchedulerGlobalOptions(schedulerRule, preferences),
  }

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
      ...(globalOptions["all-proxy"]
        ? [`--all-proxy=${globalOptions["all-proxy"]}`]
        : []),
      ...(globalOptions["user-agent"]
        ? [`--user-agent=${globalOptions["user-agent"]}`]
        : []),
      `--bt-save-metadata=${globalOptions["bt-save-metadata"]}`,
      `--bt-force-encryption=${globalOptions["bt-force-encryption"]}`,
      `--follow-torrent=${globalOptions["follow-torrent"]}`,
      `--follow-metalink=${globalOptions["follow-metalink"]}`,
      `--seed-ratio=${globalOptions["seed-ratio"]}`,
      `--seed-time=${globalOptions["seed-time"]}`,
      ...(globalOptions["bt-tracker"]
        ? [`--bt-tracker=${globalOptions["bt-tracker"]}`]
        : []),
      `--listen-port=${globalOptions["listen-port"]}`,
      `--dht-listen-port=${globalOptions["dht-listen-port"]}`,
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

  ensureSchedulerTimer()
  ensureTaskMonitorTimer()

  if (preferences.resumeAllOnLaunch) {
    void callAria2("aria2.unpauseAll").catch((error) => {
      console.error("Failed to resume all tasks on launch", error)
    })
  }

  void updateTaskProgressAndNotifications().catch((error) => {
    console.error("Failed to update task progress/notifications", error)
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
  clearSchedulerTimer()
  clearTaskMonitorTimer()
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
    throw new Error(
      `aria2 RPC failed: ${response.status} ${response.statusText}`
    )
  }

  const data = (await response.json()) as JsonRpcSuccess<T> | JsonRpcFailure
  if ("error" in data) {
    throw new Error(data.error.message)
  }

  return data.result
}

const normalizeOptions = normalizeAria2Options

const getFileExtension = (filePath: string) => {
  const extension = path.extname(filePath)
  return extension || ""
}

const parseTorrentFile = async (
  torrentPath: string
): Promise<ParsedTorrentInfo> => {
  const torrent = await fs.readFile(torrentPath)
  const parsed = parseTorrent(torrent) as ParsedTorrent
  const filesSource = parsed.files?.length
    ? parsed.files
    : [{ path: parsed.name, name: parsed.name, length: parsed.length }]

  const files: TorrentFileEntry[] = filesSource.map((file, index) => {
    const filePath =
      file.path || file.name || `${parsed.name || "torrent"}-${index + 1}`
    const name = path.basename(filePath)
    return {
      index: index + 1,
      path: filePath,
      name,
      extension: getFileExtension(name),
      length: Number(file.length ?? 0),
    }
  })

  return {
    name: parsed.name || path.basename(torrentPath),
    files,
    totalLength: files.reduce((sum, file) => sum + file.length, 0),
  }
}

const isStoppedTask = (task: Pick<Aria2Task, "status">) =>
  task.status === "complete" ||
  task.status === "error" ||
  task.status === "removed"

const isPathInside = (candidatePath: string, parentPath: string) => {
  const relativePath = path.relative(parentPath, candidatePath)
  return (
    relativePath === "" ||
    (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
  )
}

const deleteTaskFiles = async (
  task: Aria2Task
): Promise<DeleteTaskFilesResult> => {
  const result: DeleteTaskFilesResult = {
    deleted: [],
    skipped: [],
    failed: [],
  }
  const taskDir = path.resolve(task.dir || getFallbackDownloadDir())
  const rawPaths = Array.from(
    new Set(task.files?.map((file) => file.path.trim()).filter(Boolean) ?? [])
  )

  if (rawPaths.length === 0) {
    result.skipped.push({
      path: taskDir,
      reason: "这个任务没有可删除的本地文件路径",
    })
    return result
  }

  for (const rawPath of rawPaths) {
    const filePath = path.resolve(rawPath)

    if (!isPathInside(filePath, taskDir)) {
      result.skipped.push({
        path: rawPath,
        reason: "文件路径不在任务保存目录内，已跳过",
      })
      continue
    }

    try {
      const stats = await fs.stat(filePath)
      if (stats.isDirectory()) {
        result.skipped.push({
          path: filePath,
          reason: "为避免误删目录，仅移入任务文件",
        })
        continue
      }

      await shell.trashItem(filePath)
      result.deleted.push(filePath)
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException
      if (nodeError.code === "ENOENT") {
        result.skipped.push({ path: filePath, reason: "文件不存在" })
      } else {
        result.failed.push({
          path: filePath,
          error: error instanceof Error ? error.message : "删除失败",
        })
      }
    }
  }

  return result
}

const removeTask = async (task: Aria2Task, deleteFiles = false) => {
  if (isStoppedTask(task)) {
    await callAria2("aria2.removeDownloadResult", [task.gid])
  } else {
    await callAria2("aria2.remove", [task.gid])
  }

  if (!deleteFiles) {
    return null
  }

  return deleteTaskFiles(task)
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
    "bittorrent",
    "verifiedLength",
    "verifyIntegrityPending",
    "numSeeders",
    "seeder",
    "errorCode",
    "errorMessage",
  ]

  if (status === "active") {
    return callAria2<Aria2Task[]>("aria2.tellActive", [keys])
  }

  if (status === "waiting") {
    return callAria2<Aria2Task[]>("aria2.tellWaiting", [0, 100, keys])
  }

  return callAria2<Aria2Task[]>("aria2.tellStopped", [0, 100, keys])
}

const createWindow = async () => {
  const windowState = await readWindowState()
  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 920,
    minHeight: 600,
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  })

  if (windowState.maximized) {
    mainWindow.maximize()
  }

  mainWindow.on("close", (event) => {
    void saveWindowState().catch((error) => {
      console.error("Failed to save window state", error)
    })

    if (!isQuitting && closeToTrayEnabled && tray) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on("closed", () => {
    mainWindow = null
  })

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    )
  }

  mainWindow.webContents.once("did-finish-load", flushExternalIntents)
}

const gotSingleInstanceLock = app.requestSingleInstanceLock()

if (!gotSingleInstanceLock) {
  app.quit()
} else {
  app.on("second-instance", (_event, argv) => {
    showMainWindow()
    sendExternalIntents(collectExternalIntents(argv))
  })
}

app.on("open-url", (event, url) => {
  event.preventDefault()
  sendExternalIntents(collectExternalIntents([url]))
})

app.on("open-file", (event, filePath) => {
  if (/\.torrent$/i.test(filePath)) {
    event.preventDefault()
    sendExternalIntents([{ kind: "torrent", value: filePath }])
  }
})

app.on("ready", () => {
  registerProtocolClients()
  createNativeMenu()
  createTray()
  pendingExternalIntents.push(...collectExternalIntents(process.argv))
  void startAria2()
  void createWindow()
  void readPreferences().then(applyLoginItemPreference)
})

app.on("before-quit", () => {
  isQuitting = true
  void stopAria2()
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow()
  }
})

ipcMain.handle(
  "tasks:list",
  (_event, status: "active" | "waiting" | "stopped") => fetchTasks(status)
)

ipcMain.handle("tasks:get-peers", (_event, gid: string) =>
  callAria2("aria2.getPeers", [gid])
)

ipcMain.handle("tasks:get-servers", (_event, gid: string) =>
  callAria2("aria2.getServers", [gid])
)

ipcMain.handle("tasks:add-uri", async (_event, payload: AddTaskPayload) => {
  const options = normalizeOptions(payload.options)
  const gids = await Promise.all(
    payload.uris.map((uri) =>
      callAria2<string>("aria2.addUri", [[uri], options])
    )
  )

  return gids
})

ipcMain.handle(
  "tasks:add-torrent",
  async (_event, payload: AddTorrentPayload) => {
    const options = normalizeOptions(payload.options)
    const torrent = await fs.readFile(payload.torrentPath)
    return callAria2<string>("aria2.addTorrent", [
      torrent.toString("base64"),
      [],
      options,
    ])
  }
)

ipcMain.handle("torrent:parse", (_event, torrentPath: string) =>
  parseTorrentFile(torrentPath)
)

ipcMain.handle("tasks:restart", async (_event, payload: RestartTaskPayload) => {
  const options = normalizeOptions({
    dir: payload.task.dir,
    ...payload.options,
  })
  const uris = payload.task.files
    ?.flatMap((file) => file.uris?.map((uri) => uri.uri) ?? [])
    .filter((uri) => /^(https?|ftp):\/\//i.test(uri) || /^magnet:\?/i.test(uri))

  if (uris?.length) {
    return Promise.all(
      uris.map((uri) => callAria2<string>("aria2.addUri", [[uri], options]))
    )
  }

  throw new Error("这个任务没有可用于重新下载的原始链接")
})

ipcMain.handle("tasks:purge-results", () =>
  callAria2("aria2.purgeDownloadResult")
)
ipcMain.handle("app:select-torrent", async () => {
  const window = BrowserWindow.getFocusedWindow() ?? mainWindow
  const result = await dialog.showOpenDialog(window!, {
    properties: ["openFile"],
    filters: [{ name: "Torrent", extensions: ["torrent"] }],
  })

  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle("tasks:pause", (_event, gid: string) =>
  callAria2("aria2.pause", [gid])
)
ipcMain.handle("tasks:resume", (_event, gid: string) =>
  callAria2("aria2.unpause", [gid])
)
ipcMain.handle(
  "tasks:remove",
  (_event, taskOrGid: Aria2Task | string, deleteFiles = false) => {
    if (typeof taskOrGid === "string") {
      return callAria2("aria2.remove", [taskOrGid])
    }

    return removeTask(taskOrGid, deleteFiles)
  }
)
ipcMain.handle(
  "tasks:remove-result",
  (_event, taskOrGid: Aria2Task | string, deleteFiles = false) => {
    if (typeof taskOrGid === "string") {
      return callAria2("aria2.removeDownloadResult", [taskOrGid])
    }

    return removeTask(taskOrGid, deleteFiles)
  }
)
ipcMain.handle("tasks:delete-files", (_event, task: Aria2Task) =>
  deleteTaskFiles(task)
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
ipcMain.handle("app:open-path", async (_event, targetPath: string) => {
  if (!targetPath) {
    return ""
  }

  const stats = await fs.stat(targetPath).catch(() => null)
  if (stats?.isFile()) {
    shell.showItemInFolder(targetPath)
    return ""
  }

  return shell.openPath(targetPath)
})
ipcMain.handle("app:get-preferences", () => readPreferences())
ipcMain.handle(
  "app:set-preferences",
  (_event, preferences: GrabbitPreferences) => writePreferences(preferences)
)
ipcMain.handle("app:get-scheduler", () => readSchedulerRule())
ipcMain.handle("app:set-scheduler", (_event, rule: TaskSchedulerRule) =>
  writeSchedulerRule(rule)
)
ipcMain.handle("app:get-default-dir", () => getDefaultDownloadDir())
