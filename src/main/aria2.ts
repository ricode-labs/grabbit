import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process"
import { app, Notification } from "electron"
import fs from "node:fs/promises"

import { buildSchedulerGlobalOptions } from "../shared/grabbit"
import {
  aria2StartupArgs,
} from "./aria2.conf"
import { getMainWindow } from "./app-state"
import { downloadDirectoryPath, getAria2Executable } from "./paths"
import { readPreferences, readSchedulerRule } from "./stores"
import type { Aria2Task, JsonRpcFailure, JsonRpcSuccess } from "./types"

let aria2Process: ChildProcessWithoutNullStreams | null = null
let schedulerTimer: NodeJS.Timeout | null = null
let taskMonitorTimer: NodeJS.Timeout | null = null
let completedNotificationPrimed = false
const notifiedCompletedGids = new Set<string>()

export const isAria2Running = () => Boolean(aria2Process)

export const callAria2 = async <T = unknown>(
  method: string,
  params: unknown[] = []
): Promise<T> => {
  const response = await fetch(ARIA2_RPC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: crypto.randomUUID(),
      jsonrpc: "2.0",
      method,
      params: [`token:${ARIA2_RPC_SECRET}`, ...params],
    }),
  })

  if (!response.ok) {
    throw new Error(
      `aria2 RPC failed: ${response.status} ${response.statusText}`
    )
  }

  const data = (await response.json()) as JsonRpcSuccess<T> | JsonRpcFailure
  if ("error" in data) {
    throw new Error(data.error.message)
  }

  return data.result
}

export const applySchedulerRule = async () => {
  if (!aria2Process) {
    return
  }

  const [preferences, schedulerRule] = await Promise.all([
    readPreferences(),
    readSchedulerRule(),
  ])
  const nextOptions = buildSchedulerGlobalOptions(schedulerRule, preferences)

  await callAria2("aria2.changeGlobalOption", [nextOptions])
}

const ensureSchedulerTimer = () => {
  if (schedulerTimer) {
    return
  }

  schedulerTimer = setInterval(() => {
    void applySchedulerRule().catch((error) => {
      console.error("Failed to apply scheduler rule", error)
    })
  }, 60_000)
}

const clearSchedulerTimer = () => {
  if (schedulerTimer) {
    clearInterval(schedulerTimer)
    schedulerTimer = null
  }
}

const updateTaskProgressAndNotifications = async () => {
  const mainWindow = getMainWindow()
  if (!mainWindow || !aria2Process) {
    return
  }

  const preferences = await readPreferences()

  if (preferences.showDockProgress) {
    const activeTasks = await callAria2<Aria2Task[]>("aria2.tellActive", [
      ["gid", "totalLength", "completedLength"],
    ])
    const total = activeTasks.reduce(
      (sum, task) => sum + Number(task.totalLength || 0),
      0
    )
    const completed = activeTasks.reduce(
      (sum, task) => sum + Number(task.completedLength || 0),
      0
    )
    mainWindow.setProgressBar(total > 0 ? Math.min(1, completed / total) : -1)
  } else {
    mainWindow.setProgressBar(-1)
  }

  if (!preferences.notifyOnDownloadComplete || !Notification.isSupported()) {
    return
  }

  const stoppedTasks = await callAria2<Aria2Task[]>("aria2.tellStopped", [
    0,
    50,
    ["gid", "status", "files", "bittorrent"],
  ])
  const completedTasks = stoppedTasks.filter(
    (task) => task.status === "complete"
  )

  if (!completedNotificationPrimed) {
    completedTasks.forEach((task) => notifiedCompletedGids.add(task.gid))
    completedNotificationPrimed = true
    return
  }

  for (const task of completedTasks) {
    if (notifiedCompletedGids.has(task.gid)) {
      continue
    }
    notifiedCompletedGids.add(task.gid)
    new Notification({
      title: "下载完成",
      body: task.bittorrent?.info?.name || task.files?.[0]?.path || task.gid,
    }).show()
  }
}

const ensureTaskMonitorTimer = () => {
  if (taskMonitorTimer) {
    return
  }

  taskMonitorTimer = setInterval(() => {
    void updateTaskProgressAndNotifications().catch((error) => {
      console.error("Failed to update task progress/notifications", error)
    })
  }, 2_000)
}

const clearTaskMonitorTimer = () => {
  if (taskMonitorTimer) {
    clearInterval(taskMonitorTimer)
    taskMonitorTimer = null
  }
  getMainWindow()?.setProgressBar(-1)
}

export async function startAria2() {
  if (aria2Process) {
    return
  }

  const aria2Path = getAria2Executable()
  // const preferences = await readPreferences()
  // const schedulerRule = await readSchedulerRule()
  // const downloadDir = preferences.downloadDir
  await fs.mkdir(downloadDirectoryPath, { recursive: true })
  await fs.mkdir(app.getPath("userData"), { recursive: true })

  aria2Process = spawn(
    aria2Path,
    aria2StartupArgs,
    { stdio: "pipe" }
  )

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
  clearSchedulerTimer()
  clearTaskMonitorTimer()
}
