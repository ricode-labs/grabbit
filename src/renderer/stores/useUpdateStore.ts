import { create } from "zustand"
import type { UpdateViewState } from "../types/app"

type UpdateStore = {
  updateState: UpdateViewState | null
  loadUpdateState: () => Promise<void>
  checkForUpdates: () => Promise<UpdateViewState>
}

export const useUpdateStore = create<UpdateStore>((set, get) => ({
  updateState: null,

  loadUpdateState: async () => {
    try {
      const currentVersion = await window.grabbit.getVersion()
      set({
        updateState: {
          currentVersion,
          latestVersion: currentVersion,
          available: false,
        },
      })

      const updateResult = await window.grabbit.checkUpdates()
      set({ updateState: { currentVersion, ...updateResult } })
    } catch (error) {
      console.debug("Failed to check for updates:", error)
    }
  },

  checkForUpdates: async () => {
    const currentVersion =
      get().updateState?.currentVersion || (await window.grabbit.getVersion())
    const updateResult = await window.grabbit.checkUpdates()
    const nextState = { currentVersion, ...updateResult }
    set({ updateState: nextState })
    return nextState
  },

}))
