import React, { useState } from "react"
import { DownloadList } from "../components/DownloadList"
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
import { useUI } from "../context/useUI"
import { useDownloadStore } from "../stores/useDownloadStore"
import { useNavigationStore } from "../stores/useNavigationStore"
import { usePreferencesStore } from "../stores/usePreferencesStore"
import { useClipboardDownloadPrompt } from "../hooks/useClipboardDownloadPrompt"
import { useDeleteDownloadTask } from "../hooks/useDeleteDownloadTask"
import { NoticeModal } from "../components/ui/NoticeModal"
import type { NoticeState } from "../types/app"
import type { Options } from "../../shared/aria2"
import faviconUrl from "../assets/favicon.webp"

const toolbarIconButtonClass =
  "flex h-8 w-8 items-center justify-center rounded-full border border-[#F0DED8] bg-white/90 text-[#9A7C70] shadow-sm transition-all hover:border-[#FFC3CF] hover:text-[#FF5C78] disabled:cursor-not-allowed disabled:opacity-40"
const disabledToolbarIconButtonClass =
  "flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-full border border-[#F0DED8] bg-white/90 text-[#BCAAA1] opacity-60 shadow-sm"

export const DownloadPage: React.FC = () => {
  const { t } = useUI()
  const currentCategory = useNavigationStore((state) => state.currentCategory)
  const selectedTaskGid = useNavigationStore((state) => state.selectedTaskGid)
  const selectTask = useNavigationStore((state) => state.selectTask)
  const backToList = useNavigationStore((state) => state.backToList)
  const downloads = useDownloadStore((state) => state.downloads)
  const historyTasks = useDownloadStore((state) => state.historyTasks)
  const aria2Status = useDownloadStore((state) => state.aria2Status)
  const defaultDownloadDir = usePreferencesStore(
    (state) => state.preferences.downloadDirectoryPath
  )
  const pauseDownload = useDownloadStore((state) => state.pauseDownload)
  const resumeDownload = useDownloadStore((state) => state.resumeDownload)
  const addDownload = useDownloadStore((state) => state.addDownload)
  const refreshDownloads = useDownloadStore((state) => state.refreshDownloads)
  const refreshHistory = useDownloadStore((state) => state.refreshHistory)
  const [lastUsedDownloadDir, setLastUsedDownloadDir] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [notice, setNotice] = useState<NoticeState | null>(null)
  const {
    clipboardUrl,
    launchHeaders,
    torrentPath,
    modalKey,
    isAddModalOpen,
    openAddModal,
    closeAddModal,
    closeAndMarkClipboardUrl,
    markClipboardUrlHandled,
  } = useClipboardDownloadPrompt()

  const rawLiveTasks = [
    ...downloads.active,
    ...downloads.waiting,
    ...downloads.stopped,
  ]
  const terminalHistoryGids = new Set(
    historyTasks
      .filter((task) => ["complete", "error", "removed"].includes(task.status))
      .map((task) => task.gid)
  )
  const liveTasks = rawLiveTasks.filter(
    (task) => !terminalHistoryGids.has(task.gid)
  )
  const currentTasks = (() => {
    if (currentCategory === "downloading") {
      return liveTasks.filter((task) =>
        ["active", "waiting", "paused"].includes(task.status)
      )
    }
    if (currentCategory === "completed") {
      return historyTasks.filter((task) => task.status === "complete")
    }
    if (currentCategory === "deleted") {
      return historyTasks.filter(
        (task) => task.status === "error" || task.status === "removed"
      )
    }
    const seen = new Set<string>()
    const terminalHistoryTasks = historyTasks.filter(
      (task) =>
        task.status === "complete" ||
        task.status === "error" ||
        task.status === "removed"
    )
    return [...terminalHistoryTasks, ...liveTasks, ...historyTasks].filter(
      (task) => {
        if (!task.gid) return true
        if (seen.has(task.gid)) return false
        seen.add(task.gid)
        return true
      }
    )
  })()
  const selectedHistoryTask = selectedTaskGid
    ? historyTasks.find((task) => task.gid === selectedTaskGid) || null
    : null
  const selectedTask = selectedTaskGid
    ? selectedHistoryTask &&
      ["complete", "error", "removed"].includes(selectedHistoryTask.status)
      ? null
      : liveTasks.find((task) => task.gid === selectedTaskGid) || null
    : null

  const pausableTasks = currentTasks.filter((task) => task.status === "active")
  const resumableTasks = currentTasks.filter((task) => task.status === "paused")

  const handlePauseVisible = async () => {
    await Promise.all(pausableTasks.map((task) => pauseDownload(task.gid)))
  }

  const handleResumeVisible = async () => {
    await Promise.all(resumableTasks.map((task) => resumeDownload(task.gid)))
  }

  const showDetailDrawer = Boolean(
    selectedTaskGid && (selectedTask || selectedHistoryTask)
  )
  const { deleteConfirmTask, requestRemove, confirmDelete, cancelDelete } =
    useDeleteDownloadTask({
      liveTasks,
      historyTasks,
      selectedTaskGid,
      unknownLabel: t("unknown"),
      onBackToList: backToList,
      onRefresh: async () => {
        await Promise.all([refreshDownloads(), refreshHistory()])
      },
      onError: (error) => {
        setNotice({
          title: t("noticeTitle"),
          message: `${t("deleteTaskFailed")}: ${error}`,
          variant: "error",
        })
      },
    })

  const handleAddDownload = async (
    url: string,
    options: Options
  ) => {
    try {
      await addDownload(url, options)
      markClipboardUrlHandled(url)
      closeAddModal()
    } catch (error) {
      console.error("Failed to add download:", error)
      setNotice({
        title: t("noticeTitle"),
        message: `${t("failedToAddDownload")}: ${error}`,
        variant: "error",
      })
    }
  }

  return (
    <>
      <div className="relative grid min-h-0 flex-1 grid-cols-1 grid-rows-[34px_minmax(0,1fr)] gap-y-3 overflow-hidden">
        <div className="flex h-[34px] items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-[32px] overflow-hidden rounded-[14px] border border-[#FFC3CF] bg-[#FFF1F4] text-[12px] font-semibold text-[#FF5C78] shadow-[0_8px_18px_rgba(255,124,148,0.16)]">
              <button
                onClick={() => openAddModal()}
                disabled={!aria2Status.connected}
                className="flex items-center gap-1.5 px-3 transition-all hover:bg-[#FFE5EC] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={15} strokeWidth={2} />
                {t("addDownload")}
              </button>
              <button
                onClick={() => openAddModal()}
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
              className={toolbarIconButtonClass}
              title={t("resume")}
            >
              <Play size={16} />
            </button>
            <button
              onClick={handlePauseVisible}
              disabled={pausableTasks.length === 0}
              className={toolbarIconButtonClass}
              title={t("pause")}
            >
              <Pause size={16} />
            </button>
            <button
              disabled
              className={disabledToolbarIconButtonClass}
              title={t("delete")}
            >
              <X size={16} />
            </button>
            <button
              disabled
              className={disabledToolbarIconButtonClass}
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
            onPause={pauseDownload}
            onResume={resumeDownload}
            onRemove={requestRemove}
            onSelect={selectTask}
          />
        </div>

        {showDetailDrawer && (
          <div className="absolute top-0 right-0 bottom-0 z-30 w-[min(440px,76%)] min-w-[360px]">
            <DownloadDetail
              task={selectedTask}
              historyTask={selectedHistoryTask}
              onClose={backToList}
              onRemove={requestRemove}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {isAddModalOpen && (
        <AddDownloadModal
          key={modalKey}
          defaultDownloadDir={defaultDownloadDir}
          lastUsedDir={lastUsedDownloadDir || defaultDownloadDir}
          initialUrl={clipboardUrl}
          initialTorrentPath={torrentPath}
          initialHeaders={launchHeaders}
          onAdd={handleAddDownload}
          onClose={closeAndMarkClipboardUrl}
          onDirChange={setLastUsedDownloadDir}
        />
      )}

      {deleteConfirmTask && (
        <DeleteConfirmModal
          task={deleteConfirmTask}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}

      {notice && (
        <NoticeModal
          isOpen={true}
          title={notice.title}
          message={notice.message}
          variant={notice.variant}
          onClose={() => setNotice(null)}
          onConfirm={() => setNotice(null)}
        />
      )}
    </>
  )
}
