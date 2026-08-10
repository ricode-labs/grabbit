import type { Aria2Status } from "../../shared/aria2"

export type NoticeState = {
  message: string
  variant?: "info" | "success" | "error"
  title?: string
  onConfirm?: () => void
}

export type PageCategory = "downloading" | "completed" | "all" | "deleted"

export type ViewType = "list" | "detail" | "settings"

export type CategoryUpdates = Record<PageCategory, number>

export type UpdateCheckResult = {
  latestVersion: string
  available: boolean
}

export type UpdateViewState = UpdateCheckResult & {
  currentVersion: string
}

export type DownloadsData = {
  active: Aria2Status[]
  waiting: Aria2Status[]
  stopped: Aria2Status[]
}

export type Aria2ConnectionState = {
  connected: boolean
  message: string
}

export type Aria2ConnectionMessages = {
  connected: string
  failed: string
}
