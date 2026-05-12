import { contextBridge, ipcRenderer } from "electron"

import {
  DOWNLOAD_API_CHANNELS,
  type AddDownloadInput,
  type DownloadApi,
} from "../shared/download-api"

const downloads: DownloadApi = {
  addUri: (input: AddDownloadInput) =>
    ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.addUri, input),
  pause: (gid: string) => ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.pause, gid),
  resume: (gid: string) => ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.resume, gid),
  remove: (gid: string) => ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.remove, gid),
  list: () => ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.list),
  getStatus: (gid: string) =>
    ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.getStatus, gid),
  getServiceStatus: () =>
    ipcRenderer.invoke(DOWNLOAD_API_CHANNELS.getServiceStatus),
}

contextBridge.exposeInMainWorld("grabbit", {
  downloads,
})
