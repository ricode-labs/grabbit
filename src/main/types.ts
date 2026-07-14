export type JsonRpcSuccess<T> = {
  id: string
  jsonrpc: "2.0"
  result: T
}

export type JsonRpcFailure = {
  id: string
  jsonrpc: "2.0"
  error: {
    code: number
    message: string
  }
}

export type Aria2Task = {
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

export type AddTaskPayload = {
  uris: string[]
  options?: Record<string, string | number | boolean | undefined>
}

export type AddTorrentPayload = {
  torrentPath: string
  options?: Record<string, string | number | boolean | undefined>
}

export type RestartTaskPayload = {
  task: Aria2Task
  options?: Record<string, string | number | boolean | undefined>
}

export type DeleteTaskFilesResult = {
  deleted: string[]
  skipped: Array<{ path: string; reason: string }>
  failed: Array<{ path: string; error: string }>
}

export type ParsedTorrentFile = {
  path?: string
  name?: string
  length?: number
}

export type ParsedTorrent = {
  name?: string
  files?: ParsedTorrentFile[]
  length?: number
}

export type WindowState = {
  width: number
  height: number
  x?: number
  y?: number
  maximized?: boolean
}
