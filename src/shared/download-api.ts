export const DOWNLOAD_API_CHANNELS = {
  addUri: "download:add-uri",
  pause: "download:pause",
  resume: "download:resume",
  remove: "download:remove",
  list: "download:list",
  getStatus: "download:get-status",
  getServiceStatus: "download:get-service-status",
} as const

export type DownloadStatus =
  | "active"
  | "waiting"
  | "paused"
  | "error"
  | "complete"
  | "removed"

export type AddDownloadInput = {
  uris: string[]
  dir?: string
  out?: string
}

export type DownloadTask = {
  gid: string
  status: DownloadStatus
  totalLength: number
  completedLength: number
  downloadSpeed: number
  uploadSpeed: number
  connections: number
  dir: string
  files: DownloadFile[]
  errorCode?: string
  errorMessage?: string
}

export type DownloadFile = {
  index: number
  path: string
  length: number
  completedLength: number
  selected: boolean
  uris: string[]
}

export type DownloadServiceStatus = {
  running: boolean
  rpcPort: number | null
}

export type DownloadApi = {
  addUri: (input: AddDownloadInput) => Promise<string>
  pause: (gid: string) => Promise<string>
  resume: (gid: string) => Promise<string>
  remove: (gid: string) => Promise<string>
  list: () => Promise<DownloadTask[]>
  getStatus: (gid: string) => Promise<DownloadTask>
  getServiceStatus: () => Promise<DownloadServiceStatus>
}
