import type {
  AddMetalinkPayload,
  AddTorrentPayload,
  AddUriPayload,
  Aria2File,
  Aria2GlobalStat,
  Aria2Peer,
  Aria2Server,
  Aria2SessionInfo,
  Aria2Status,
  Aria2Uri,
  Aria2Version,
  ChangeOptionPayload,
  ChangePositionPayload,
  ChangeUriPayload,
  GidPayload,
  Ok,
  Options,
  TellRangePayload,
} from "../shared/aria2"

declare global {
  interface Window {
    grabbit: Record<string, never>
    aria2: {
      addUri: (payload: AddUriPayload) => Promise<string>
      addTorrent: (payload: AddTorrentPayload) => Promise<string>
      addMetalink: (payload: AddMetalinkPayload) => Promise<string[]>
      remove: (payload: GidPayload) => Promise<string>
      forceRemove: (payload: GidPayload) => Promise<string>
      pause: (payload: GidPayload) => Promise<string>
      pauseAll: () => Promise<Ok>
      forcePause: (payload: GidPayload) => Promise<string>
      forcePauseAll: () => Promise<Ok>
      unpause: (payload: GidPayload) => Promise<string>
      unpauseAll: () => Promise<Ok>
      tellStatus: (payload: GidPayload) => Promise<Aria2Status>
      getUris: (payload: GidPayload) => Promise<Aria2Uri[]>
      getFiles: (payload: GidPayload) => Promise<Aria2File[]>
      getPeers: (payload: GidPayload) => Promise<Aria2Peer[]>
      getServers: (payload: GidPayload) => Promise<Aria2Server[]>
      tellActive: () => Promise<Aria2Status[]>
      tellWaiting: (payload: TellRangePayload) => Promise<Aria2Status[]>
      tellStopped: (payload: TellRangePayload) => Promise<Aria2Status[]>
      changePosition: (payload: ChangePositionPayload) => Promise<number>
      changeUri: (payload: ChangeUriPayload) => Promise<[number, number]>
      getOption: (payload: GidPayload) => Promise<Options>
      changeOption: (payload: ChangeOptionPayload) => Promise<Ok>
      getGlobalOption: () => Promise<Options>
      changeGlobalOption: (payload: Options) => Promise<Ok>
      getGlobalStat: () => Promise<Aria2GlobalStat>
      purgeDownloadResult: () => Promise<Ok>
      removeDownloadResult: (payload: GidPayload) => Promise<Ok>
      getVersion: () => Promise<Aria2Version>
      getSessionInfo: () => Promise<Aria2SessionInfo>
      shutdown: () => Promise<Ok>
      forceShutdown: () => Promise<Ok>
      saveSession: () => Promise<Ok>
    }
  }
}
