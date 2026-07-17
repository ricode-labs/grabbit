import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process"
import ky from "ky"

// import { buildSchedulerGlobalOptions } from "../shared/grabbit"
// import { getMainWindow } from "./app-state"
import { getAria2Executable } from "./paths"
// import { readPreferences, readSchedulerRule } from "./stores"
import type { JsonRpcFailure, JsonRpcSuccess } from "./types"
import { aria2StartupArgs } from "./aria2.conf"
import { createServer } from "node:net"
let aria2Process: ChildProcessWithoutNullStreams | null = null
let rpcPort: number | null = null
let rpcSecret = ""
// let schedulerTimer: NodeJS.Timeout | null = null
// let taskMonitorTimer: NodeJS.Timeout | null = null
// let completedNotificationPrimed = false
// const notifiedCompletedGids = new Set<string>()

export const isAria2Running = () => Boolean(aria2Process)

function getAvailablePort() {
  return new Promise<number>((resolve, reject) => {
    const server = createServer()
    server.once("error", reject)
    server.listen(0, "127.0.0.1", () => {
      const address = server.address()
      if (!address || typeof address === "string") {
        server.close()
        reject(new Error("Failed to get available aria2 RPC port"))
        return
      }
      const port = address.port
      server.close(() => resolve(port))
    })
  })
}

export async function callAria2<T = unknown>(
  method: string,
  params: unknown[] = []
): Promise<T> {
  const data = await ky
    .post(`http://127.0.0.1:${rpcPort}/jsonrpc`, {
      json: {
        id: crypto.randomUUID(),
        jsonrpc: "2.0",
        method,
        params: [`token:${rpcSecret}`, ...params],
      },
    })
    .json<JsonRpcSuccess<T> | JsonRpcFailure>()
  if ("error" in data) {
    throw new Error(data.error.message)
  }
  return data.result
}

export async function startAria2() {
  if (aria2Process) {
    return
  }

  rpcPort = await getAvailablePort()
  rpcSecret = crypto.randomUUID()
  const aria2Path = getAria2Executable()
  // const preferences = await readPreferences()
  // const schedulerRule = await readSchedulerRule()
  // const downloadDir = preferences.downloadDir

  aria2Process = spawn(aria2Path, await aria2StartupArgs(rpcPort, rpcSecret), {
    stdio: "pipe",
  })

  aria2Process.on("exit", () => {
    aria2Process = null
  })

  aria2Process.stderr.on("data", (chunk) => {
    console.error(`[aria2] ${chunk}`)
  })

  
  // ensureSchedulerTimer()
  // ensureTaskMonitorTimer()

  // if (preferences.resumeAllOnLaunch) {
  //   void callAria2("aria2.unpauseAll").catch((error) => {
  //     console.error("Failed to resume all tasks on launch", error)
  //   })
  // }

  // void updateTaskProgressAndNotifications().catch((error) => {
  //   console.error("Failed to update task progress/notifications", error)
  // })
}

export async function stopAria2() {
  if (!aria2Process) {
    return
  }

  try {
    await callAria2("aria2.saveSession")
  } catch (error) {
    console.error("Failed to save aria2 session", error)
  }

  aria2Process.kill()
  aria2Process = null
}
