import { create } from "zustand"
import type {
  Aria2ConnectionMessages,
  Aria2ConnectionState,
  DownloadsData,
} from "../types/app"
import type { Aria2GlobalStat } from "../../shared/aria2"
import type { Aria2Status } from "../../shared/aria2"

const seenCompletedStorageKey = "grabbit.seenCompletedTaskIds"
const maxSeenCompletedIds = 500

export type DownloadStore = {
  downloads: DownloadsData
  historyTasks: Aria2Status[]
  isHistoryLoaded: boolean
  globalStat: Partial<Aria2GlobalStat>
  aria2Status: Aria2ConnectionState
  checkAria2Status: (messages: Aria2ConnectionMessages) => Promise<boolean>
  refreshDownloads: () => Promise<void>
  refreshHistory: () => Promise<Aria2Status[]>
  refreshGlobalStat: () => Promise<void>
  addDownload: (url: string, options: Record<string, string>) => Promise<void>
  pauseDownload: (gid: string) => Promise<void>
  resumeDownload: (gid: string) => Promise<void>
}

let previousCompletedIds: Set<string> | null = null

const loadSeenCompletedIds = () => {
  try {
    const rawIds = localStorage.getItem(seenCompletedStorageKey)
    if (!rawIds) return { ids: new Set<string>(), hasStoredIds: false }

    const parsed = JSON.parse(rawIds)
    if (!Array.isArray(parsed)) {
      return { ids: new Set<string>(), hasStoredIds: false }
    }

    return {
      ids: new Set(parsed.filter((id): id is string => typeof id === "string")),
      hasStoredIds: true,
    }
  } catch (error) {
    console.error("Failed to load seen completed tasks:", error)
    return { ids: new Set<string>(), hasStoredIds: false }
  }
}

const saveSeenCompletedIds = (ids: string[]) => {
  try {
    localStorage.setItem(
      seenCompletedStorageKey,
      JSON.stringify(ids.slice(0, maxSeenCompletedIds))
    )
  } catch (error) {
    console.error("Failed to save seen completed tasks:", error)
  }
}

export const useDownloadStore = create<DownloadStore>((set) => ({
  downloads: {
    active: [],
    waiting: [],
    stopped: [],
  },
  historyTasks: [],
  isHistoryLoaded: false,
  globalStat: {},
  aria2Status: {
    connected: false,
    message: "",
  },
  checkAria2Status: async (messages) => {
    try {
      await window.aria2.getVersion()
      set({
        aria2Status: {
          connected: true,
          message: messages.connected,
        },
      })
      return true
    } catch (error) {
      console.error("Failed to check aria2 status:", error)
      set({
        aria2Status: {
          connected: false,
          message: messages.failed,
        },
      })
      return false
    }
  },

  refreshDownloads: async () => {
    try {
      const [active, waiting] = await Promise.all([
        window.aria2.tellActive(),
        window.aria2.tellWaiting({ offset: 0, num: 100 }),
      ])
      set((state) => ({
        downloads: { ...state.downloads, active, waiting },
      }))
    } catch (error) {
      console.error("Failed to fetch downloads:", error)
    }
  },

  refreshHistory: async () => {
    try {
      const historyTasks = await window.aria2.tellStopped({
        offset: 0,
        num: 100,
      })
      const latestHistoryTasks = [...historyTasks].reverse()
      const completedIds = latestHistoryTasks
        .filter((task) => task.status === "complete" && task.gid)
        .map((task) => task.gid)
      const { ids: storedCompletedIds, hasStoredIds } = loadSeenCompletedIds()
      const knownCompletedIds = previousCompletedIds ?? storedCompletedIds
      const shouldSeedBaseline = previousCompletedIds === null && !hasStoredIds
      const newlyCompletedTasks = shouldSeedBaseline
        ? []
        : latestHistoryTasks.filter(
            (task) =>
              task.status === "complete" &&
              task.gid &&
              !knownCompletedIds.has(task.gid)
          )
      const currentCompletedIds = completedIds.slice(0, maxSeenCompletedIds)

      if (latestHistoryTasks.length > 0 || currentCompletedIds.length > 0) {
        previousCompletedIds = new Set(currentCompletedIds)
        saveSeenCompletedIds(currentCompletedIds)
      } else if (previousCompletedIds === null) {
        previousCompletedIds = storedCompletedIds
      }
      set((state) => ({
        downloads: { ...state.downloads, stopped: latestHistoryTasks },
        historyTasks: latestHistoryTasks,
        isHistoryLoaded: true,
      }))
      return newlyCompletedTasks
    } catch (error) {
      console.error("Failed to fetch history:", error)
      return []
    }
  },

  refreshGlobalStat: async () => {
    try {
      const globalStat = await window.aria2.getGlobalStat()
      set({ globalStat })
    } catch (error) {
      console.error("Failed to fetch global stat:", error)
    }
  },

  addDownload: async (url, options) => {
    if (/\.torrent(?:$|[?#])/i.test(url)) {
      await window.aria2.addTorrent({ torrentPath: url, options })
    } else {
      await window.aria2.addUri({ uris: url.trim().split(/\s+/), options })
    }
    await Promise.all([
      useDownloadStore.getState().refreshDownloads(),
      useDownloadStore.getState().refreshHistory(),
    ])
  },

  pauseDownload: async (gid) => {
    await window.aria2.forcePause({ gid })
    await useDownloadStore.getState().refreshDownloads()
  },

  resumeDownload: async (gid) => {
    await window.aria2.unpause({ gid })
    await useDownloadStore.getState().refreshDownloads()
  },
}))
