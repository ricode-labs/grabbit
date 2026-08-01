import React from "react"
import { Minus, Square, X } from "lucide-react"

export const WindowControls: React.FC = () => {
  const handleMinimize = async () => {
    await window.grabbit.minimizeWindow()
  }

  const handleMaximize = async () => {
    await window.grabbit.maximizeWindow()
  }

  const handleClose = async () => {
    await window.grabbit.closeWindow()
  }

  return (
    <div
      className="flex items-center gap-4 px-5 py-3"
      style={{ WebkitAppRegion: "no-drag" } as any}
    >
      <button
        onClick={handleMinimize}
        className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-md text-[#2D2522] transition-colors hover:bg-[#FFF1F4] hover:text-[#FF5C78]"
      >
        <Minus size={15} strokeWidth={2.2} />
      </button>
      <button
        onClick={handleMaximize}
        className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-md text-[#2D2522] transition-colors hover:bg-[#FFF1F4] hover:text-[#FF5C78]"
      >
        <Square size={14} strokeWidth={2.1} />
      </button>
      <button
        onClick={handleClose}
        className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-md text-[#2D2522] transition-colors hover:bg-[#FFE4E4] hover:text-[#E85C61]"
      >
        <X size={16} strokeWidth={2.1} />
      </button>
    </div>
  )
}
