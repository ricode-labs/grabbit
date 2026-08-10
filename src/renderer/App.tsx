import React, { useState, useEffect, useRef } from "react"
import { Sidebar } from "./components/Sidebar"
import { TitleBar } from "./components/TitleBar"
import { StatusBar } from "./components/StatusBar"
import { DownloadPage, SettingsPage } from "./pages"
import type { CategoryType } from "./components/DownloadList"
import { NoticeModal } from "./components"
import { useUI } from "./context/useUI"
import {
  useDownloads,
  useAria2Status,
  useSettings,
  useHistory,
  useGlobalStat,
} from "./hooks"
import type {
  AddTorrentPayload,
  AddUriPayload,
  Aria2GlobalStat,
  Aria2Status,
  Aria2Version,
  GidPayload,
  Options,
  Preferences,
  TellRangePayload,
} from "../shared/types"

interface ElectronAPI {
  getAria2Status: () => Promise<{ connected: boolean; message: string }>
  reconnectAria2: () => Promise<{ success: boolean; message: string }>
  addDownload: (url: string, options: any) => Promise<string>
  pauseDownload: (gid: string) => Promise<string>
  resumeDownload: (gid: string) => Promise<string>
  removeDownload: (gid: string) => Promise<string>
  getDownloads: () => Promise<any>
  getGlobalStat: () => Promise<any>
  setGlobalSpeedLimit: (
    downloadLimit: number,
    uploadLimit: number
  ) => Promise<void>
  getHistory: () => Promise<any[]>
  removeFromHistory: (gid: string) => Promise<void>
  getDownloadMetadata: (url: string) => Promise<any>
  // getDiskSpace: (dir: string) => Promise<any>
  minimizeWindow: () => Promise<void>
  maximizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>
  isMaximized: () => Promise<boolean>
}

interface Aria2API {
  addUri: (payload: AddUriPayload) => Promise<string>
  addTorrent: (payload: AddTorrentPayload) => Promise<string>
  remove: (payload: GidPayload) => Promise<string>
  forceRemove: (payload: GidPayload) => Promise<string>
  removeDownloadResult: (payload: GidPayload) => Promise<"OK">
  pause: (payload: GidPayload) => Promise<string>
  forcePause: (payload: GidPayload) => Promise<string>
  unpause: (payload: GidPayload) => Promise<string>
  tellStatus: (payload: GidPayload) => Promise<Aria2Status>
  tellActive: (keys?: string[]) => Promise<Aria2Status[]>
  tellWaiting: (payload: TellRangePayload) => Promise<Aria2Status[]>
  tellStopped: (payload: TellRangePayload) => Promise<Aria2Status[]>
  getGlobalOption: () => Promise<Options>
  getGlobalStat: () => Promise<Aria2GlobalStat>
  getVersion: () => Promise<Aria2Version>
  changeGlobalOption: (payload: Options) => Promise<"OK">
}

interface GrabbitAPI {
  platform: NodeJS.Platform
  savePreferences: (preferences: Preferences) => Promise<Preferences>
  selectFolder: () => Promise<string | null>
  selectTorrentFile: () => Promise<string | null>
  // getTorrentInfo: (torrentPath: string) => Promise<any>
  getClipboardText: () => Promise<string>
   showNotification: (message: string) => Promise<boolean>
   deleteFile: (filePath: string) => Promise<boolean>
   openFile: (filePath: string) => Promise<boolean>
   openFolder: (folderPath: string) => Promise<boolean>
  getPreferences: () => Promise<Preferences>
  minimizeWindow: () => Promise<void>
  maximizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
    aria2: Aria2API
    grabbit: GrabbitAPI
  }
}

type ViewType = "list" | "detail" | "settings"
type CategoryUpdates = Record<CategoryType, number>
type NoticeState = {
  message: string
  variant?: "info" | "success" | "error"
  title?: string
  onConfirm?: () => void
}

const isMissingAria2TaskError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  return /not found|Could not remove download result/i.test(message)
}

const isDownloadableLink = (text: string): boolean => {
  const text_trimmed = text.trim()
  return (
    /^(https?:\/\/|magnet:|ftp:\/\/)/.test(text_trimmed) &&
    text_trimmed.length > 10
  )
}

