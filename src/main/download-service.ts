import { app, ipcMain } from "electron"
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process"
import { randomBytes } from "node:crypto"
import { mkdir } from "node:fs/promises"
import path from "node:path"

import {
  DOWNLOAD_API_CHANNELS,
  type AddDownloadInput,
  type DownloadFile,
  type DownloadServiceStatus,
  type DownloadStatus,
  type DownloadTask,
} from "../shared/download-api"

type Aria2Status = DownloadStatus

type Aria2Uri = {
  uri?: string
}

type Aria2File = {
  index?: string
  path?: string
  length?: string
  completedLength?: string
  selected?: string
  uris?: Aria2Uri[]
}

type Aria2Task = {
  gid: string
  status: Aria2Status
  totalLength?: string
  completedLength?: string
  downloadSpeed?: string
  uploadSpeed?: string
  connections?: string
  dir?: string
  files?: Aria2File[]
  errorCode?: string
  errorMessage?: string
}

type Aria2Error = {
  code: number
  message: string
}

type Aria2RpcResponse<T> = {
  id: string
  result?: T
  error?: Aria2Error
}

type Aria2Options = Record<string, string>

const RPC_HOST = "127.0.0.1"
const RPC_PORT = 16800
const RPC_TIMEOUT_MS = 5_000
const DEFAULT_STATUS_KEYS = [
  "gid",
  "status",
  "totalLength",
  "completedLength",
  "downloadSpeed",
  "uploadSpeed",
  "connections",
  "dir",
  "files",
  "errorCode",
  "errorMessage",
]

class DownloadService {
  private process: ChildProcessWithoutNullStreams | null = null
  private secret = randomBytes(24).toString("hex")
  private startPromise: Promise<void> | null = null

  getServiceStatus(): DownloadServiceStatus {
    return {
      running: this.process !== null,
      rpcPort: this.process ? RPC_PORT : null,
    }
  }

  async addUri(input: AddDownloadInput) {
    if (input.uris.length === 0) {
      throw new Error("At least one URI is required")
    }

    const options: Aria2Options = {}
    if (input.dir) {
      options.dir = input.dir
    }
    if (input.out) {
      options.out = input.out
    }

    return this.call<string>("aria2.addUri", [input.uris, options])
  }

  async pause(gid: string) {
    return this.call<string>("aria2.pause", [gid])
  }

  async resume(gid: string) {
    return this.call<string>("aria2.unpause", [gid])
  }

  async remove(gid: string) {
    return this.call<string>("aria2.remove", [gid])
  }

  async getStatus(gid: string) {
    const task = await this.call<Aria2Task>("aria2.tellStatus", [
      gid,
      DEFAULT_STATUS_KEYS,
    ])
    return normalizeTask(task)
  }

  async list() {
    const [active, waiting, stopped] = await Promise.all([
      this.call<Aria2Task[]>("aria2.tellActive", [DEFAULT_STATUS_KEYS]),
      this.call<Aria2Task[]>("aria2.tellWaiting", [0, 1_000, DEFAULT_STATUS_KEYS]),
      this.call<Aria2Task[]>("aria2.tellStopped", [0, 1_000, DEFAULT_STATUS_KEYS]),
    ])

    return [...active, ...waiting, ...stopped].map(normalizeTask)
  }

  stop() {
    if (!this.process) {
      return
    }

    this.process.kill()
    this.process = null
    this.startPromise = null
  }

