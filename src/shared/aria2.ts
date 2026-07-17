export type Options = {
  f: string
}

export type Keys = {}

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
