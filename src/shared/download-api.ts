export const DOWNLOAD_API_CHANNELS = {
  startService: "download:start-service",
  stopService: "download:stop-service",
  restartService: "download:restart-service",
  getServiceStatus: "download:get-service-status",
  getVersion: "download:get-version",
  addUri: "download:add-uri",
  addTorrent: "download:add-torrent",
  addMetalink: "download:add-metalink",
  remove: "download:remove",
  forceRemove: "download:force-remove",
  pause: "download:pause",
  forcePause: "download:force-pause",
  pauseAll: "download:pause-all",
  forcePauseAll: "download:force-pause-all",
  resume: "download:resume",
  resumeAll: "download:resume-all",
  getStatus: "download:get-status",
  tellActive: "download:tell-active",
  tellWaiting: "download:tell-waiting",
  tellStopped: "download:tell-stopped",
  list: "download:list",
  getUris: "download:get-uris",
  getFiles: "download:get-files",
  getPeers: "download:get-peers",
  getServers: "download:get-servers",
  changePosition: "download:change-position",
  changeUri: "download:change-uri",
  getOption: "download:get-option",
  changeOption: "download:change-option",
  getGlobalOption: "download:get-global-option",
  changeGlobalOption: "download:change-global-option",
  getGlobalStat: "download:get-global-stat",
  purgeDownloadResult: "download:purge-download-result",
  removeDownloadResult: "download:remove-download-result",
  saveSession: "download:save-session",
  rawRpc: "download:raw-rpc",
} as const

export type DownloadStatus =
  | "active"
  | "waiting"
  | "paused"
  | "error"
  | "complete"
  | "removed"

export type Aria2OptionValue = string | number | boolean | null | undefined
export type Aria2Options = Record<string, Aria2OptionValue>

export type AddUriInput = {
  uris: string[]
  options?: Aria2Options
  position?: number
}

export type AddTorrentInput = {
  torrentBase64: string
  uris?: string[]
  options?: Aria2Options
  position?: number
}

export type AddMetalinkInput = {
  metalinkBase64: string
  options?: Aria2Options
  position?: number
}

export type ChangePositionHow = "POS_SET" | "POS_CUR" | "POS_END"

export type ChangePositionInput = {
  gid: string
  position: number
  how: ChangePositionHow
}

export type ChangeUriInput = {
  gid: string
  fileIndex: number
  delUris: string[]
  addUris: string[]
  position?: number
}

export type DownloadTask = {
  gid: string
  status: DownloadStatus
  totalLength: number
  completedLength: number
  uploadLength: number
  bitfield: string
  downloadSpeed: number
  uploadSpeed: number
  infoHash: string
  numSeeders: number
  seeder: boolean
  pieceLength: number
  numPieces: number
  connections: number
  errorCode?: string
  errorMessage?: string
  followedBy: string[]
  following: string | null
  belongsTo: string | null
  dir: string
  files: DownloadFile[]
  bittorrent?: BittorrentInfo
  verifiedLength: number
  verifyIntegrityPending: boolean
}

export type DownloadFile = {
  index: number
  path: string
  length: number
  completedLength: number
  selected: boolean
  uris: DownloadUri[]
}

export type DownloadUri = {
  uri: string
  status: "used" | "waiting"
}

export type BittorrentInfo = {
  announceList: string[][]
  comment: string
  creationDate: number
  mode: "single" | "multi"
  info?: {
    name: string
  }
}

export type DownloadPeer = {
  peerId: string
  ip: string
  port: number
  bitfield: string
  amChoking: boolean
  peerChoking: boolean
  downloadSpeed: number
  uploadSpeed: number
  seeder: boolean
}

export type DownloadServer = {
  index: number
  servers: Array<{
    uri: string
    currentUri: string
    downloadSpeed: number
  }>
}

export type DownloadGlobalStat = {
  downloadSpeed: number
  uploadSpeed: number
  numActive: number
  numWaiting: number
  numStopped: number
  numStoppedTotal: number
}

export type DownloadVersion = {
  version: string
  enabledFeatures: string[]
}

export type DownloadServiceStatus = {
  running: boolean
  rpcPort: number | null
}

export type RawRpcInput = {
  method: `aria2.${string}` | `system.${string}`
  params?: unknown[]
}

export type DownloadApi = {
  startService: () => Promise<DownloadServiceStatus>
  stopService: () => Promise<DownloadServiceStatus>
  restartService: () => Promise<DownloadServiceStatus>
  getServiceStatus: () => Promise<DownloadServiceStatus>
  getVersion: () => Promise<DownloadVersion>
  addUri: (input: AddUriInput) => Promise<string>
  addTorrent: (input: AddTorrentInput) => Promise<string>
  addMetalink: (input: AddMetalinkInput) => Promise<string[]>
  remove: (gid: string) => Promise<string>
  forceRemove: (gid: string) => Promise<string>
  pause: (gid: string) => Promise<string>
  forcePause: (gid: string) => Promise<string>
  pauseAll: () => Promise<"OK">
  forcePauseAll: () => Promise<"OK">
  resume: (gid: string) => Promise<string>
  resumeAll: () => Promise<"OK">
  getStatus: (gid: string, keys?: string[]) => Promise<DownloadTask>
  tellActive: (keys?: string[]) => Promise<DownloadTask[]>
  tellWaiting: (offset?: number, count?: number, keys?: string[]) => Promise<DownloadTask[]>
  tellStopped: (offset?: number, count?: number, keys?: string[]) => Promise<DownloadTask[]>
  list: () => Promise<DownloadTask[]>
  getUris: (gid: string) => Promise<DownloadUri[]>
  getFiles: (gid: string) => Promise<DownloadFile[]>
  getPeers: (gid: string) => Promise<DownloadPeer[]>
  getServers: (gid: string) => Promise<DownloadServer[]>
  changePosition: (input: ChangePositionInput) => Promise<number>
  changeUri: (input: ChangeUriInput) => Promise<[number, string[]]>
  getOption: (gid: string) => Promise<Record<string, string>>
  changeOption: (gid: string, options: Aria2Options) => Promise<"OK">
  getGlobalOption: () => Promise<Record<string, string>>
  changeGlobalOption: (options: Aria2Options) => Promise<"OK">
  getGlobalStat: () => Promise<DownloadGlobalStat>
  purgeDownloadResult: () => Promise<"OK">
  removeDownloadResult: (gid: string) => Promise<string>
  saveSession: () => Promise<"OK">
  rawRpc: <T = unknown>(input: RawRpcInput) => Promise<T>
}
