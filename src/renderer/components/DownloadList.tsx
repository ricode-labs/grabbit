import React from "react"
import { DownloadItem } from "./DownloadItem"
import { useUI } from "../context/useUI"
import emptyUrl from "../assets/empty.webp"
import type { Aria2Status, Aria2File } from "../../shared/aria2"

export type CategoryType = "downloading" | "completed" | "all" | "deleted"

interface DownloadListProps {
  downloads: {
    active: DownloadTask[]
    waiting: DownloadTask[]
    stopped: DownloadTask[]
  }
  historyTasks: DownloadTask[]
  category: CategoryType
  selectedGid: string | null
  searchTerm?: string
  onPause: (gid: string) => void
  onResume: (gid: string) => void
  onRemove: (gid: string) => void
  onSelect: (gid: string) => void
}

type DownloadTask = Aria2Status & {
  fileName?: string
  files: Aria2File[]
}

export const DownloadList: React.FC<DownloadListProps> = ({
  downloads,
  historyTasks,
  category,
  selectedGid,
  searchTerm = "",
  onPause,
  onResume,
  onRemove,
  onSelect,
}) => {
  const { t } = useUI()

  const hasTaskFileInfo = (task: DownloadTask) =>
    Boolean(
      task.fileName?.trim() ||
      task.bittorrent?.info?.name?.trim() ||
      task.files?.some((file) => file.path?.trim())
    )

  // aria2 restores session tasks asynchronously; hide incomplete live entries.
  const liveTasks = [...downloads.active, ...downloads.waiting].filter(
    hasTaskFileInfo
  )
  const rawAllTasks = [...liveTasks, ...downloads.stopped]
  const terminalHistoryGids = new Set(
    historyTasks
      .filter((task) => ["complete", "error", "removed"].includes(task.status))
      .map((task) => task.gid)
  )
  const allTasks = rawAllTasks.filter(
    (task) => !terminalHistoryGids.has(task.gid)
  )

  // 根据分类过滤任务
  const filterTasksByCategory = () => {
    if (category === "downloading") {
      return allTasks.filter(
        (task) =>
          task.status === "active" ||
          task.status === "waiting" ||
          task.status === "paused"
      )
    } else if (category === "completed") {
      return historyTasks.filter((task) => task.status === "complete")
    } else if (category === "all") {
      const seen = new Set<string>()
      const terminalHistoryTasks = historyTasks.filter(
        (task) =>
          task.status === "complete" ||
          task.status === "error" ||
          task.status === "removed"
      )
      return [...terminalHistoryTasks, ...allTasks, ...historyTasks].filter(
        (task) => {
          if (!task.gid) return true
          if (seen.has(task.gid)) return false
          seen.add(task.gid)
          return true
        }
      )
    } else if (category === "deleted") {
      return historyTasks.filter(
        (task) => task.status === "error" || task.status === "removed"
      )
    }
    return []
  }

  const keyword = searchTerm.trim().toLowerCase()
  const filteredTasks = filterTasksByCategory().filter((task) => {
    if (!keyword) return true

    const fileName =
      task.bittorrent?.info?.name ||
      task.files?.[0]?.path?.split("/").pop() ||
      task.fileName ||
      ""
    const dir = task.dir || ""
    const status = task.status || ""

    return `${fileName} ${dir} ${status}`.toLowerCase().includes(keyword)
  })

  if (filteredTasks.length === 0) {
    const emptyMessages: Record<string, string> = {
      downloading: t("noDownloading"),
      completed: t("noCompleted"),
      all: t("noTasks"),
      deleted: t("noDeleted"),
    }

    return (
      <div className="flex h-full flex-col items-center justify-center rounded-[14px] border border-[#F6D7D3] bg-white/70">
        <img
          src={emptyUrl}
          alt=""
          className="mb-3 h-[96px] w-[96px] object-contain opacity-95"
        />
        <p className="text-[15px] font-medium text-[#6B5448]">
          {emptyMessages[category]}
        </p>
        {category === "downloading" && (
          <p className="mt-1 text-[12px] text-[#A89488]">{t("clickToStart")}</p>
        )}
      </div>
    )
  }

  return (
    <div className="h-full overflow-hidden rounded-[14px] border border-[#F6D7D3] bg-white/82 shadow-[0_10px_28px_rgba(107,84,72,0.06)]">
      <div className="h-full overflow-y-auto">
        {filteredTasks.map((task) => {
          // 历史终态任务优先使用历史数据，避免被恢复期间的 live 状态覆盖
          const liveTask = task.gid
            ? allTasks.find((t) => t.gid === task.gid)
            : null
          const displayTask =
            task.status === "complete" ||
            task.status === "error" ||
            task.status === "removed"
              ? task
              : liveTask || task

          return (
            <DownloadItem
              key={task.gid}
              download={displayTask}
              isSelected={selectedGid === task.gid}
              onPause={onPause}
              onResume={onResume}
              onRemove={onRemove}
              onSelect={onSelect}
            />
          )
        })}
      </div>
    </div>
  )
}
