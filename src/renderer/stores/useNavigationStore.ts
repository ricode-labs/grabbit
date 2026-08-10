import { create } from "zustand"
import type { CategoryUpdates, PageCategory, ViewType } from "../types/app"

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
    completed: 0,
    all: 0,
    deleted: 0,
  },

  selectCategory: (category) => {
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
    set((state) => ({
      categoryUpdates: {
        ...state.categoryUpdates,
        [category]: state.categoryUpdates[category] + amount,
      },
    }))
  },
}))
