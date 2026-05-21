import { app, ipcMain } from "electron"
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process"
import { randomBytes } from "node:crypto"
import { mkdir } from "node:fs/promises"
import path from "node:path"

import {
  DOWNLOAD_API_CHANNELS,
  type AddMetalinkInput,
  type AddTorrentInput,
  type AddUriInput,
  type Aria2Options,
  type BittorrentInfo,
  type ChangePositionInput,
  type ChangeUriInput,
  type DownloadFile,
  type DownloadGlobalStat,
  type DownloadPeer,
  type DownloadServer,
  type DownloadServiceStatus,
  type DownloadStatus,
  type DownloadTask,
  type DownloadUri,
  type DownloadVersion,
  type RawRpcInput,
} from "../shared/download-api"

type Aria2Uri = {
  uri?: string
  status?: "used" | "waiting"
}

type Aria2File = {
  index?: string
  path?: string
  length?: string
  completedLength?: string
  selected?: string
  uris?: Aria2Uri[]
}

type Aria2Bittorrent = {
  announceList?: string[][]
  comment?: string
  creationDate?: string
  mode?: "single" | "multi"
  info?: {
    name?: string
  }
}

type Aria2Task = {
  gid: string
  status: DownloadStatus
  totalLength?: string
  completedLength?: string
  uploadLength?: string
  bitfield?: string
  downloadSpeed?: string
  uploadSpeed?: string
  infoHash?: string
  numSeeders?: string
  seeder?: string
  pieceLength?: string
  numPieces?: string
  connections?: string
  errorCode?: string
  errorMessage?: string
  followedBy?: string[]
  following?: string
  belongsTo?: string
  dir?: string
  files?: Aria2File[]
  bittorrent?: Aria2Bittorrent
  verifiedLength?: string
  verifyIntegrityPending?: string
}

type Aria2Peer = {
  peerId?: string
  ip?: string
  port?: string
  bitfield?: string
  amChoking?: string
  peerChoking?: string
  downloadSpeed?: string
  uploadSpeed?: string
  seeder?: string
}

type Aria2Server = {
  index?: string
  servers?: Array<{
    uri?: string
    currentUri?: string
    downloadSpeed?: string
  }>
}

type Aria2GlobalStat = {
  downloadSpeed?: string
  uploadSpeed?: string
  numActive?: string
  numWaiting?: string
  numStopped?: string
  numStoppedTotal?: string
}

