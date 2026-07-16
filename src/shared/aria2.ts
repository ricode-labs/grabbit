export type Options = {}

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