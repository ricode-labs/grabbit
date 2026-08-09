import { useContext } from "react"
import { UIContext } from "./ui-context"

export const useUI = () => {
  const context = useContext(UIContext)
  if (!context) {
    throw new Error("useUI must be used within UIProvider")
  }
  return context
}
