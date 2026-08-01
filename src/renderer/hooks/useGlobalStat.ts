import { useState, useCallback } from "react"

export function useGlobalStat() {
  const [globalStat, setGlobalStat] = useState<any>({})

  const refreshGlobalStat = useCallback(async () => {
    try {
      const stat = await window.aria2.getGlobalStat()
      setGlobalStat(stat)
    } catch (error) {
      console.error("Failed to fetch global stat:", error)
      // Set default values when aria2 is not available
      setGlobalStat({
        numActive: 0,
        numWaiting: 0,
        downloadSpeed: 0,
        uploadSpeed: 0,
      })
    }
  }, [])

  return { globalStat, refreshGlobalStat }
}
