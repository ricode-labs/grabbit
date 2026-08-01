import { contextBridge, ipcRenderer } from "electron"
import type {
  AddMetalinkPayload,
  AddTorrentPayload,
  AddUriPayload,
  ChangeOptionPayload,
  ChangeUriPayload,
  GidPayload,
  GrabbitSettings,
  Language,
  Options,
  Preferences,
  TellRangePayload,
  Theme,
} from "../shared/types"

type UISettingsPayload = Partial<{
  theme: Theme
  language: Language
}>
// import type {
//   EnginePathInfo,
//   ExternalTaskIntent,
//   GrabbitPreferences,
//   ParsedTorrentInfo,
//   TaskSchedulerRule,
// } from "../shared/grabbit"

// export type TaskStatus =
//   | "active"
//   | "waiting"
//   | "paused"
//   | "complete"
//   | "error"
//   | "removed"

// export type Aria2File = {
//   index?: string
//   path: string
//   length: string
//   completedLength: string
//   selected: string
//   uris?: Array<{ uri: string; status: string }>
// }

// export type Aria2Peer = {
//   peerId?: string
//   ip?: string
//   port?: string
//   bitfield?: string
//   amChoking?: string
//   peerChoking?: string
//   downloadSpeed?: string
//   uploadSpeed?: string
//   seeder?: string
// }

// export type Aria2Server = {
//   index: string
//   servers: Array<{ uri: string; currentUri: string; downloadSpeed: string }>
// }

// export type Aria2Task = {
//   gid: string
//   status: TaskStatus
//   totalLength: string
//   completedLength: string
//   downloadSpeed: string
//   uploadSpeed: string
//   connections: string
//   dir: string
//   files?: Aria2File[]
//   bittorrent?: {
//     announceList?: string[][]
//     comment?: string
//     creationDate?: string
//     mode?: string
//     info?: { name?: string }
//   }
//   verifiedLength?: string
//   verifyIntegrityPending?: string
//   numSeeders?: string
//   seeder?: string
//   errorCode?: string
//   errorMessage?: string
// }

// export type TaskListStatus = "active" | "waiting" | "stopped"

// export type AddTaskPayload = {
//   uris: string[]
//   options?: Record<string, string | number | boolean | undefined>
// }

// export type AddTorrentPayload = {
//   torrentPath: string
//   options?: Record<string, string | number | boolean | undefined>
// }

// export type DeleteTaskFilesResult = {
//   deleted: string[]
//   skipped: Array<{ path: string; reason: string }>
//   failed: Array<{ path: string; error: string }>
// }

