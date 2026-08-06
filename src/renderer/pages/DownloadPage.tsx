import React, { useState } from "react"
import { DownloadList } from "../components/DownloadList"
import type { CategoryType } from "../components/DownloadList"
import { DownloadDetail } from "../components/DownloadDetail"
import { AddDownloadModal } from "../components/AddDownloadModal"
import { DeleteConfirmModal } from "../components/DeleteConfirmModal"
import {
  ChevronDown,
  FolderOpen,
  Pause,
  Play,
  Plus,
  Search,
  X,
} from "lucide-react"
import { useUI } from "../context/UIContext"
import faviconUrl from "../assets/favicon.webp"

interface DownloadPageProps {
  downloads: any
  historyTasks: any[]
  aria2Status: any
  settings: any
  currentCategory: CategoryType
  selectedTaskGid: string | null
  deleteConfirmTask: any
  initialModalOpen?: boolean
  initialModalUrl?: string
  onSelectTask: (gid: string) => void
  onBackToList: () => void
  onPause: (gid: string) => Promise<void>
  onResume: (gid: string) => Promise<void>
  onRemove: (gid: string) => Promise<void>
  onAddDownload: (url: string, options: any) => Promise<void>
  onDeleteConfirm: (deleteFile: boolean) => Promise<void>
  onDeleteCancel: () => void
  onModalClose?: () => void
}

