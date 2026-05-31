import { contextBridge, ipcRenderer } from "electron"
import type { GrabbitPreferences, TaskSchedulerRule } from "../shared/grabbit"

export type TaskStatus = "active" | "waiting" | "paused" | "complete" | "error" | "removed"

export type Aria2File = {
  path: string
  length: string
  completedLength: string
  selected: string
  uris?: Array<{ uri: string; status: string }>
}

export type Aria2Task = {
  gid: string
  status: TaskStatus
  totalLength: string
  completedLength: string
  downloadSpeed: string
  uploadSpeed: string
  connections: string
  dir: string
  files?: Aria2File[]
  bittorrent?: {
    info?: { name?: string }
  }
}

export type TaskListStatus = "active" | "waiting" | "stopped"

export type AddTaskPayload = {
  uris: string[]
  options?: Record<string, string | number | boolean | undefined>
}

export type AddTorrentPayload = {
  torrentPath: string
  options?: Record<string, string | number | boolean | undefined>
}

export type DeleteTaskFilesResult = {
  deleted: string[]
  skipped: Array<{ path: string; reason: string }>
  failed: Array<{ path: string; error: string }>
}

export const grabbitApi = {
  listTasks: (status: TaskListStatus) =>
    ipcRenderer.invoke("tasks:list", status) as Promise<Aria2Task[]>,
  addUri: (payload: AddTaskPayload) =>
    ipcRenderer.invoke("tasks:add-uri", payload) as Promise<string[]>,
  addTorrent: (payload: AddTorrentPayload) =>
    ipcRenderer.invoke("tasks:add-torrent", payload) as Promise<string>,
  restartTask: (task: Aria2Task, options?: Record<string, string | number | boolean | undefined>) =>
    ipcRenderer.invoke("tasks:restart", { task, options }) as Promise<string[]>,
  pauseTask: (gid: string) => ipcRenderer.invoke("tasks:pause", gid) as Promise<unknown>,
  resumeTask: (gid: string) => ipcRenderer.invoke("tasks:resume", gid) as Promise<unknown>,
  removeTask: (task: Aria2Task, deleteFiles = false) =>
    ipcRenderer.invoke("tasks:remove", task, deleteFiles) as Promise<DeleteTaskFilesResult | null>,
  removeTaskResult: (task: Aria2Task, deleteFiles = false) =>
    ipcRenderer.invoke("tasks:remove-result", task, deleteFiles) as Promise<DeleteTaskFilesResult | null>,
  deleteTaskFiles: (task: Aria2Task) =>
    ipcRenderer.invoke("tasks:delete-files", task) as Promise<DeleteTaskFilesResult>,
  pauseAll: () => ipcRenderer.invoke("tasks:pause-all") as Promise<unknown>,
  resumeAll: () => ipcRenderer.invoke("tasks:resume-all") as Promise<unknown>,
  purgeResults: () => ipcRenderer.invoke("tasks:purge-results") as Promise<unknown>,
  selectDirectory: () => ipcRenderer.invoke("app:select-directory") as Promise<string | null>,
  selectTorrent: () => ipcRenderer.invoke("app:select-torrent") as Promise<string | null>,
  openPath: (targetPath: string) =>
    ipcRenderer.invoke("app:open-path", targetPath) as Promise<string>,
  getPreferences: () =>
    ipcRenderer.invoke("app:get-preferences") as Promise<GrabbitPreferences>,
  setPreferences: (preferences: GrabbitPreferences) =>
    ipcRenderer.invoke("app:set-preferences", preferences) as Promise<GrabbitPreferences>,
  getScheduler: () => ipcRenderer.invoke("app:get-scheduler") as Promise<TaskSchedulerRule>,
  setScheduler: (rule: TaskSchedulerRule) =>
    ipcRenderer.invoke("app:set-scheduler", rule) as Promise<TaskSchedulerRule>,
  getDefaultDir: () => ipcRenderer.invoke("app:get-default-dir") as Promise<string>,
}

contextBridge.exposeInMainWorld("grabbit", grabbitApi)
