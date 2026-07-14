import { BrowserWindow, dialog, ipcMain, shell } from "electron"
import fs from "node:fs/promises"

import {
  buildGlobalAria2Options,
  type GrabbitPreferences,
  type TaskSchedulerRule,
} from "../shared/grabbit"
import { applySchedulerRule, callAria2, isAria2Running } from "./aria2"
import { getMainWindow } from "./app-state"
import {
  getDefaultDownloadDir,
  getEnginePaths,
  readPreferences,
  readSchedulerRule,
  writePreferences,
  writeSchedulerRule,
} from "./stores"
import {
  deleteTaskFiles,
  fetchTasks,
  normalizeOptions,
  parseTorrentFile,
  removeTask,
} from "./tasks"
import type {
  AddTaskPayload,
  AddTorrentPayload,
  Aria2Task,
  RestartTaskPayload,
} from "./types"

export const registerIpcHandlers = () => {
  ipcMain.handle(
    "tasks:list",
    (_event, status: "active" | "waiting" | "stopped") => fetchTasks(status)
  )

  ipcMain.handle("tasks:get-peers", (_event, gid: string) =>
    callAria2("aria2.getPeers", [gid])
  )

  ipcMain.handle("tasks:get-servers", (_event, gid: string) =>
    callAria2("aria2.getServers", [gid])
  )

  ipcMain.handle("tasks:add-uri", async (_event, payload: AddTaskPayload) => {
    const options = normalizeOptions(payload.options)
    const gids = await Promise.all(
      payload.uris.map((uri) =>
        callAria2<string>("aria2.addUri", [[uri], options])
      )
    )

    return gids
  })

  ipcMain.handle(
    "tasks:add-torrent",
    async (_event, payload: AddTorrentPayload) => {
      const options = normalizeOptions(payload.options)
      const torrent = await fs.readFile(payload.torrentPath)
      return callAria2<string>("aria2.addTorrent", [
        torrent.toString("base64"),
        [],
        options,
      ])
    }
  )

  ipcMain.handle("torrent:parse", (_event, torrentPath: string) =>
    parseTorrentFile(torrentPath)
  )

  ipcMain.handle(
    "tasks:restart",
    async (_event, payload: RestartTaskPayload) => {
      const options = normalizeOptions({
        dir: payload.task.dir,
        ...payload.options,
      })
      const uris = payload.task.files
        ?.flatMap((file) => file.uris?.map((uri) => uri.uri) ?? [])
        .filter(
          (uri) => /^(https?|ftp):\/\//i.test(uri) || /^magnet:\?/i.test(uri)
        )

      if (uris?.length) {
        return Promise.all(
          uris.map((uri) => callAria2<string>("aria2.addUri", [[uri], options]))
        )
      }

      throw new Error("这个任务没有可用于重新下载的原始链接")
    }
  )

  ipcMain.handle("tasks:purge-results", () =>
    callAria2("aria2.purgeDownloadResult")
  )

  ipcMain.handle("app:select-torrent", async () => {
    const window = BrowserWindow.getFocusedWindow() ?? getMainWindow()
    const result = await dialog.showOpenDialog(window!, {
      properties: ["openFile"],
      filters: [{ name: "Torrent", extensions: ["torrent"] }],
    })

    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle("tasks:pause", (_event, gid: string) =>
    callAria2("aria2.pause", [gid])
  )

  ipcMain.handle("tasks:resume", (_event, gid: string) =>
    callAria2("aria2.unpause", [gid])
  )

  ipcMain.handle(
    "tasks:remove",
    (_event, taskOrGid: Aria2Task | string, deleteFiles = false) => {
      if (typeof taskOrGid === "string") {
        return callAria2("aria2.remove", [taskOrGid])
      }

      return removeTask(taskOrGid, deleteFiles)
    }
  )

  ipcMain.handle(
    "tasks:remove-result",
    (_event, taskOrGid: Aria2Task | string, deleteFiles = false) => {
      if (typeof taskOrGid === "string") {
        return callAria2("aria2.removeDownloadResult", [taskOrGid])
      }

      return removeTask(taskOrGid, deleteFiles)
    }
  )

  ipcMain.handle("tasks:delete-files", (_event, task: Aria2Task) =>
    deleteTaskFiles(task)
  )

  ipcMain.handle("tasks:pause-all", () => callAria2("aria2.pauseAll"))
  ipcMain.handle("tasks:resume-all", () => callAria2("aria2.unpauseAll"))

  ipcMain.handle("app:select-directory", async () => {
    const window = BrowserWindow.getFocusedWindow() ?? getMainWindow()
    const result = await dialog.showOpenDialog(window!, {
      defaultPath: await getDefaultDownloadDir(),
      properties: ["openDirectory", "createDirectory"],
    })

    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle("app:open-path", async (_event, targetPath: string) => {
    if (!targetPath) {
      return ""
    }

    const stats = await fs.stat(targetPath).catch(() => null)
    if (stats?.isFile()) {
      shell.showItemInFolder(targetPath)
      return ""
    }

    return shell.openPath(targetPath)
  })

  ipcMain.handle("app:get-engine-paths", () => getEnginePaths())
  ipcMain.handle("app:get-preferences", () => readPreferences())
  ipcMain.handle(
    "app:set-preferences",
    async (_event, preferences: GrabbitPreferences) => {
      const savedPreferences = await writePreferences(preferences)
      if (isAria2Running()) {
        await fs.mkdir(savedPreferences.downloadDir, { recursive: true })
        await callAria2("aria2.changeGlobalOption", [
          buildGlobalAria2Options(savedPreferences),
        ])
      }
      return savedPreferences
    }
  )
  ipcMain.handle("app:get-scheduler", () => readSchedulerRule())
  ipcMain.handle(
    "app:set-scheduler",
    async (_event, rule: TaskSchedulerRule) => {
      const savedRule = await writeSchedulerRule(rule)
      await applySchedulerRule()
      return savedRule
    }
  )
  ipcMain.handle("app:get-default-dir", () => getDefaultDownloadDir())
}
