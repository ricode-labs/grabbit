import React from "react"
import { WindowControls } from "./WindowControls"

export const TitleBar: React.FC = () => {
  const isMacOS = window.grabbit.platform === "darwin"

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-[9999] flex h-10 ${
        isMacOS ? "justify-start" : "justify-end"
      }`}
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <div
        className="pointer-events-auto"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <WindowControls />
      </div>
    </div>
  )
}