type Aria2Version = {
  version: string
  enabledFeatures?: string[]
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

const RPC_HOST = "127.0.0.1"
const RPC_PORT = 16800
const RPC_TIMEOUT_MS = 5_000
const DEFAULT_STATUS_KEYS = [
  "gid",
  "status",
  "totalLength",
  "completedLength",
  "uploadLength",
  "bitfield",
  "downloadSpeed",
  "uploadSpeed",
  "infoHash",
  "numSeeders",
  "seeder",
  "pieceLength",
  "numPieces",
  "connections",
  "errorCode",
  "errorMessage",
  "followedBy",
  "following",
  "belongsTo",
  "dir",
  "files",
  "bittorrent",
  "verifiedLength",
  "verifyIntegrityPending",
]

class DownloadService {
  private process: ChildProcessWithoutNullStreams | null = null
  private secret = randomBytes(24).toString("hex")
  private startPromise: Promise<void> | null = null

  async startService() {
    await this.ensureStarted()
    return this.getServiceStatus()
  }

  async restartService() {
    this.stop()
    await this.ensureStarted()
    return this.getServiceStatus()
  }

  getServiceStatus(): DownloadServiceStatus {
    return {
      running: this.process !== null,
      rpcPort: this.process ? RPC_PORT : null,
    }
  }

  async getVersion() {
    const version = await this.call<Aria2Version>("aria2.getVersion")
    return normalizeVersion(version)
  }

  async addUri(input: AddUriInput) {
    if (input.uris.length === 0) {
      throw new Error("At least one URI is required")
    }

    return this.call<string>(
      "aria2.addUri",
      withOptionalPosition([input.uris, normalizeOptions(input.options)], input.position)
    )
  }

  async addTorrent(input: AddTorrentInput) {
    return this.call<string>(
      "aria2.addTorrent",
      withOptionalPosition(
        [input.torrentBase64, input.uris ?? [], normalizeOptions(input.options)],
        input.position
      )
    )
  }

  async addMetalink(input: AddMetalinkInput) {
    return this.call<string[]>(
      "aria2.addMetalink",
      withOptionalPosition(
        [input.metalinkBase64, normalizeOptions(input.options)],
        input.position
      )
    )
  }

  async remove(gid: string) {
    return this.call<string>("aria2.remove", [gid])
  }

  async forceRemove(gid: string) {
    return this.call<string>("aria2.forceRemove", [gid])
  }

  async pause(gid: string) {
    return this.call<string>("aria2.pause", [gid])
  }

  async forcePause(gid: string) {
    return this.call<string>("aria2.forcePause", [gid])
  }

  async pauseAll() {
    return this.call<"OK">("aria2.pauseAll")
  }

  async forcePauseAll() {
    return this.call<"OK">("aria2.forcePauseAll")
  }

  async resume(gid: string) {
    return this.call<string>("aria2.unpause", [gid])
  }

  async resumeAll() {
    return this.call<"OK">("aria2.unpauseAll")
  }

  async getStatus(gid: string, keys = DEFAULT_STATUS_KEYS) {
    const task = await this.call<Aria2Task>("aria2.tellStatus", [gid, keys])
    return normalizeTask(task)
  }

  async tellActive(keys = DEFAULT_STATUS_KEYS) {
    const tasks = await this.call<Aria2Task[]>("aria2.tellActive", [keys])
    return tasks.map(normalizeTask)
  }

  async tellWaiting(offset = 0, count = 1_000, keys = DEFAULT_STATUS_KEYS) {
    const tasks = await this.call<Aria2Task[]>("aria2.tellWaiting", [
      offset,
      count,
      keys,
    ])
    return tasks.map(normalizeTask)
  }

  async tellStopped(offset = 0, count = 1_000, keys = DEFAULT_STATUS_KEYS) {
    const tasks = await this.call<Aria2Task[]>("aria2.tellStopped", [
      offset,
      count,
      keys,
    ])
    return tasks.map(normalizeTask)
  }

  async list() {
    const [active, waiting, stopped] = await Promise.all([
      this.tellActive(),
      this.tellWaiting(),
      this.tellStopped(),
    ])

    return [...active, ...waiting, ...stopped]
  }

  async getUris(gid: string) {
    const uris = await this.call<Aria2Uri[]>("aria2.getUris", [gid])
    return uris.map(normalizeUri)
  }

  async getFiles(gid: string) {
    const files = await this.call<Aria2File[]>("aria2.getFiles", [gid])
    return files.map(normalizeFile)
  }

  async getPeers(gid: string) {
    const peers = await this.call<Aria2Peer[]>("aria2.getPeers", [gid])
    return peers.map(normalizePeer)
  }

  async getServers(gid: string) {
    const servers = await this.call<Aria2Server[]>("aria2.getServers", [gid])
    return servers.map(normalizeServer)
  }

  async changePosition(input: ChangePositionInput) {
    return this.call<number>("aria2.changePosition", [
      input.gid,
      input.position,
      input.how,
    ])
  }

  async changeUri(input: ChangeUriInput) {
    return this.call<[number, string[]]>(
      "aria2.changeUri",
      input.position === undefined
        ? [input.gid, input.fileIndex, input.delUris, input.addUris]
        : [input.gid, input.fileIndex, input.delUris, input.addUris, input.position]
    )
  }

  async getOption(gid: string) {
    return this.call<Record<string, string>>("aria2.getOption", [gid])
  }

  async changeOption(gid: string, options: Aria2Options) {
    return this.call<"OK">("aria2.changeOption", [gid, normalizeOptions(options)])
  }

  async getGlobalOption() {
    return this.call<Record<string, string>>("aria2.getGlobalOption")
  }

  async changeGlobalOption(options: Aria2Options) {
    return this.call<"OK">("aria2.changeGlobalOption", [normalizeOptions(options)])
  }

  async getGlobalStat() {
    const stat = await this.call<Aria2GlobalStat>("aria2.getGlobalStat")
    return normalizeGlobalStat(stat)
  }

  async purgeDownloadResult() {
    return this.call<"OK">("aria2.purgeDownloadResult")
  }

  async removeDownloadResult(gid: string) {
    return this.call<string>("aria2.removeDownloadResult", [gid])
  }

  async saveSession() {
    return this.call<"OK">("aria2.saveSession")
  }

  async rawRpc<T>({ method, params = [] }: RawRpcInput) {
    if (method === "system.multicall") {
      throw new Error("system.multicall is not exposed by rawRpc")
    }

    return this.call<T>(method, params)
  }

  stop() {
    if (!this.process) {
      return
    }

    this.process.kill()
    this.process = null
    this.startPromise = null
  }

  stopService() {
    this.stop()
    return this.getServiceStatus()
  }

  private async call<T>(method: string, params: unknown[] = []) {
    await this.ensureStarted()
    return this.callWithoutEnsuringStarted<T>(method, params, RPC_TIMEOUT_MS)
  }

  private async callWithoutEnsuringStarted<T>(
    method: string,
    params: unknown[] = [],
    timeoutMs: number
  ) {
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
      signal: AbortSignal.timeout(timeoutMs),
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

    this.process = spawn(getAria2Path(), [
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

    await waitForRpcReady(() =>
      this.callWithoutEnsuringStarted("aria2.getVersion", [], 1_000)
    )
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

function withOptionalPosition(params: unknown[], position: number | undefined) {
  if (position === undefined) {
    return params
  }

  return [...params, position]
}

function normalizeOptions(options: Aria2Options | undefined) {
  if (!options) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(options).flatMap(([key, value]) => {
      if (value === undefined || value === null) {
        return []
      }

      return [[key, String(value)]]
    })
  )
}

function normalizeTask(task: Aria2Task): DownloadTask {
  return {
    gid: task.gid,
    status: task.status,
    totalLength: toNumber(task.totalLength),
    completedLength: toNumber(task.completedLength),
    uploadLength: toNumber(task.uploadLength),
    bitfield: task.bitfield ?? "",
    downloadSpeed: toNumber(task.downloadSpeed),
    uploadSpeed: toNumber(task.uploadSpeed),
    infoHash: task.infoHash ?? "",
    numSeeders: toNumber(task.numSeeders),
    seeder: toBoolean(task.seeder),
    pieceLength: toNumber(task.pieceLength),
    numPieces: toNumber(task.numPieces),
    connections: toNumber(task.connections),
    errorCode: task.errorCode,
    errorMessage: task.errorMessage,
    followedBy: task.followedBy ?? [],
    following: task.following ?? null,
    belongsTo: task.belongsTo ?? null,
    dir: task.dir ?? "",
    files: task.files?.map(normalizeFile) ?? [],
    bittorrent: task.bittorrent
      ? normalizeBittorrent(task.bittorrent)
      : undefined,
    verifiedLength: toNumber(task.verifiedLength),
    verifyIntegrityPending: toBoolean(task.verifyIntegrityPending),
  }
}

function normalizeFile(file: Aria2File): DownloadFile {
  return {
    index: toNumber(file.index),
    path: file.path ?? "",
    length: toNumber(file.length),
    completedLength: toNumber(file.completedLength),
    selected: toBoolean(file.selected),
    uris: file.uris?.map(normalizeUri) ?? [],
  }
}

function normalizeUri(uri: Aria2Uri): DownloadUri {
  return {
    uri: uri.uri ?? "",
    status: uri.status ?? "waiting",
  }
}

function normalizeBittorrent(bittorrent: Aria2Bittorrent): BittorrentInfo {
  return {
    announceList: bittorrent.announceList ?? [],
    comment: bittorrent.comment ?? "",
    creationDate: toNumber(bittorrent.creationDate),
    mode: bittorrent.mode ?? "single",
    info: bittorrent.info?.name ? { name: bittorrent.info.name } : undefined,
  }
}

function normalizePeer(peer: Aria2Peer): DownloadPeer {
  return {
    peerId: peer.peerId ?? "",
    ip: peer.ip ?? "",
    port: toNumber(peer.port),
    bitfield: peer.bitfield ?? "",
    amChoking: toBoolean(peer.amChoking),
    peerChoking: toBoolean(peer.peerChoking),
    downloadSpeed: toNumber(peer.downloadSpeed),
    uploadSpeed: toNumber(peer.uploadSpeed),
    seeder: toBoolean(peer.seeder),
  }
}

function normalizeServer(server: Aria2Server): DownloadServer {
  return {
    index: toNumber(server.index),
    servers:
      server.servers?.map((item) => ({
        uri: item.uri ?? "",
        currentUri: item.currentUri ?? "",
        downloadSpeed: toNumber(item.downloadSpeed),
      })) ?? [],
  }
}

function normalizeGlobalStat(stat: Aria2GlobalStat): DownloadGlobalStat {
  return {
    downloadSpeed: toNumber(stat.downloadSpeed),
    uploadSpeed: toNumber(stat.uploadSpeed),
    numActive: toNumber(stat.numActive),
    numWaiting: toNumber(stat.numWaiting),
    numStopped: toNumber(stat.numStopped),
    numStoppedTotal: toNumber(stat.numStoppedTotal),
  }
}

function normalizeVersion(version: Aria2Version): DownloadVersion {
  return {
    version: version.version,
    enabledFeatures: version.enabledFeatures ?? [],
  }
}

function toNumber(value: string | undefined) {
  if (!value) {
    return 0
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function toBoolean(value: string | undefined) {
  return value === "true"
}

export function registerDownloadApi() {
  const service = new DownloadService()

  ipcMain.handle(DOWNLOAD_API_CHANNELS.startService, () => service.startService())
  ipcMain.handle(DOWNLOAD_API_CHANNELS.stopService, () => service.stopService())
  ipcMain.handle(DOWNLOAD_API_CHANNELS.restartService, () =>
    service.restartService()
  )
  ipcMain.handle(DOWNLOAD_API_CHANNELS.getServiceStatus, () =>
    service.getServiceStatus()
  )
  ipcMain.handle(DOWNLOAD_API_CHANNELS.getVersion, () => service.getVersion())
  ipcMain.handle(DOWNLOAD_API_CHANNELS.addUri, (_event, input: AddUriInput) =>
    service.addUri(input)
  )
  ipcMain.handle(
    DOWNLOAD_API_CHANNELS.addTorrent,
    (_event, input: AddTorrentInput) => service.addTorrent(input)
  )
  ipcMain.handle(
    DOWNLOAD_API_CHANNELS.addMetalink,
    (_event, input: AddMetalinkInput) => service.addMetalink(input)
  )
  ipcMain.handle(DOWNLOAD_API_CHANNELS.remove, (_event, gid: string) =>
    service.remove(gid)
  )
  ipcMain.handle(DOWNLOAD_API_CHANNELS.forceRemove, (_event, gid: string) =>
    service.forceRemove(gid)
  )
  ipcMain.handle(DOWNLOAD_API_CHANNELS.pause, (_event, gid: string) =>
    service.pause(gid)
  )
  ipcMain.handle(DOWNLOAD_API_CHANNELS.forcePause, (_event, gid: string) =>
    service.forcePause(gid)
  )
  ipcMain.handle(DOWNLOAD_API_CHANNELS.pauseAll, () => service.pauseAll())
  ipcMain.handle(DOWNLOAD_API_CHANNELS.forcePauseAll, () =>
    service.forcePauseAll()
  )
  ipcMain.handle(DOWNLOAD_API_CHANNELS.resume, (_event, gid: string) =>
    service.resume(gid)
  )
  ipcMain.handle(DOWNLOAD_API_CHANNELS.resumeAll, () => service.resumeAll())
  ipcMain.handle(
    DOWNLOAD_API_CHANNELS.getStatus,
    (_event, gid: string, keys?: string[]) => service.getStatus(gid, keys)
  )
  ipcMain.handle(DOWNLOAD_API_CHANNELS.tellActive, (_event, keys?: string[]) =>
    service.tellActive(keys)
  )
  ipcMain.handle(
    DOWNLOAD_API_CHANNELS.tellWaiting,
    (_event, offset?: number, count?: number, keys?: string[]) =>
      service.tellWaiting(offset, count, keys)
  )
  ipcMain.handle(
    DOWNLOAD_API_CHANNELS.tellStopped,
    (_event, offset?: number, count?: number, keys?: string[]) =>
      service.tellStopped(offset, count, keys)
  )
  ipcMain.handle(DOWNLOAD_API_CHANNELS.list, () => service.list())
  ipcMain.handle(DOWNLOAD_API_CHANNELS.getUris, (_event, gid: string) =>
    service.getUris(gid)
  )
  ipcMain.handle(DOWNLOAD_API_CHANNELS.getFiles, (_event, gid: string) =>
    service.getFiles(gid)
  )
  ipcMain.handle(DOWNLOAD_API_CHANNELS.getPeers, (_event, gid: string) =>
    service.getPeers(gid)
  )
  ipcMain.handle(DOWNLOAD_API_CHANNELS.getServers, (_event, gid: string) =>
    service.getServers(gid)
  )
  ipcMain.handle(
    DOWNLOAD_API_CHANNELS.changePosition,
    (_event, input: ChangePositionInput) => service.changePosition(input)
  )
  ipcMain.handle(
    DOWNLOAD_API_CHANNELS.changeUri,
    (_event, input: ChangeUriInput) => service.changeUri(input)
  )
  ipcMain.handle(DOWNLOAD_API_CHANNELS.getOption, (_event, gid: string) =>
    service.getOption(gid)
  )
  ipcMain.handle(
    DOWNLOAD_API_CHANNELS.changeOption,
    (_event, gid: string, options: Aria2Options) =>
      service.changeOption(gid, options)
  )
  ipcMain.handle(DOWNLOAD_API_CHANNELS.getGlobalOption, () =>
    service.getGlobalOption()
  )
  ipcMain.handle(
    DOWNLOAD_API_CHANNELS.changeGlobalOption,
    (_event, options: Aria2Options) => service.changeGlobalOption(options)
  )
  ipcMain.handle(DOWNLOAD_API_CHANNELS.getGlobalStat, () =>
    service.getGlobalStat()
  )
  ipcMain.handle(DOWNLOAD_API_CHANNELS.purgeDownloadResult, () =>
    service.purgeDownloadResult()
  )
  ipcMain.handle(
    DOWNLOAD_API_CHANNELS.removeDownloadResult,
    (_event, gid: string) => service.removeDownloadResult(gid)
  )
  ipcMain.handle(DOWNLOAD_API_CHANNELS.saveSession, () => service.saveSession())
  ipcMain.handle(DOWNLOAD_API_CHANNELS.rawRpc, (_event, input: RawRpcInput) =>
    service.rawRpc(input)
  )

  app.on("before-quit", () => {
    service.stop()
  })
}
