import { useState } from "react"
import type { Aria2Status } from "../../shared/aria2"

export type DeleteConfirmTask = {
  gid: string
  fileName: string
  filePath: string
  status: string
  isLiveTask: boolean
}

type DeleteDownloadTaskOptions = {
  liveTasks: Aria2Status[]
  historyTasks: Aria2Status[]
  selectedTaskGid: string | null
  unknownLabel: string
  onBackToList: () => void
  onRefresh: () => Promise<void>
  onError: (error: unknown) => void
}

const isMissingAria2TaskError = (error: unknown) =>
  /not found|Could not remove download result/i.test(String(error))

export function useDeleteDownloadTask({
  liveTasks,
  historyTasks,
  selectedTaskGid,
  unknownLabel,
  onBackToList,
  onRefresh,
  onError,
}: DeleteDownloadTaskOptions) {
  const [deleteConfirmTask, setDeleteConfirmTask] =
    useState<DeleteConfirmTask | null>(null)

  const requestRemove = async (gid: string) => {
    try {
      const task =
        liveTasks.find((item) => item.gid === gid) ||
        historyTasks.find((item) => item.gid === gid)

      if (!task) return

      const taskWithFileName = task as typeof task & { fileName?: string }
      const torrentName = task.bittorrent?.info?.name
      const fileName =
        torrentName ||
        task.files?.[0]?.path?.split("/").pop() ||
        taskWithFileName.fileName ||
        unknownLabel
      const filePath =
        torrentName && task.dir
          ? `${task.dir}/${torrentName}`
          : task.files?.[0]?.path ||
            (task.dir && taskWithFileName.fileName
              ? `${task.dir}/${taskWithFileName.fileName}`
              : "")

      setDeleteConfirmTask({
        gid: task.gid,
        fileName,
        filePath,
        status: task.status,
        isLiveTask: liveTasks.some((item) => item.gid === task.gid),
      })
    } catch (error) {
      console.error("Failed to prepare task deletion:", error)
    }
  }

  const confirmDelete = async (deleteFile: boolean) => {
    if (!deleteConfirmTask) return

    try {
      const shouldRemoveLiveTask =
        deleteConfirmTask.isLiveTask &&
        ["active", "waiting", "paused"].includes(deleteConfirmTask.status)

      if (shouldRemoveLiveTask) {
        try {
          await window.aria2.forceRemove({ gid: deleteConfirmTask.gid })
        } catch (error) {
          if (!isMissingAria2TaskError(error)) throw error
        }
      } else {
        try {
          await window.aria2.removeDownloadResult({
            gid: deleteConfirmTask.gid,
          })
        } catch (error) {
          if (!isMissingAria2TaskError(error)) throw error
        }
      }

      if (deleteFile && deleteConfirmTask.filePath) {
        await window.grabbit.deleteFile(deleteConfirmTask.filePath)
      }

      await onRefresh()
      if (selectedTaskGid === deleteConfirmTask.gid) {
        onBackToList()
      }
      setDeleteConfirmTask(null)
    } catch (error) {
      console.error("Failed to delete task:", error)
      onError(error)
    }
  }

  return {
    deleteConfirmTask,
    requestRemove,
    confirmDelete,
    cancelDelete: () => setDeleteConfirmTask(null),
  }
}
