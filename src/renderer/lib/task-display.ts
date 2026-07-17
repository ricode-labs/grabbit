import { calculateProgress } from "../../shared/grabbit"
import type { Aria2Status } from "../../shared/aria2"

export type Aria2Task = Aria2Status

export type TaskListStatus = "active" | "waiting" | "stopped"

export type TaskStatus =
  | "active"
  | "waiting"
  | "paused"
  | "complete"
  | "error"
  | "removed"

export type DeleteTaskFilesResult = {
  deleted: string[]
  skipped: Array<{ path: string; reason: string }>
  failed: Array<{ path: string; error: string }>
}

export const statusLabels: Record<TaskListStatus, string> = {
  active: "正在下载",
  waiting: "等待中",
  stopped: "已停止",
}

export const statusMeta: Record<
  TaskListStatus,
  { caption: string; gradient: string }
> = {
  active: {
    caption: "实时传输中的任务与连接状态",
    gradient: "from-violet-500/30 via-sky-500/12 to-transparent",
  },
  waiting: {
    caption: "排队等待 aria2 调度的任务",
    gradient: "from-amber-400/26 via-violet-500/10 to-transparent",
  },
  stopped: {
    caption: "已完成、错误或被移除的历史记录",
    gradient: "from-emerald-400/24 via-sky-500/10 to-transparent",
  },
}

export const statusVariant: Record<
  TaskStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  waiting: "secondary",
  paused: "outline",
  complete: "secondary",
  error: "destructive",
  removed: "outline",
}

export const statusText: Record<TaskStatus, string> = {
  active: "下载中",
  waiting: "等待中",
  paused: "已暂停",
  complete: "已完成",
  error: "错误",
  removed: "已移除",
}

export function getTaskUris(task: Aria2Task) {
  return Array.from(
    new Set(
      task.files
        ?.flatMap((file) => file.uris?.map((uri) => uri.uri) ?? [])
        .filter(Boolean) ?? []
    )
  )
}

export function getTaskName(task: Aria2Task) {
  const torrentName = task.bittorrent?.info?.name
  if (torrentName) {
    return torrentName
  }

  const firstPath = task.files?.[0]?.path
  if (!firstPath) {
    return task.gid
  }

  return firstPath.split(/[\\/]/).filter(Boolean).at(-1) ?? task.gid
}

export function toNumber(value: string | number | undefined) {
  const number = Number(value ?? 0)
  return Number.isFinite(number) ? number : 0
}

export function formatBytes(bytes: string | number | undefined) {
  const value = toNumber(bytes)
  if (value <= 0) {
    return "0 B"
  }

  const units = ["B", "KB", "MB", "GB", "TB"]
  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1
  )
  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

export function getProgress(task: Aria2Task) {
  return calculateProgress(task.completedLength, task.totalLength)
}

export function describeDeleteFilesResult(
  result: DeleteTaskFilesResult | null
) {
  if (!result) {
    return ""
  }

  const parts = []
  if (result.deleted.length > 0) {
    parts.push(`已移入回收站 ${result.deleted.length} 个文件`)
  }
  if (result.skipped.length > 0) {
    parts.push(`跳过 ${result.skipped.length} 项`)
  }
  if (result.failed.length > 0) {
    parts.push(`失败 ${result.failed.length} 项`)
  }

  return parts.length > 0 ? `，${parts.join("，")}` : "，没有可删除的本地文件"
}

export function mergeDeleteResults(
  results: Array<DeleteTaskFilesResult | null>
) {
  const merged: DeleteTaskFilesResult = {
    deleted: [],
    skipped: [],
    failed: [],
  }

  for (const result of results) {
    if (!result) {
      continue
    }
    merged.deleted.push(...result.deleted)
    merged.skipped.push(...result.skipped)
    merged.failed.push(...result.failed)
  }

  return merged.deleted.length > 0 ||
    merged.skipped.length > 0 ||
    merged.failed.length > 0
    ? merged
    : null
}