// export const grabbitApi = {
//   onExternalTaskIntents: (
//     callback: (intents: ExternalTaskIntent[]) => void
//   ) => {
//     const listener = (
//       _event: Electron.IpcRendererEvent,
//       intents: ExternalTaskIntent[]
//     ) => callback(intents)
//     ipcRenderer.on("external:task-intents", listener)
//     return () => {
//       ipcRenderer.removeListener("external:task-intents", listener)
//     }
//   },
//   listTasks: (status: TaskListStatus) =>
//     ipcRenderer.invoke("tasks:list", status) as Promise<Aria2Task[]>,
//   getTaskPeers: (gid: string) =>
//     ipcRenderer.invoke("tasks:get-peers", gid) as Promise<Aria2Peer[]>,
//   getTaskServers: (gid: string) =>
//     ipcRenderer.invoke("tasks:get-servers", gid) as Promise<Aria2Server[]>,
//   addUri: (payload: AddTaskPayload) =>
//     ipcRenderer.invoke("tasks:add-uri", payload) as Promise<string[]>,
//   addTorrent: (payload: AddTorrentPayload) =>
//     ipcRenderer.invoke("tasks:add-torrent", payload) as Promise<string>,
//   restartTask: (
//     task: Aria2Task,
//     options?: Record<string, string | number | boolean | undefined>
//   ) =>
//     ipcRenderer.invoke("tasks:restart", { task, options }) as Promise<string[]>,
//   pauseTask: (gid: string) =>
//     ipcRenderer.invoke("tasks:pause", gid) as Promise<unknown>,
//   resumeTask: (gid: string) =>
//     ipcRenderer.invoke("tasks:resume", gid) as Promise<unknown>,
//   removeTask: (task: Aria2Task, deleteFiles = false) =>
//     ipcRenderer.invoke(
//       "tasks:remove",
//       task,
//       deleteFiles
//     ) as Promise<DeleteTaskFilesResult | null>,
//   removeTaskResult: (task: Aria2Task, deleteFiles = false) =>
//     ipcRenderer.invoke(
//       "tasks:remove-result",
//       task,
//       deleteFiles
//     ) as Promise<DeleteTaskFilesResult | null>,
//   deleteTaskFiles: (task: Aria2Task) =>
//     ipcRenderer.invoke(
//       "tasks:delete-files",
//       task
//     ) as Promise<DeleteTaskFilesResult>,
//   pauseAll: () => ipcRenderer.invoke("tasks:pause-all") as Promise<unknown>,
//   resumeAll: () => ipcRenderer.invoke("tasks:resume-all") as Promise<unknown>,
//   purgeResults: () =>
//     ipcRenderer.invoke("tasks:purge-results") as Promise<unknown>,
//   selectDirectory: () =>
//     ipcRenderer.invoke("app:select-directory") as Promise<string | null>,
//   selectTorrent: () =>
//     ipcRenderer.invoke("app:select-torrent") as Promise<string | null>,
//   parseTorrent: (torrentPath: string) =>
//     ipcRenderer.invoke(
//       "torrent:parse",
//       torrentPath
//     ) as Promise<ParsedTorrentInfo>,
//   openPath: (targetPath: string) =>
//     ipcRenderer.invoke("app:open-path", targetPath) as Promise<string>,
//   getEnginePaths: () =>
//     ipcRenderer.invoke("app:get-engine-paths") as Promise<EnginePathInfo[]>,
//   getPreferences: () =>
//     ipcRenderer.invoke("app:get-preferences") as Promise<GrabbitPreferences>,
//   setPreferences: (preferences: GrabbitPreferences) =>
//     ipcRenderer.invoke(
//       "app:set-preferences",
//       preferences
//     ) as Promise<GrabbitPreferences>,
//   getScheduler: () =>
//     ipcRenderer.invoke("app:get-scheduler") as Promise<TaskSchedulerRule>,
//   setScheduler: (rule: TaskSchedulerRule) =>
//     ipcRenderer.invoke("app:set-scheduler", rule) as Promise<TaskSchedulerRule>,
//   getDefaultDir: () =>
//     ipcRenderer.invoke("app:get-default-dir") as Promise<string>,
// }

contextBridge.exposeInMainWorld("grabbit", {
  saveSettings: (payload: GrabbitSettings) =>
    ipcRenderer.invoke("grabbit.saveSettings", payload),

  selectFolder: () => ipcRenderer.invoke("grabbit.selectFolder"),

  selectTorrentFile: () => ipcRenderer.invoke("grabbit.selectTorrentFile"),

  getClipboardText: () => ipcRenderer.invoke("grabbit.getClipboardText"),

  getTorrentInfo: (torrentPath: string) =>
    ipcRenderer.invoke("grabbit.getTorrentInfo", torrentPath),

  deleteDownloadFile: (filePath: string) =>
    ipcRenderer.invoke("grabbit.deleteDownloadFile", filePath),

  minimizeWindow: () => ipcRenderer.invoke("grabbit.minimizeWindow"),
  
  maximizeWindow: () => ipcRenderer.invoke("grabbit.maximizeWindow"),
  
  closeWindow: () => ipcRenderer.invoke("grabbit.closeWindow"),
  
  getPreferences: () =>
    ipcRenderer.invoke("grabbit.getPreferences") as Promise<Preferences>,
})

contextBridge.exposeInMainWorld("electronAPI", {
  
  getDownloadMetadata: (url: string) =>
    ipcRenderer.invoke("electronAPI.getDownloadMetadata", url),
  getDiskSpace: (dir: string) =>
    ipcRenderer.invoke("electronAPI.getDiskSpace", dir),
  
  
  updateUISettings: (payload: UISettingsPayload) =>
    ipcRenderer.invoke("electronAPI.updateUISettings", payload),
  
})

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