  private async call<T>(method: string, params: unknown[] = []) {
    await this.ensureStarted()

    const response = await fetch(`http://${RPC_HOST}:${RPC_PORT}/jsonrpc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: randomBytes(8).toString("hex"),
        method,
        params: [`token:${this.secret}`, ...params],
      }),
      signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
    })

    if (!response.ok) {
      throw new Error(`aria2 RPC failed with HTTP ${response.status}`)
    }

    const payload = (await response.json()) as Aria2RpcResponse<T>
    if (payload.error) {
      throw new Error(payload.error.message)
    }

    if (payload.result === undefined) {
      throw new Error("aria2 RPC returned no result")
    }

    return payload.result
  }

  private async ensureStarted() {
    if (this.process) {
      return
    }

    if (!this.startPromise) {
      this.startPromise = this.start()
    }

    return this.startPromise
  }

  private async start() {
    const sessionDir = path.join(app.getPath("userData"), "aria2")
    const sessionFile = path.join(sessionDir, "session.txt")
    await mkdir(sessionDir, { recursive: true })

    const aria2Path = getAria2Path()
    this.process = spawn(aria2Path, [
      "--enable-rpc=true",
      `--rpc-listen-port=${RPC_PORT}`,
      `--rpc-secret=${this.secret}`,
      "--rpc-listen-all=false",
      "--disable-ipv6=true",
      "--continue=true",
      `--input-file=${sessionFile}`,
      `--save-session=${sessionFile}`,
      "--save-session-interval=30",
    ])

    this.process.once("exit", () => {
      this.process = null
      this.startPromise = null
    })

    await waitForRpcReady(() => this.callVersion())
  }

  private async callVersion() {
    const response = await fetch(`http://${RPC_HOST}:${RPC_PORT}/jsonrpc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: randomBytes(8).toString("hex"),
        method: "aria2.getVersion",
        params: [`token:${this.secret}`],
      }),
      signal: AbortSignal.timeout(1_000),
    })

    if (!response.ok) {
      throw new Error("aria2 RPC is not ready")
    }
  }
}

function getAria2Path() {
  if (process.platform !== "linux" || process.arch !== "x64") {
    throw new Error("Bundled aria2 is currently available only for linux-x64")
  }

  if (app.isPackaged) {
    return path.join(process.resourcesPath, "aria2", "linux-x64", "aria2c")
  }

  return path.join(process.cwd(), "resources", "aria2", "linux-x64", "aria2c")
}

async function waitForRpcReady(check: () => Promise<void>) {
  const startedAt = Date.now()
  let lastError: unknown

  while (Date.now() - startedAt < RPC_TIMEOUT_MS) {
    try {
      await check()
      return
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  throw lastError instanceof Error ? lastError : new Error("aria2 RPC did not start")
}

function normalizeTask(task: Aria2Task): DownloadTask {
  return {
    gid: task.gid,
    status: task.status,
    totalLength: toNumber(task.totalLength),
    completedLength: toNumber(task.completedLength),
    downloadSpeed: toNumber(task.downloadSpeed),
    uploadSpeed: toNumber(task.uploadSpeed),
    connections: toNumber(task.connections),
    dir: task.dir ?? "",
    files: task.files?.map(normalizeFile) ?? [],
    errorCode: task.errorCode,
    errorMessage: task.errorMessage,
  }
}

function normalizeFile(file: Aria2File): DownloadFile {
  return {
    index: toNumber(file.index),
    path: file.path ?? "",
    length: toNumber(file.length),
    completedLength: toNumber(file.completedLength),
    selected: file.selected === "true",
    uris: file.uris?.flatMap((uri) => (uri.uri ? [uri.uri] : [])) ?? [],
  }
}

function toNumber(value: string | undefined) {
  if (!value) {
    return 0
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function registerDownloadApi() {
  const service = new DownloadService()

  ipcMain.handle(DOWNLOAD_API_CHANNELS.addUri, (_event, input: AddDownloadInput) =>
    service.addUri(input)
  )
  ipcMain.handle(DOWNLOAD_API_CHANNELS.pause, (_event, gid: string) =>
    service.pause(gid)
  )
  ipcMain.handle(DOWNLOAD_API_CHANNELS.resume, (_event, gid: string) =>
    service.resume(gid)
  )
  ipcMain.handle(DOWNLOAD_API_CHANNELS.remove, (_event, gid: string) =>
    service.remove(gid)
  )
  ipcMain.handle(DOWNLOAD_API_CHANNELS.list, () => service.list())
  ipcMain.handle(DOWNLOAD_API_CHANNELS.getStatus, (_event, gid: string) =>
    service.getStatus(gid)
  )
  ipcMain.handle(DOWNLOAD_API_CHANNELS.getServiceStatus, () =>
    service.getServiceStatus()
  )

  app.on("before-quit", () => {
    service.stop()
  })
}
