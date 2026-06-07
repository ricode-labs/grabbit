export type Page = "tasks" | "preferences" | "about"

export type Notice = {
  tone: "success" | "error" | "info"
  message: string
}
