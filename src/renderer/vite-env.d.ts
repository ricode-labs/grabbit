import type { grabbitApi } from "../preload/preload"

declare global {
  interface Window {
    grabbit: typeof grabbitApi
  }
}

export {}
