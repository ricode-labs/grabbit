import React from "react"
import { Minus, Square, X } from "lucide-react"
import { useUI } from "../context/useUI"

export const WindowControls: React.FC = () => {
  const { t } = useUI()
  const isMacOS = window.grabbit.platform === "darwin"

  const handleMinimize = async () => {
    await window.grabbit.minimizeWindow()
  }

  const handleMaximize = async () => {
    await window.grabbit.maximizeWindow()
  }

  const handleClose = async () => {
    await window.grabbit.closeWindow()
  }

  const closeButton = (
    <button
      onClick={handleClose}
      title={t("close")}
      aria-label={t("close")}
      className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-md text-[#2D2522] transition-colors hover:bg-[#FFE4E4] hover:text-[#E85C61]"
    >
      <X size={16} strokeWidth={2.1} />
    </button>
  )

  const minimizeButton = (
    <button
      onClick={handleMinimize}
      title={t("minimize")}
      aria-label={t("minimize")}
      className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-md text-[#2D2522] transition-colors hover:bg-[#FFF1F4] hover:text-[#FF5C78]"
    >
      <Minus size={15} strokeWidth={2.2} />
    </button>
  )

  const maximizeButton = (
    <button
      onClick={handleMaximize}
      title={t("maximize")}
      aria-label={t("maximize")}
      className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-md text-[#2D2522] transition-colors hover:bg-[#FFF1F4] hover:text-[#FF5C78]"
    >
      <Square size={14} strokeWidth={2.1} />
    </button>
  )

  return (
    <div
      className="flex items-center gap-4 px-5 py-3"
      style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
    >
      {isMacOS ? (
        <>
          {closeButton}
          {minimizeButton}
          {maximizeButton}
        </>
      ) : (
        <>
          {minimizeButton}
          {maximizeButton}
          {closeButton}
        </>
      )}
    </div>
  )
}
