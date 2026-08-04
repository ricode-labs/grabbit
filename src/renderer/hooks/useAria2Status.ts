import { useState, useCallback } from "react"
import { useUI } from "../context/UIContext"

export interface Aria2Status {
  connected: boolean
  message: string
}

export function useAria2Status() {
  const { t } = useUI()
  const [aria2Status, setAria2Status] = useState<Aria2Status>({
    connected: false,
    message: t("aria2Checking"),
  })

  const checkAria2Status = useCallback(async () => {
    try {
      await window.aria2.getVersion()
      const status = { connected: true, message: t("aria2Connected") }
      setAria2Status(status)
      return true
    } catch (error) {
      console.error("Failed to check aria2 status:", error)
      setAria2Status({
        connected: false,
        message: t("aria2CheckFailed"),
      })
      return false
    }
  }, [t])

  return { aria2Status, checkAria2Status }
}
