import type { Aria2File } from "./aria2"

export type TaskStatus =
  "active" | "waiting" | "paused" | "complete" | "error" | "removed"

export type TaskSource = {
  kind: "uri" | "torrent" | "metalink"
  value: string
}

export type TaskFile = Pick<
  Aria2File,
  "index" | "path" | "length" | "completedLength" | "selected"
>

export type TaskRecord = {
  gid: string
  source?: TaskSource
  status: TaskStatus
  fileName?: string
  torrentName?: string
  dir: string
  files: TaskFile[]
  totalLength: string
  completedLength: string
  infoHash?: string
  errorCode?: string
  errorMessage?: string
  createdAt: number
  updatedAt: number
  completedAt?: number
  removedAt?: number
}

export type RegisterTaskPayload = {
  gid: string
  source?: TaskSource
}
