export type Options = Record<string, string>

export type Keys = string[]

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

export type PositionPayload = {
  gid: string
  pos: number
  how: "POS_SET" | "POS_CUR" | "POS_END"
}

export type TellStatusPayload = GidPayload & {
  keys?: Keys
}

export type TellRangePayload = {
  offset: number
  num: number
  keys?: Keys
}

export type ChangeUriPayload = {
  gid: string
  fileIndex: number
  delUris: string[]
  addUris: string[]
  position?: number
}

export type ChangeOptionPayload = GidPayload & {
  options: Options
}