export const DownloadPage: React.FC<DownloadPageProps> = ({
  downloads,
  historyTasks,
  aria2Status,
  settings,
  currentCategory,
  selectedTaskGid,
  deleteConfirmTask,
  initialModalOpen = false,
  initialModalUrl = "",
  onSelectTask,
  onBackToList,
  onPause,
  onResume,
  onRemove,
  onAddDownload,
  onDeleteConfirm,
  onDeleteCancel,
  onModalClose,
}) => {
  const { t } = useUI()
  const [showAddModal, setShowAddModal] = useState(initialModalOpen)
  const [lastUsedDownloadDir, setLastUsedDownloadDir] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")

  const handleCloseModal = () => {
    setShowAddModal(false)
    onModalClose?.()
  }

  const liveTasks = [
    ...downloads.active,
    ...downloads.waiting,
    ...downloads.stopped,
  ]
  const currentTasks = (() => {
    if (currentCategory === "downloading") {
      return liveTasks.filter((task: any) =>
        ["active", "waiting", "paused"].includes(task.status)
      )
    }
    if (currentCategory === "completed") {
      return historyTasks.filter((task: any) => task.status === "complete")
    }
    if (currentCategory === "deleted") {
      return historyTasks.filter(
        (task: any) => task.status === "error" || task.status === "removed"
      )
    }
    const seen = new Set<string>()
    return [...liveTasks, ...historyTasks].filter((task: any) => {
      if (!task.gid) return true
      if (seen.has(task.gid)) return false
      seen.add(task.gid)
      return true
    })
  })()
  const pausableTasks = currentTasks.filter(
    (task: any) => task.status === "active"
  )
  const resumableTasks = currentTasks.filter(
    (task: any) => task.status === "paused"
  )

  const handlePauseVisible = async () => {
    await Promise.all(pausableTasks.map((task: any) => onPause(task.gid)))
  }

  const handleResumeVisible = async () => {
    await Promise.all(resumableTasks.map((task: any) => onResume(task.gid)))
  }

  const selectedTask = selectedTaskGid
    ? [...downloads.active, ...downloads.waiting, ...downloads.stopped].find(
        (t: any) => t.gid === selectedTaskGid
      )
    : null
  const selectedHistoryTask = selectedTaskGid
    ? historyTasks.find((t: any) => t.gid === selectedTaskGid)
    : null
  const showDetailDrawer = Boolean(
    selectedTaskGid && (selectedTask || selectedHistoryTask)
  )

  return (
    <>
      <div className="relative grid min-h-0 flex-1 grid-cols-1 grid-rows-[34px_minmax(0,1fr)] gap-y-3 overflow-hidden">
        <div className="flex h-[34px] items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-[32px] overflow-hidden rounded-[14px] border border-[#FFC3CF] bg-[#FFF1F4] text-[12px] font-semibold text-[#FF5C78] shadow-[0_8px_18px_rgba(255,124,148,0.16)]">
              <button
                onClick={() => setShowAddModal(true)}
                disabled={!aria2Status.connected}
                className="flex items-center gap-1.5 px-3 transition-all hover:bg-[#FFE5EC] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={15} strokeWidth={2} />
                {t("addDownload")}
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                disabled={!aria2Status.connected}
                className="flex w-8 items-center justify-center border-l border-[#FFD3DD] transition-all hover:bg-[#FFE5EC] disabled:cursor-not-allowed disabled:opacity-50"
                title={t("addDownload")}
              >
                <ChevronDown size={15} />
              </button>
            </div>
            <button
              onClick={handleResumeVisible}
              disabled={resumableTasks.length === 0}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#F0DED8] bg-white/90 text-[#9A7C70] shadow-sm transition-all hover:border-[#FFC3CF] hover:text-[#FF5C78] disabled:cursor-not-allowed disabled:opacity-40"
              title={t("resume")}
            >
              <Play size={16} />
            </button>
            <button
              onClick={handlePauseVisible}
              disabled={pausableTasks.length === 0}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#F0DED8] bg-white/90 text-[#9A7C70] shadow-sm transition-all hover:border-[#FFC3CF] hover:text-[#FF5C78] disabled:cursor-not-allowed disabled:opacity-40"
              title={t("pause")}
            >
              <Pause size={16} />
            </button>
            <button
              disabled
              className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-full border border-[#F0DED8] bg-white/90 text-[#BCAAA1] opacity-60 shadow-sm"
              title={t("delete")}
            >
              <X size={16} />
            </button>
            <button
              disabled
              className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-full border border-[#F0DED8] bg-white/90 text-[#BCAAA1] opacity-60 shadow-sm"
              title={t("saveLocation")}
            >
              <FolderOpen size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-[142px]">
              <Search
                size={15}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#9A8276]"
              />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t("searchPlaceholder")}
                className="h-8 w-full rounded-[14px] border border-[#F0DED8] bg-white/90 pr-3 pl-9 text-[12px] text-[#6B5448] shadow-sm transition-all outline-none placeholder:text-[#B7A59C] focus:border-[#FFC3CF] focus:ring-4 focus:ring-[#FFE6EC]"
              />
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#F0DED8] bg-white/90 shadow-sm">
              <img
                src={faviconUrl}
                alt="Grabbit"
                className="h-[24px] w-[24px] object-contain"
              />
            </div>
          </div>
        </div>

        <div className="min-h-0 overflow-hidden">
          <DownloadList
            downloads={downloads}
            historyTasks={historyTasks}
            category={currentCategory}
            selectedGid={selectedTaskGid}
            searchTerm={searchTerm}
            onPause={onPause}
            onResume={onResume}
            onRemove={onRemove}
            onSelect={onSelectTask}
          />
        </div>

        {showDetailDrawer && (
          <div className="absolute top-0 right-0 bottom-0 z-30 w-[min(440px,76%)] min-w-[360px]">
            <DownloadDetail
              task={selectedTask}
              historyTask={selectedHistoryTask}
              onClose={onBackToList}
              onRemove={onRemove}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddDownloadModal
          defaultDownloadDir={settings.defaultDownloadDir}
          lastUsedDir={lastUsedDownloadDir || settings.defaultDownloadDir}
          initialUrl={initialModalUrl}
          onAdd={async (url, options) => {
            await onAddDownload(url, options)
            handleCloseModal()
          }}
          onClose={handleCloseModal}
          onDirChange={setLastUsedDownloadDir}
        />
      )}

      {deleteConfirmTask && (
        <DeleteConfirmModal
          task={deleteConfirmTask}
          onConfirm={onDeleteConfirm}
          onCancel={onDeleteCancel}
        />
      )}
    </>
  )
}