const App: React.FC = () => {
  const { t } = useUI()

  // 业务逻辑 Hooks
  const { downloads, refreshDownloads } = useDownloads()
  const { globalStat, refreshGlobalStat } = useGlobalStat()
  const { aria2Status, checkAria2Status } = useAria2Status()
  const { settings, loadSettings } = useSettings()
  const {
    historyTasks,
    refreshHistory,
    isLoaded: isHistoryLoaded,
  } = useHistory()

  // UI 状态
  const [currentCategory, setCurrentCategory] =
    useState<CategoryType>("downloading")
  const [currentView, setCurrentView] = useState<ViewType>("list")
  const [selectedTaskGid, setSelectedTaskGid] = useState<string | null>(null)
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<any | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [clipboardUrl, setClipboardUrl] = useState("")
  const [notice, setNotice] = useState<NoticeState | null>(null)
  const [categoryUpdates, setCategoryUpdates] = useState<CategoryUpdates>({
    downloading: 0,
    completed: 0,
    all: 0,
    deleted: 0,
  })
  const previousCompletedIds = useRef<Set<string> | null>(null)

  useEffect(() => {
    if (!isHistoryLoaded) return

    const completedIds = new Set(
      historyTasks
        .filter((task) => task.status === "complete" && task.gid)
        .map((task) => task.gid)
    )

    if (previousCompletedIds.current === null) {
      previousCompletedIds.current = completedIds
      return
    }

    const newlyCompletedTasks = historyTasks.filter((task) => {
      if (task.status !== "complete" || !task.gid) return false
      return !previousCompletedIds.current?.has(task.gid)
    })

    if (newlyCompletedTasks.length > 0) {
      setCategoryUpdates((previous) => ({
        ...previous,
        completed: previous.completed + newlyCompletedTasks.length,
      }))

      void Promise.all(
        newlyCompletedTasks.map((task) => {
          const fileName =
            task.bittorrent?.info?.name ||
            task.files?.[0]?.path?.split("/").pop() ||
            task.fileName ||
            t("unknown")
          return window.grabbit.showNotification(
            `${fileName} ${t("downloadCompleteNotification")}`
          )
        })
      ).catch((error) => {
        console.error("Failed to show download completion notification:", error)
      })
    }

    previousCompletedIds.current = completedIds
  }, [historyTasks, isHistoryLoaded, t])

  // 检测剪切板中的可下载链接
  useEffect(() => {
    const checkClipboard = async () => {
      try {
        const text = await window.grabbit.getClipboardText()
        if (text && isDownloadableLink(text) && text !== clipboardUrl) {
          setClipboardUrl(text)
          setShowAddModal(true)
        }
      } catch (error) {
        console.error("Failed to check clipboard:", error)
      }
    }

    // 每 3 秒检查一次剪切板
    const clipboardInterval = setInterval(checkClipboard, 3000)

    return () => clearInterval(clipboardInterval)
  }, [clipboardUrl])

  useEffect(() => {
    let mounted = true
    let retryCount = 0
    const maxRetries = 30

    const initializeApp = async () => {
      // 加载设置
      await loadSettings()

      // 等待 aria2 连接
      while (mounted && retryCount < maxRetries) {
        const connected = await checkAria2Status()
        if (connected) {
          break
        }
        retryCount++
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      if (mounted) {
        refreshDownloads()
        refreshGlobalStat()
        refreshHistory()

        const interval = setInterval(() => {
          if (mounted) {
            checkAria2Status()
            refreshDownloads()
            refreshGlobalStat()
            refreshHistory()
          }
        }, 1000)

        return () => {
          clearInterval(interval)
        }
      }
    }

    const cleanupPromise = initializeApp()

    return () => {
      mounted = false
      cleanupPromise.then((cleanup) => cleanup?.())
    }
  }, [
    loadSettings,
    checkAria2Status,
    refreshDownloads,
    refreshGlobalStat,
    refreshHistory,
  ])

  const handleAddDownload = async (url: string, options: any) => {
    try {
      if (/\.torrent(?:$|[?#])/i.test(url)) {
        await window.aria2.addTorrent({ torrentPath: url, options })
      } else {
        await window.aria2.addUri({
          uris: url.trim().split(/\s+/),
          options,
        })
      }
      await refreshDownloads()
      await refreshHistory()
      setShowAddModal(false)
    } catch (error) {
      console.error("Failed to add download:", error)
      setNotice({
        title: t("noticeTitle"),
        message: `${t("failedToAddDownload")}: ${error}`,
        variant: "error",
      })
    }
  }

  const handlePause = async (gid: string) => {
    try {
      await window.aria2.forcePause({ gid })
      await refreshDownloads()
    } catch (error) {
      console.error("Failed to pause download:", error)
    }
  }

  const handleResume = async (gid: string) => {
    try {
      await window.aria2.unpause({ gid })
      await refreshDownloads()
    } catch (error) {
      console.error("Failed to resume download:", error)
    }
  }

  const handleRemove = async (gid: string) => {
    try {
      // 查找任务
      const allTasks = [
        ...downloads.active,
        ...downloads.waiting,
        ...downloads.stopped,
      ]
      const task =
        allTasks.find((t) => t.gid === gid) ||
        historyTasks.find((t) => t.gid === gid)

      if (!task) return

      const torrentName = task.bittorrent?.info?.name
      const fileName =
        torrentName ||
        task.files?.[0]?.path?.split("/").pop() ||
        task.fileName ||
        t("unknown")
      const filePath =
        torrentName && task.dir
          ? `${task.dir}/${torrentName}`
          : task.files?.[0]?.path ||
            (task.dir && task.fileName ? `${task.dir}/${task.fileName}` : "")

      setDeleteConfirmTask({
        gid: task.gid,
        fileName,
        filePath,
        status: task.status,
        isLiveTask: allTasks.some((item) => item.gid === task.gid),
      })
    } catch (error) {
      console.error("Failed to prepare task deletion:", error)
    }
  }

  const handleDeleteConfirm = async (deleteFile: boolean) => {
    if (!deleteConfirmTask) return

    try {
      // 只对仍在 aria2 中的任务调用移除接口，已结束或历史任务只清理历史记录
      const shouldRemoveLiveTask =
        deleteConfirmTask.isLiveTask &&
        ["active", "waiting", "paused"].includes(deleteConfirmTask.status)

      if (shouldRemoveLiveTask) {
        try {
          await window.aria2.forceRemove({ gid: deleteConfirmTask.gid })
        } catch (error) {
          if (!isMissingAria2TaskError(error)) throw error
        }
      }

      // remove/removeForce already removes an active or queued task completely;
      // only stopped and historical tasks have a download result to remove.
      if (!shouldRemoveLiveTask) {
        try {
          await window.aria2.removeDownloadResult({
            gid: deleteConfirmTask.gid,
          })
        } catch (error) {
          if (!isMissingAria2TaskError(error)) throw error
        }
      }

      // aria2 不再管理任务后再删除本地文件，避免 .aria2 控制文件被重新写出。
      if (deleteFile && deleteConfirmTask.filePath) {
        await window.grabbit.deleteFile(deleteConfirmTask.filePath)
      }

      await refreshDownloads()
      await refreshHistory()

      // 如果删除的是当前选中的任务，返回列表
      if (selectedTaskGid === deleteConfirmTask.gid) {
        setCurrentView("list")
        setSelectedTaskGid(null)
      }

      setDeleteConfirmTask(null)
    } catch (error) {
      console.error("Failed to delete task:", error)
      setNotice({
        title: t("noticeTitle"),
        message: `${t("deleteTaskFailed")}: ${error}`,
        variant: "error",
      })
    }
  }

  const handleSelectTask = (gid: string) => {
    setSelectedTaskGid(gid)
  }

  const handleBackToList = () => {
    setCurrentView("list")
    setSelectedTaskGid(null)
  }

  const handleShowSettings = () => {
    setSelectedTaskGid(null)
    setCurrentView("settings")
  }

  const handleBackFromSettings = () => {
    setCurrentView("list")
    loadSettings() // 重新加载设置
  }

  return (
    <div className="app-window flex h-screen flex-col overflow-hidden bg-[#FFF8F7] text-[#2D2522]">
      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentCategory={currentCategory}
          currentView={currentView}
          onCategoryChange={(c) => {
            setCurrentView("list")
            setSelectedTaskGid(null)
            setCurrentCategory(c)
            setCategoryUpdates((previous) => ({
              ...previous,
              [c]: 0,
            }))
          }}
          onSettingsClick={handleShowSettings}
          categoryUpdates={categoryUpdates}
        />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#FFF8F7] pt-11">
          <main className="flex flex-1 flex-col overflow-hidden px-4">
            {currentView === "settings" ? (
              <SettingsPage onBack={handleBackFromSettings} />
            ) : (
              <DownloadPage
                downloads={downloads}
                historyTasks={historyTasks}
                aria2Status={aria2Status}
                settings={settings}
                currentCategory={currentCategory}
                selectedTaskGid={selectedTaskGid}
                deleteConfirmTask={deleteConfirmTask}
                initialModalOpen={showAddModal}
                initialModalUrl={clipboardUrl}
                onSelectTask={handleSelectTask}
                onBackToList={handleBackToList}
                onPause={handlePause}
                onResume={handleResume}
                onRemove={handleRemove}
                onAddDownload={handleAddDownload}
                onDeleteConfirm={handleDeleteConfirm}
                onDeleteCancel={() => setDeleteConfirmTask(null)}
                onModalClose={() => {
                  setShowAddModal(false)
                  setClipboardUrl("")
                }}
              />
            )}
          </main>

          {currentView === "list" && (
            <div className="px-4 pt-3 pb-3">
              <StatusBar globalStat={globalStat} downloads={downloads} />
            </div>
          )}
        </div>
      </div>

      {notice && (
        <NoticeModal
          isOpen={true}
          title={notice.title}
          message={notice.message}
          variant={notice.variant}
          onClose={() => setNotice(null)}
          onConfirm={() => notice.onConfirm?.()}
        />
      )}
    </div>
  )
}

export default App
