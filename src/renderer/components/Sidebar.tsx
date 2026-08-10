import React from "react"
import { List, Settings, Trash2 } from "lucide-react"
import { useUI } from "../context/useUI"
import { useNavigationStore } from "../stores/useNavigationStore"
import { useUpdateStore } from "../stores/useUpdateStore"
import faviconUrl from "../assets/favicon.webp"
import logoUrl from "../assets/logo.svg"
import sidebarBgUrl from "../assets/sidebar-bg.webp"

export type CategoryType = "downloading" | "completed" | "all" | "deleted"

export const Sidebar: React.FC = () => {
  const { t } = useUI()
  const currentCategory = useNavigationStore((state) => state.currentCategory)
  const currentView = useNavigationStore((state) => state.currentView)
  const selectCategory = useNavigationStore((state) => state.selectCategory)
  const showSettings = useNavigationStore((state) => state.showSettings)
  const categoryUpdates = useNavigationStore((state) => state.categoryUpdates)
  const hasUpdate = useUpdateStore((state) =>
    Boolean(state.updateState?.available)
  )

  const categories = [
    {
      id: "downloading" as CategoryType,
      label: t("downloading"),
      icon: null,
      count: categoryUpdates.downloading,
    },
    {
      id: "completed" as CategoryType,
      label: t("completed"),
      icon: null,
      count: categoryUpdates.completed,
    },
    {
      id: "all" as CategoryType,
      label: t("allTasks"),
      icon: List,
      count: categoryUpdates.all,
    },
    {
      id: "deleted" as CategoryType,
      label: t("trash"),
      icon: Trash2,
      count: categoryUpdates.deleted,
    },
  ]

  const activeStyle =
    "bg-[#FFE6EC] text-[#FF5C78] shadow-[0_10px_22px_rgba(255,124,148,0.18)] border-[#FFD5DE]"
  const inactiveStyle =
    "text-[#6B5448] hover:bg-[#FFF1F4] hover:text-[#FF5C78] border-transparent"

  return (
    <aside className="flex h-full w-[176px] flex-shrink-0 flex-col border-r border-[#F2DED6] bg-[#FFFBF8]/95">
      <div className="flex h-[78px] items-center gap-2 px-5">
        <div className="flex h-12 w-12 items-center justify-center">
          <img
            src={logoUrl}
            alt="Grabbit"
            className="h-12 w-12 object-contain"
          />
        </div>
        <span className="text-[22px] leading-none font-semibold text-[#6B5448]">
          grabbit
        </span>
      </div>

      <div className="flex-1 space-y-2 overflow-hidden px-4 py-1">
        {categories.map((category) => {
          const Icon = category.icon
          const isActive =
            (currentView === "list" || currentView === "detail") &&
            currentCategory === category.id

          return (
            <button
              key={category.id}
              onClick={() => selectCategory(category.id)}
              className={`relative flex h-9 w-full items-center gap-3 rounded-[12px] border px-3 text-[13px] font-medium transition-all duration-200 ${
                isActive ? activeStyle : inactiveStyle
              }`}
            >
              {Icon ? (
                <Icon
                  size={20}
                  strokeWidth={1.8}
                  className="flex-shrink-0 text-[#8B6A5D]"
                />
              ) : (
                <img
                  src={faviconUrl}
                  alt=""
                  className="h-[22px] w-[22px] flex-shrink-0 object-contain"
                />
              )}
              <span className="min-w-0 flex-1 text-left whitespace-nowrap">
                {category.label}
              </span>
              {category.count > 0 && (
                <span
                  className={`ml-auto flex min-w-[20px] justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                    isActive
                      ? "bg-[#FF89A0] text-white"
                      : "bg-[#F3ECE7] text-[#9B857A]"
                  } animate-in duration-200 zoom-in-50`}
                >
                  {category.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div
        className="mx-6 mb-5 h-[88px] bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${sidebarBgUrl})` }}
        aria-hidden="true"
      />

      <div className="px-4 pb-4">
        <button
          onClick={showSettings}
          className={`relative flex h-9 w-full items-center gap-3 rounded-[12px] border px-3 text-[13px] font-medium transition-all duration-200 ${
            currentView === "settings" ? activeStyle : inactiveStyle
          }`}
        >
          <Settings
            size={20}
            strokeWidth={1.8}
            className="flex-shrink-0 text-[#8B6A5D]"
          />
          <span className="whitespace-nowrap">{t("settings")}</span>
          {hasUpdate && (
            <span className="ml-auto h-2.5 w-2.5 rounded-full bg-[#E85068] ring-2 ring-white" />
          )}
        </button>
      </div>
    </aside>
  )
}
