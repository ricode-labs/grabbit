import React, { useCallback, useEffect } from "react"
import { Toast } from "@base-ui/react/toast"
import { Sidebar } from "./components/Sidebar"
import { TitleBar } from "./components/TitleBar"
import { StatusBar } from "./components/StatusBar"
import { AppToastViewport } from "./components/AppToastViewport"
import { DownloadPage, SettingsPage } from "./pages"
import { useUI } from "./context/useUI"
import { useDownloadStore } from "./stores/useDownloadStore"
import { useNavigationStore } from "./stores/useNavigationStore"
import { useUpdateStore } from "./stores/useUpdateStore"

const App: React.FC = () => {
  const { t } = useUI()
  const currentView = useNavigationStore((state) => state.currentView)
  const incrementCategoryUpdate = useNavigationStore(
    (state) => state.incrementCategoryUpdate
  )
  const checkAria2Status = useDownloadStore((state) => state.checkAria2Status)
  const refreshDownloads = useDownloadStore((state) => state.refreshDownloads)
  const refreshHistory = useDownloadStore((state) => state.refreshHistory)
  const refreshGlobalStat = useDownloadStore((state) => state.refreshGlobalStat)
  const loadUpdateState = useUpdateStore((state) => state.loadUpdateState)

  useEffect(() => {
    void loadUpdateState()
  }, [loadUpdateState])

  const notifyCompletedTasks = useCallback(
    async (newlyCompletedTasks: Awaited<ReturnType<typeof refreshHistory>>) => {
      if (newlyCompletedTasks.length === 0) return

      incrementCategoryUpdate("completed", newlyCompletedTasks.length)

      await Promise.all(
        newlyCompletedTasks.map((task) => {
          const taskWithFileName = task as typeof task & { fileName?: string }
          const fileName =
            task.bittorrent?.info?.name ||
            task.files?.[0]?.path?.split("/").pop() ||
            taskWithFileName.fileName ||
            t("unknown")
          return window.grabbit.showNotification(
            `${fileName} ${t("downloadCompleteNotification")}`
          )
        })
      )
    },
    [incrementCategoryUpdate, t]
  )

  useEffect(() => {
    let mounted = true
    let retryCount = 0
    const maxRetries = 30
    const messages = {
      connected: t("aria2Connected"),
      failed: t("aria2CheckFailed"),
    }

    const initializeApp = async () => {
      while (mounted && retryCount < maxRetries) {
        if (await checkAria2Status(messages)) break
        retryCount += 1
        await new Promise((resolve) => window.setTimeout(resolve, 1000))
      }

      if (!mounted) return undefined

      const [, newlyCompletedTasks] = await Promise.all([
        refreshDownloads(),
        refreshHistory(),
        refreshGlobalStat(),
      ])
      await notifyCompletedTasks(newlyCompletedTasks)

      const interval = window.setInterval(() => {
        if (!mounted) return
        void checkAria2Status(messages)
        void refreshDownloads()
        void refreshHistory()
          .then(notifyCompletedTasks)
          .catch((error) => {
            console.error(
              "Failed to show download completion notification:",
              error
            )
          })
        void refreshGlobalStat()
      }, 1000)

      return () => window.clearInterval(interval)
    }

    const cleanupPromise = initializeApp()

    return () => {
      mounted = false
      void cleanupPromise.then((cleanup) => cleanup?.())
    }
  }, [
    checkAria2Status,
    refreshDownloads,
    refreshGlobalStat,
    refreshHistory,
    notifyCompletedTasks,
    t,
  ])

  return (
    <Toast.Provider timeout={2200} limit={3}>
      <div className="app-window flex h-screen flex-col overflow-hidden bg-[#FFF8F7] text-[#2D2522]">
        <TitleBar />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar />

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#FFF8F7] pt-11">
            <main className="flex flex-1 flex-col overflow-hidden px-4">
              {currentView === "settings" ? <SettingsPage /> : <DownloadPage />}
            </main>

            {currentView === "list" && (
              <div className="px-4 pt-3 pb-3">
                <StatusBar />
              </div>
            )}
          </div>
        </div>

        <AppToastViewport />
      </div>
    </Toast.Provider>
  )
}

export default App
