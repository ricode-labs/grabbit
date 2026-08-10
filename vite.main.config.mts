import { defineConfig } from "vite"
import { appId } from "./forge.config.ts"

// https://vitejs.dev/config
export default defineConfig({
  define: {
    __APP_ID__: JSON.stringify(appId),
  },
  build: {
    rollupOptions: {
      external: ["node-portmapping", "registry-js"],
    },
  },
})
