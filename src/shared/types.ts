export type Options = Record<string, string>

export type GrabbitSettings = Options

export type Keys = string[]

export type Ok = "OK"

export type AddUriPayload = {
  uris: string[]
  options?: Options
}

export type AddTorrentPayload = {
  torrentPath: string
  options?: Options
}

export type AddMetalinkPayload = {
  metalinkPath: string
  options?: Options
}

export type GidPayload = {
  gid: string
}

export type ChangePositionPayload = {
  gid: string
  pos: number
  how: "POS_SET" | "POS_CUR" | "POS_END"
}

export type TellRangePayload = {
  offset: number
  num: number
}

export type ChangeUriPayload = {
  gid: string
  fileIndex: number
  delUris: string[]
  addUris: string[]
}

export type ChangeOptionPayload = GidPayload & {
  options: Options
}

export type Aria2Uri = {
  uri: string
  status: string
}

export type Aria2File = {
  index: string
  path: string
  length: string
  completedLength: string
  selected: string
  uris: Aria2Uri[]
}

export type Aria2Peer = {
  peerId?: string
  ip: string
  port: string
  bitfield?: string
  amChoking: string
  peerChoking: string
  downloadSpeed: string
  uploadSpeed: string
  seeder?: string
}

export type Aria2Server = {
  index: string
  servers: Array<{
    uri: string
    currentUri: string
    downloadSpeed: string
  }>
}

export type Aria2Status = {
  gid: string
  status: string
  totalLength: string
  completedLength: string
  uploadLength: string
  bitfield?: string
  downloadSpeed: string
  uploadSpeed: string
  infoHash?: string
  numSeeders?: string
  seeder?: string
  pieceLength: string
  numPieces: string
  connections: string
  errorCode?: string
  errorMessage?: string
  followedBy?: string[]
  following?: string
  belongsTo?: string
  dir: string
  files: Aria2File[]
  bittorrent?: {
    announceList?: string[][]
    comment?: string
    creationDate?: string
    mode?: string
    info?: { name?: string }
  }
  verifiedLength?: string
  verifyIntegrityPending?: string
}

export type Aria2GlobalStat = {
  downloadSpeed: string
  uploadSpeed: string
  numActive: string
  numWaiting: string
  numStopped: string
  numStoppedTotal: string
}

export type Aria2Version = {
  version: string
  enabledFeatures: string[]
}

export type Aria2SessionInfo = {
  sessionId: string
}

export type Preferences = {
  maxOverallDownloadLimit: number
  maxOverallUploadLimit: number
}