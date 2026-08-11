import { create } from "zustand"
import type { CategoryUpdates, PageCategory, ViewType } from "../types/app"

const completedUnreadStorageKey = "grabbit.hasUnreadCompletedTasks"

const loadCompletedUnread = () => {
  try {
    return localStorage.getItem(completedUnreadStorageKey) === "true"
  } catch {
    return false
  }
}

const saveCompletedUnread = (hasUnread: boolean) => {
  try {
    localStorage.setItem(completedUnreadStorageKey, String(hasUnread))
  } catch (error) {
    console.error("Failed to save completed unread state:", error)
  }
}

type NavigationStore = {
  currentCategory: PageCategory
  currentView: ViewType
  selectedTaskGid: string | null
  categoryUpdates: CategoryUpdates
  selectCategory: (category: PageCategory) => void
  showSettings: () => void
  backToList: () => void
  selectTask: (gid: string) => void
  incrementCategoryUpdate: (category: PageCategory, amount?: number) => void
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  currentCategory: "downloading",
  currentView: "list",
  selectedTaskGid: null,
  categoryUpdates: {
    downloading: 0,
    completed: loadCompletedUnread() ? 1 : 0,
    all: 0,
    deleted: 0,
  },

  selectCategory: (category) => {
    if (category === "completed") {
      saveCompletedUnread(false)
    }

    set((state) => ({
      currentCategory: category,
      currentView: "list",
      selectedTaskGid: null,
      categoryUpdates: {
        ...state.categoryUpdates,
        [category]: 0,
      },
    }))
  },

  showSettings: () => {
    set({ currentView: "settings", selectedTaskGid: null })
  },

  backToList: () => {
    set({ currentView: "list", selectedTaskGid: null })
  },

  selectTask: (gid) => {
    set({ selectedTaskGid: gid })
  },

  incrementCategoryUpdate: (category, amount = 1) => {
    if (category === "completed" && amount > 0) {
      saveCompletedUnread(true)
    }

    set((state) => ({
      categoryUpdates: {
        ...state.categoryUpdates,
        [category]:
          category === "completed"
            ? 1
            : state.categoryUpdates[category] + amount,
      },
    }))
  },
}))
