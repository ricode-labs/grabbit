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
  HttpInfo,
  Ok,
  Options,
  TellRangePayload,
} from "../../shared/aria2"
import type { Preferences } from "../../shared/preferences"
import type { UpdateCheckResult } from "./app"

interface Aria2API {
  addUri: (payload: AddUriPayload) => Promise<string>
  addTorrent: (payload: AddTorrentPayload) => Promise<string>
  addMetalink: (payload: AddMetalinkPayload) => Promise<string[]>
  remove: (payload: GidPayload) => Promise<string>
  forceRemove: (payload: GidPayload) => Promise<string>
  removeDownloadResult: (payload: GidPayload) => Promise<Ok>
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
  tellActive: (keys?: string[]) => Promise<Aria2Status[]>
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
  getVersion: () => Promise<Aria2Version>
  getSessionInfo: () => Promise<Aria2SessionInfo>
  shutdown: () => Promise<Ok>
  forceShutdown: () => Promise<Ok>
  saveSession: () => Promise<Ok>
}

interface GrabbitAPI {
  platform: NodeJS.Platform
  selectFolder: () => Promise<string | null>
  selectTorrentFile: () => Promise<string | null>
  getClipboardText: () => Promise<string>
  getHttpInfo: (url: string) => Promise<HttpInfo>
  getDiskSpace: (dir: string) => Promise<number>
  showNotification: (message: string) => Promise<void>
  deleteFile: (filePath: string) => Promise<void>
  openFile: (filePath: string) => Promise<void>
  showItem: (filePath: string) => Promise<void>
  openFolder: (folderPath: string) => Promise<void>
  minimizeWindow: () => Promise<void>
  maximizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>
  getPreferences: () => Promise<Preferences>
  getVersion: () => Promise<string>
  checkUpdates: () => Promise<UpdateCheckResult>
  openExternal: (url: string) => Promise<void>
  savePreferences: (payload: Preferences) => Promise<Preferences>
}

declare global {
  interface Window {
    aria2: Aria2API
    grabbit: GrabbitAPI
  }
}

export {}
