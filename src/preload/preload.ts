import { contextBridge, ipcRenderer } from "electron"
import type {
  AddMetalinkPayload,
  AddTorrentPayload,
  AddUriPayload,
  ChangeOptionPayload,
  ChangeUriPayload,
  GidPayload,
  Options,
  Preferences,
  TellRangePayload,
} from "../shared/types"

contextBridge.exposeInMainWorld("grabbit", {
  selectFolder: () => ipcRenderer.invoke("grabbit.selectFolder"),

  selectTorrentFile: () => ipcRenderer.invoke("grabbit.selectTorrentFile"),

  getClipboardText: () => ipcRenderer.invoke("grabbit.getClipboardText"),

  getTorrentInfo: (torrentPath: string) =>
    ipcRenderer.invoke("grabbit.getTorrentInfo", torrentPath),

  getDownloadMetadata: (url: string) =>
    ipcRenderer.invoke("grabbit.getHttpInfo", url),

  deleteDownloadFile: (filePath: string) =>
    ipcRenderer.invoke("grabbit.deleteDownloadFile", filePath),

  minimizeWindow: () => ipcRenderer.invoke("grabbit.minimizeWindow"),

  maximizeWindow: () => ipcRenderer.invoke("grabbit.maximizeWindow"),

  closeWindow: () => ipcRenderer.invoke("grabbit.closeWindow"),

  getPreferences: () => ipcRenderer.invoke("grabbit.getPreferences"),

  savePreferences: (payload: Preferences) =>
    ipcRenderer.invoke("grabbit.savePreferences", payload),
})

// contextBridge.exposeInMainWorld("electronAPI", {
//   getDiskSpace: (dir: string) =>
//     ipcRenderer.invoke("electronAPI.getDiskSpace", dir),
// })

contextBridge.exposeInMainWorld("aria2", {
  // This method adds a new download
  addUri: (payload: AddUriPayload) =>
    ipcRenderer.invoke("aria2.addUri", payload),

  // This method adds a BitTorrent download by uploading a ".torrent" file
  addTorrent: (payload: AddTorrentPayload) =>
    ipcRenderer.invoke("aria2.addTorrent", payload),

  // This method adds a Metalink download by uploading a ".metalink" file
  addMetalink: (payload: AddMetalinkPayload) =>
    ipcRenderer.invoke("aria2.addMetalink", payload),

  // This method removes the download denoted by gid (string)
  remove: (payload: GidPayload) => ipcRenderer.invoke("aria2.remove", payload),

  // This method removes the download denoted by gid
  forceRemove: (payload: GidPayload) =>
    ipcRenderer.invoke("aria2.forceRemove", payload),

  // This method pauses the download denoted by gid (string)
  pause: (payload: GidPayload) => ipcRenderer.invoke("aria2.pause", payload),

  // This method is equal to calling aria2.pause() for every active/waiting download
  pauseAll: () => ipcRenderer.invoke("aria2.pauseAll"),

  // This method pauses the download denoted by gid
  forcePause: (payload: GidPayload) =>
    ipcRenderer.invoke("aria2.forcePause", payload),

  // This method is equal to calling aria2.forcePause() for every active/waiting download
  forcePauseAll: () => ipcRenderer.invoke("aria2.forcePauseAll"),

  // This method changes the status of the download denoted by gid (string) from paused to waiting, making the download eligible to be restarted
  unpause: (payload: GidPayload) =>
    ipcRenderer.invoke("aria2.unpause", payload),

  // This method is equal to calling aria2.unpause() for every paused download
  unpauseAll: () => ipcRenderer.invoke("aria2.unpauseAll"),

  // This method returns the progress of the download denoted by gid (string)
  tellStatus: (payload: GidPayload) =>
    ipcRenderer.invoke("aria2.tellStatus", payload),

  // This method returns the URIs used in the download denoted by gid (string)
  getUris: (payload: GidPayload) =>
    ipcRenderer.invoke("aria2.getUris", payload),

  // This method returns the file list of the download denoted by gid (string)
  getFiles: (payload: GidPayload) =>
    ipcRenderer.invoke("aria2.getFiles", payload),

  // This method returns a list peers of the download denoted by gid (string)
  getPeers: (payload: GidPayload) =>
    ipcRenderer.invoke("aria2.getPeers", payload),

  // This method returns currently connected HTTP(S)/FTP/SFTP servers of the download denoted by gid (string)
  getServers: (payload: GidPayload) =>
    ipcRenderer.invoke("aria2.getServers", payload),

  // This method returns a list of active downloads
  tellActive: (keys?: string[]) => ipcRenderer.invoke("aria2.tellActive", keys),

  // This method returns a list of waiting downloads, including paused ones
  tellWaiting: (payload: TellRangePayload) =>
    ipcRenderer.invoke("aria2.tellWaiting", payload),

  // This method returns a list of stopped downloads
  tellStopped: (payload: TellRangePayload) =>
    ipcRenderer.invoke("aria2.tellStopped", payload),

  // This method changes the position of the download denoted by gid in the queue
  changePosition: (payload: ChangeOptionPayload) =>
    ipcRenderer.invoke("aria2.changePosition", payload),

  // This method removes the URIs in delUris from and appends the URIs in addUris to download denoted by gid
  changeUri: (payload: ChangeUriPayload) =>
    ipcRenderer.invoke("aria2.changeUri", payload),

  // This method returns options of the download denoted by gid
  getOption: (payload: GidPayload) =>
    ipcRenderer.invoke("aria2.getOption", payload),

  // This method changes options of the download denoted by gid
  changeOption: (payload: ChangeOptionPayload) =>
    ipcRenderer.invoke("aria2.changeOption", payload),

  // This method returns the global options
  getGlobalOption: () => ipcRenderer.invoke("aria2.getGlobalOption"),

  // This method changes global options dynamically
  changeGlobalOption: (payload: Options) =>
    ipcRenderer.invoke("aria2.changeGlobalOption", payload),

  // This method returns global statistics such as the overall download and upload speeds
  getGlobalStat: () => ipcRenderer.invoke("aria2.getGlobalStat"),

  // This method purges completed/error/removed downloads to free memory
  purgeDownloadResult: () => ipcRenderer.invoke("aria2.purgeDownloadResult"),

  // This method removes a completed/error/removed download denoted by gid from memory
  removeDownloadResult: (payload: GidPayload) =>
    ipcRenderer.invoke("aria2.removeDownloadResult", payload),

  // This method returns the version of aria2 and the list of enabled features
  getVersion: () => ipcRenderer.invoke("aria2.getVersion"),

  // This method returns session information
  getSessionInfo: () => ipcRenderer.invoke("aria2.getSessionInfo"),

  // This method shuts down aria2
  shutdown: () => ipcRenderer.invoke("aria2.shutdown"),

  // This method shuts down aria2()
  forceShutdown: () => ipcRenderer.invoke("aria2.forceShutdown"),

  // This method saves the current session to a file specified by the --save-session option
  saveSession: () => ipcRenderer.invoke("aria2.saveSession"),
})
