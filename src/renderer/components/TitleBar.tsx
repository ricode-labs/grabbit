import React from "react"
import { WindowControls } from "./WindowControls"

export const TitleBar: React.FC = () => {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] flex h-10 justify-end"
      style={{ WebkitAppRegion: "drag" } as any}
    >
      <div
        className="pointer-events-auto"
        style={{ WebkitAppRegion: "no-drag" } as any}
      >
        <WindowControls />
      </div>
    </div>
  )
}
