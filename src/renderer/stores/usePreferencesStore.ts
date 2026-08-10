import { create } from "zustand"
import type { Preferences } from "../../shared/preferences"

const defaultPreferences: Preferences = {
  maxOverallDownloadLimit: 0,
  maxOverallUploadLimit: 0,
  downloadDirectoryPath: "",
  theme: "light",
  language: "zh",
}

type PreferencesStore = {
  preferences: Preferences
  isLoaded: boolean
  loadPreferences: () => Promise<Preferences>
  savePreferencesPatch: (patch: Partial<Preferences>) => Promise<Preferences>
}

let loadPromise: Promise<Preferences> | null = null
let saveQueue = Promise.resolve()

const loadPreferencesFromMain = async (
  setPreferences: (preferences: Preferences) => void
) => {
  if (!loadPromise) {
    loadPromise = window.grabbit.getPreferences().then((preferences) => {
      setPreferences(preferences)
      return preferences
    })
  }

  return loadPromise
}

export const usePreferencesStore = create<PreferencesStore>((set, get) => ({
  preferences: defaultPreferences,
  isLoaded: false,

  loadPreferences: async () => {
    try {
      return await loadPreferencesFromMain((preferences) => {
        set({ preferences, isLoaded: true })
      })
    } catch (error) {
      loadPromise = null
      console.error("Failed to load preferences:", error)
      return get().preferences
    }
  },

  savePreferencesPatch: async (patch) => {
    let result: Preferences

    saveQueue = saveQueue.catch(() => undefined).then(async () => {
      const previousPreferences = get().isLoaded
        ? get().preferences
        : await loadPreferencesFromMain((preferences) => {
            set({ preferences, isLoaded: true })
          })
      const nextPreferences = {
        ...previousPreferences,
        ...patch,
      }

      try {
        const savedPreferences = await window.grabbit.savePreferences(
          nextPreferences
        )
        set({ preferences: savedPreferences, isLoaded: true })
        result = savedPreferences
      } catch (error) {
        set({ preferences: previousPreferences, isLoaded: true })
        throw error
      }
    })

    await saveQueue
    return result!
  },
}))
