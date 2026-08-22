import { app, clipboard, Notification, shell } from "electron"
import { dialog, ipcMain } from "electron/main"
import { parse } from "content-disposition"
import ky from "ky"
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
  ChangePositionPayload,
  HttpInfo,
  TellRangePayload,
  TorrentInfo,
  LaunchInput,
} from "../shared/aria2"
import { takePendingLaunchInputs } from "./protocol"
import type { Preferences } from "../shared/preferences"
import { pathExists, readFile } from "fs-extra"
import {
  closeWindow,
  getMainWindow,
  maximizeWindow,
  minimizeWindow,
  showWindow,
} from "./window"
import { getPreferences, savePreferences } from "./preferences"
import { updateTrayMenu } from "./tray"
import { trayIconPath } from "./paths"
import { rmdir, stat, statfs, unlink } from "node:fs/promises"
import { basename, extname, relative, resolve, sep } from "node:path"
import parseTorrent from "parse-torrent"

const notifications = new Set<Notification>()

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
      const file = await readFile(payload.torrentPath)
      const gid = await callAria2<string>("aria2.addTorrent", [
        file.toString("base64"),
        [],
        payload.options,
      ])
      const cleanupUnselectedFilesFromTask = async () => {
        try {
          const task = await callAria2<Aria2Status>("aria2.tellStatus", [gid])
          const taskDir = resolve(task.dir)
          const unselectedFiles = task.files.filter(
            (file) => file.selected === "false"
          )

          const removeEmptyParentDirectories = async (filePath: string) => {
            let current = resolve(filePath, "..")

            while (current !== taskDir) {
              const relativePath = relative(taskDir, current)
              if (
                !relativePath ||
                relativePath.startsWith(`..${sep}`) ||
                relativePath === ".."
              ) {
                break
              }

              try {
                await rmdir(current)
              } catch (error) {
                const code = (error as NodeJS.ErrnoException).code
                if (code === "ENOENT") {
                  current = resolve(current, "..")
                  continue
                }
                if (code === "ENOTEMPTY") {
                  break
                }
                console.warn(
                  "Failed to remove empty torrent directory",
                  current,
                  error
                )
                break
              }

              current = resolve(current, "..")
            }
          }

          for (const file of unselectedFiles) {
            const filePath = resolve(taskDir, file.path)
            try {
              const fileStat = await stat(filePath)
              if (fileStat.isFile()) {
                await unlink(filePath)
                await removeEmptyParentDirectories(filePath)
              }
            } catch (error) {
              if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
                console.warn(
                  `Failed to remove torrent placeholder: ${filePath}`,
                  error
                )
              }
            }
          }
        } catch (error) {
          console.warn("Failed to inspect torrent files after adding", error)
        }
      }
      setImmediate(() => {
        cleanupUnselectedFilesFromTask().catch((error) => {
          console.warn("Unexpected torrent placeholder cleanup failure", error)
        })
      })
      return gid
    }
  )

  ipcMain.handle(
    "aria2.addMetalink",
    async (_event, payload: AddMetalinkPayload) => {
      const file = await readFile(payload.metalinkPath)
      return callAria2<string[]>("aria2.addMetalink", [
        file.toString("base64"),
        payload.options,
      ])
    }
  )

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
      return await callAria2<Aria2Status[]>("aria2.tellStopped", [
        payload.offset,
        payload.num,
      ])
    }
  )

  ipcMain.handle(
    "aria2.changePosition",
    async (_event, payload: ChangePositionPayload) => {
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
      return await callAria2<[number, number]>("aria2.changeUri", [
        payload.gid,
        payload.fileIndex,
        payload.delUris,
        payload.addUris,
      ])
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

  ipcMain.handle("grabbit.selectFolder", async () => {
    const result = await dialog.showOpenDialog(getMainWindow()!, {
      properties: ["openDirectory", "createDirectory"],
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle("grabbit.takePendingLaunchInputs", () => {
    return takePendingLaunchInputs() satisfies LaunchInput[]
  })

  ipcMain.handle("grabbit.selectTorrentFile", async () => {
    const result = await dialog.showOpenDialog(getMainWindow()!, {
      properties: ["openFile"],
      filters: [{ name: "Torrent", extensions: ["torrent"] }],
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle("grabbit.getClipboardText", () => clipboard.readText())

  ipcMain.handle("grabbit.showNotification", (_event, message: string) => {
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: "Grabbit",
        body: message,
        icon: trayIconPath,
      })
      notifications.add(notification)
      notification.on("click", () => {
        showWindow()
        notifications.delete(notification)
      })
      notification.on("close", () => {
        notifications.delete(notification)
      })
      notification.on("failed", () => {
        notifications.delete(notification)
      })
      notification.show()
    }
  })

  ipcMain.handle(
    "grabbit.getTorrentInfo",
    async (_event, torrentPath: string) => {
      const torrent = await parseTorrent(await readFile(torrentPath))
      const filename =
        torrent.name || basename(torrentPath, extname(torrentPath))
      const files = torrent.files?.length
        ? torrent.files.map((file, index) => ({
            index: index + 1,
            path: file.path,
            length: file.length,
          }))
        : [
            {
              index: 1,
              path: filename,
              length: torrent.length || 0,
            },
          ]
      return {
        filename,
        files,
        totalLength: files.reduce((total, file) => total + file.length, 0),
      } satisfies TorrentInfo
    }
  )

  ipcMain.handle(
    "grabbit.getHttpInfo",
    async (_event, url: string): Promise<HttpInfo> => {
      let filename: string
      let contentLength: string | null = null
      try {
        const response = await ky.head(url)
        const contentDisposition = response.headers.get("content-disposition")
        contentLength = response.headers.get("content-length")
        if (contentDisposition) {
          filename = parse(contentDisposition).parameters.filename
        } else {
          url = response.url
        }
      } catch {
        /* empty */
      }
      const parsed = new URL(url)
      filename = basename(parsed.pathname) || parsed.hostname
      return { filename, contentLength }
    }
  )

  // ipcMain.handle("grabbit.getMagnetInfo", async (_event, url: string) => {
  //   const filename = (await parseTorrent(url)).name
  //   return filename
  // })

  ipcMain.handle("grabbit.getDiskSpace", async (_event, dir: string) => {
    const stats = await statfs(dir)
    return stats.bavail * stats.bsize
  })

  ipcMain.handle("grabbit.deleteFile", async (_event, filePath: string) => {
    if (await pathExists(filePath)) {
      await shell.trashItem(filePath)
    }
    const aria2ControlFilePath = `${filePath}.aria2`
    if (await pathExists(aria2ControlFilePath)) {
      await shell.trashItem(aria2ControlFilePath)
    }
  })

  ipcMain.handle("grabbit.openFile", async (_event, filePath: string) => {
    if (await pathExists(filePath)) {
      await shell.openPath(filePath)
    }
  })

  ipcMain.handle("grabbit.showItem", async (_event, filePath: string) => {
    if (await pathExists(filePath)) {
      shell.showItemInFolder(filePath)
    }
  })

  ipcMain.handle("grabbit.openFolder", async (_event, folderPath: string) => {
    if (await pathExists(folderPath)) {
      await shell.openPath(folderPath)
    }
  })

  ipcMain.handle("grabbit.getPreferences", async () => {
    return getPreferences()
  })

  ipcMain.handle("grabbit.getVersion", () => app.getVersion())

  ipcMain.handle("grabbit.checkUpdates", async () => {
    const [currentMajor, currentMinor, currentPatch] = app
      .getVersion()
      .split(".")
      .map(Number)
    const release = await ky
      .get("https://api.github.com/repos/ricode-labs/grabbit/releases/latest")
      .json<{ tag_name: string }>()
    const latestVersion = release.tag_name.slice(1)
    const [latestMajor, latestMinor, latestPatch] = latestVersion
      .split(".")
      .map(Number)

    return {
      latestVersion,
      available:
        latestMajor > currentMajor ||
        (latestMajor === currentMajor && latestMinor > currentMinor) ||
        (latestMajor === currentMajor &&
          latestMinor === currentMinor &&
          latestPatch > currentPatch),
    }
  })

  ipcMain.handle("grabbit.openExternal", async (_event, url: string) => {
    await shell.openExternal(url)
  })

  ipcMain.handle(
    "grabbit.savePreferences",
    async (_event, payload: Preferences) => {
      const preferences = await savePreferences(payload)
      updateTrayMenu()
      return preferences
    }
  )

  ipcMain.handle("grabbit.minimizeWindow", () => {
    minimizeWindow()
  })

  ipcMain.handle("grabbit.maximizeWindow", () => {
    maximizeWindow()
  })

  ipcMain.handle("grabbit.closeWindow", () => {
    closeWindow()
  })
}
