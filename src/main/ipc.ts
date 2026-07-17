import { ipcMain } from "electron/main"
import { callAria2 } from "./aria2"
import type {
  AddMetalinkPayload,
  AddTorrentPayload,
  AddUriPayload,
  Aria2File,
  Aria2GlobalStat,
  Aria2Peer,
  Aria2Server,
  Aria2SessionInfo,
  Aria2Status,
  Aria2Uri,
  Aria2Version,
  ChangeOptionPayload,
  ChangeUriPayload,
  GidPayload,
  Ok,
  Options,
  PositionPayload,
  TellRangePayload,
  TellStatusPayload,
} from "../shared/aria2"
import { readFile } from "node:fs/promises"

export function registerIpcHandlers() {
  ipcMain.handle("aria2.addUri", async (_event, payload: AddUriPayload) => {
    return await callAria2<string>("aria2.addUri", [
      payload.uris,
      payload.options,
    ])
  })

  ipcMain.handle(
    "aria2.addTorrent",
    async (_event, payload: AddTorrentPayload) => {
      const torrent = await readFile(payload.torrentPath)
      return callAria2<string>("aria2.addTorrent", [
        torrent.toString("base64"),
        [],
        payload.options,
      ])
    }
  )

  ipcMain.handle(
    "aria2.addMetalink",
    async (_event, payload: AddMetalinkPayload) => {
      const metalink = await readFile(payload.metalinkPath)
      return callAria2<string[]>("aria2.addMetalink", [
        metalink.toString("base64"),
        payload.options,
      ])
    }
  )

  // ipcMain.handle("torrent:parse", (_event, torrentPath: string) =>
  //   parseTorrentFile(torrentPath)
  // )

  // ipcMain.handle(
  //   "tasks:restart",
  //   async (_event, payload: RestartTaskPayload) => {
  //     const options = normalizeOptions({
  //       dir: payload.task.dir,
  //       ...payload.options,
  //     })
  //     const uris = payload.task.files
  //       ?.flatMap((file) => file.uris?.map((uri) => uri.uri) ?? [])
  //       .filter(
  //         (uri) => /^(https?|ftp):\/\//i.test(uri) || /^magnet:\?/i.test(uri)
  //       )

  //     if (uris?.length) {
  //       return Promise.all(
  //         uris.map((uri) => callAria2<string>("aria2.addUri", [[uri], options]))
  //       )
  //     }

  //     throw new Error("这个任务没有可用于重新下载的原始链接")
  //   }
  // )

  // ipcMain.handle("app:select-torrent", async () => {
  //   const window = BrowserWindow.getFocusedWindow() ?? getMainWindow()
  //   const result = await dialog.showOpenDialog(window!, {
  //     properties: ["openFile"],
  //     filters: [{ name: "Torrent", extensions: ["torrent"] }],
  //   })

  //   return result.canceled ? null : result.filePaths[0]
  // })

  ipcMain.handle("aria2.remove", async (_event, payload: GidPayload) => {
    return await callAria2<string>("aria2.remove", [payload.gid])
  })

  ipcMain.handle("aria2.forceRemove", async (_event, payload: GidPayload) => {
    return await callAria2<string>("aria2.forceRemove", [payload.gid])
  })

  ipcMain.handle("aria2.pause", async (_event, payload: GidPayload) => {
    return await callAria2<string>("aria2.pause", [payload.gid])
  })

  ipcMain.handle("aria2.pauseAll", async () => {
    return await callAria2<Ok>("aria2.pauseAll")
  })

  ipcMain.handle("aria2.forcePause", async (_event, payload: GidPayload) => {
    return await callAria2<string>("aria2.forcePause", [payload.gid])
  })

  ipcMain.handle("aria2.forcePauseAll", async () => {
    return await callAria2<Ok>("aria2.forcePauseAll")
  })

  ipcMain.handle("aria2.unpause", async (_event, payload: GidPayload) => {
    return await callAria2<string>("aria2.unpause", [payload.gid])
  })

  ipcMain.handle("aria2.unpauseAll", async () => {
    return await callAria2<Ok>("aria2.unpauseAll")
  })

  ipcMain.handle("aria2.tellStatus", async (_event, payload: GidPayload) => {
    return await callAria2<Aria2Status>("aria2.tellStatus", [payload.gid])
  })

  ipcMain.handle("aria2.getUris", async (_event, payload: GidPayload) => {
    return await callAria2<Aria2Uri[]>("aria2.getUris", [payload.gid])
  })

  ipcMain.handle("aria2.getFiles", async (_event, payload: GidPayload) => {
    return await callAria2<Aria2File[]>("aria2.getFiles", [payload.gid])
  })

  ipcMain.handle("aria2.getPeers", async (_event, payload: GidPayload) => {
    return await callAria2<Aria2Peer[]>("aria2.getPeers", [payload.gid])
  })

  ipcMain.handle("aria2.getServers", async (_event, payload: GidPayload) => {
    return await callAria2<Aria2Server[]>("aria2.getServers", [payload.gid])
  })

  ipcMain.handle("aria2.tellActive", async () => {
    return await callAria2<Aria2Status[]>("aria2.tellActive")
  })

  ipcMain.handle(
    "aria2.tellWaiting",
    async (_event, payload: TellRangePayload) => {
      return await callAria2<Aria2Status[]>("aria2.tellWaiting", [
        payload.offset,
        payload.num,
      ])
    }
  )

  ipcMain.handle(
    "aria2.tellStopped",
    async (_event, payload: TellRangePayload) => {
      return await callAria2<Aria2Status[]>(
        "aria2.tellStopped",
        [payload.offset, payload.num, payload.keys].filter(
          (param) => param !== undefined
        )
      )
    }
  )

  ipcMain.handle(
    "aria2.changePosition",
    async (_event, payload: PositionPayload) => {
      return await callAria2<number>("aria2.changePosition", [
        payload.gid,
        payload.pos,
        payload.how,
      ])
    }
  )

  ipcMain.handle(
    "aria2.changeUri",
    async (_event, payload: ChangeUriPayload) => {
      return await callAria2<[number, number]>(
        "aria2.changeUri",
        [
          payload.gid,
          payload.fileIndex,
          payload.delUris,
          payload.addUris,
          payload.position,
        ].filter((param) => param !== undefined)
      )
    }
  )

  ipcMain.handle("aria2.getOption", async (_event, payload: GidPayload) => {
    return await callAria2<Options>("aria2.getOption", [payload.gid])
  })

  ipcMain.handle(
    "aria2.changeOption",
    async (_event, payload: ChangeOptionPayload) => {
      return await callAria2<Ok>("aria2.changeOption", [
        payload.gid,
        payload.options,
      ])
    }
  )

  ipcMain.handle("aria2.getGlobalOption", async () => {
    return await callAria2<Options>("aria2.getGlobalOption")
  })

  ipcMain.handle(
    "aria2.changeGlobalOption",
    async (_event, payload: Options) => {
      // const savedPreferences = await writePreferences(preferences)
      //   if (isAria2Running()) {
      //     await fs.mkdir(savedPreferences.downloadDir, { recursive: true })
      //     await callAria2("aria2.changeGlobalOption", [
      //       buildGlobalAria2Options(savedPreferences),
      //     ])
      //   }
      //   return savedPreferences
      return await callAria2<Ok>("aria2.changeGlobalOption", [payload])
    }
  )

  ipcMain.handle("aria2.getGlobalStat", async () => {
    return await callAria2<Aria2GlobalStat>("aria2.getGlobalStat")
  })

  ipcMain.handle("aria2.purgeDownloadResult", async () => {
    return await callAria2<Ok>("aria2.purgeDownloadResult")
  })

  ipcMain.handle(
    "aria2.removeDownloadResult",
    async (_event, payload: GidPayload) => {
      return await callAria2<Ok>("aria2.removeDownloadResult", [payload.gid])
    }
  )

  ipcMain.handle("aria2.getVersion", async () => {
    return await callAria2<Aria2Version>("aria2.getVersion")
  })

  ipcMain.handle("aria2.getSessionInfo", async () => {
    return await callAria2<Aria2SessionInfo>("aria2.getSessionInfo")
  })

  ipcMain.handle("aria2.shutdown", async () => {
    return await callAria2<Ok>("aria2.shutdown")
  })

  ipcMain.handle("aria2.forceShutdown", async () => {
    return await callAria2<Ok>("aria2.forceShutdown")
  })

  ipcMain.handle("aria2.saveSession", async () => {
    return await callAria2<Ok>("aria2.saveSession")
  })

  // ipcMain.handle("tasks:delete-files", (_event, task: Aria2Task) =>
  //   deleteTaskFiles(task)
  // )

  // ipcMain.handle("app:select-directory", async () => {
  //   const window = BrowserWindow.getFocusedWindow() ?? getMainWindow()
  //   const result = await dialog.showOpenDialog(window!, {
  //     defaultPath: await getDefaultDownloadDir(),
  //     properties: ["openDirectory", "createDirectory"],
  //   })

  //   return result.canceled ? null : result.filePaths[0]
  // })

  // ipcMain.handle("app:open-path", async (_event, targetPath: string) => {
  //   if (!targetPath) {
  //     return ""
  //   }

  //   const stats = await fs.stat(targetPath).catch(() => null)
  //   if (stats?.isFile()) {
  //     shell.showItemInFolder(targetPath)
  //     return ""
  //   }

  //   return shell.openPath(targetPath)
  // })

  // ipcMain.handle("app:get-engine-paths", () => getEnginePaths())
  // ipcMain.handle("app:get-preferences", () => readPreferences())

  // ipcMain.handle("app:get-scheduler", () => readSchedulerRule())
  // ipcMain.handle(
  //   "app:set-scheduler",
  //   async (_event, rule: TaskSchedulerRule) => {
  //     const savedRule = await writeSchedulerRule(rule)
  //     await applySchedulerRule()
  //     return savedRule
  //   }
  // )
  // ipcMain.handle("app:get-default-dir", () => getDefaultDownloadDir())
}
