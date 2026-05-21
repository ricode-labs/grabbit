import { contextBridge, ipcRenderer } from "electron"

import {
  DOWNLOAD_API_CHANNELS,
  type AddMetalinkInput,
  type AddTorrentInput,
  type AddUriInput,
  type Aria2Options,
  type ChangePositionInput,
  type ChangeUriInput,
  type DownloadApi,
  type RawRpcInput,
} from "../shared/download-api"

const downloads: DownloadApi = {
  startService: () => ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.startService),
  stopService: () => ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.stopService),
  restartService: () => ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.restartService),
  getServiceStatus: () =>
    ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.getServiceStatus),
  getVersion: () => ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.getVersion),
  addUri: (input: AddUriInput) =>
    ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.addUri, input),
  addTorrent: (input: AddTorrentInput) =>
    ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.addTorrent, input),
  addMetalink: (input: AddMetalinkInput) =>
    ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.addMetalink, input),
  remove: (gid: string) => ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.remove, gid),
  forceRemove: (gid: string) =>
    ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.forceRemove, gid),
  pause: (gid: string) => ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.pause, gid),
  forcePause: (gid: string) =>
    ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.forcePause, gid),
  pauseAll: () => ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.pauseAll),
  forcePauseAll: () => ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.forcePauseAll),
  resume: (gid: string) => ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.resume, gid),
  resumeAll: () => ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.resumeAll),
  getStatus: (gid: string, keys?: string[]) =>
    ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.getStatus, gid, keys),
  tellActive: (keys?: string[]) =>
    ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.tellActive, keys),
  tellWaiting: (offset?: number, count?: number, keys?: string[]) =>
    ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.tellWaiting, offset, count, keys),
  tellStopped: (offset?: number, count?: number, keys?: string[]) =>
    ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.tellStopped, offset, count, keys),
  list: () => ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.list),
  getUris: (gid: string) => ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.getUris, gid),
  getFiles: (gid: string) => ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.getFiles, gid),
  getPeers: (gid: string) => ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.getPeers, gid),
  getServers: (gid: string) =>
    ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.getServers, gid),
  changePosition: (input: ChangePositionInput) =>
    ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.changePosition, input),
  changeUri: (input: ChangeUriInput) =>
    ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.changeUri, input),
  getOption: (gid: string) =>
    ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.getOption, gid),
  changeOption: (gid: string, options: Aria2Options) =>
    ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.changeOption, gid, options),
  getGlobalOption: () =>
    ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.getGlobalOption),
  changeGlobalOption: (options: Aria2Options) =>
    ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.changeGlobalOption, options),
  getGlobalStat: () => ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.getGlobalStat),
  purgeDownloadResult: () =>
    ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.purgeDownloadResult),
  removeDownloadResult: (gid: string) =>
    ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.removeDownloadResult, gid),
  saveSession: () => ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.saveSession),
  rawRpc: <T>(input: RawRpcInput) =>
    ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.rawRpc, input) as Promise<T>,
}

contextBridge.exposeInMainWorld("grabbit", {
  downloads,
})
