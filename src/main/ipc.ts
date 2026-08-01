import { clipboard, shell } from "electron"
import { dialog, ipcMain } from "electron/main"
import { callAria2 } from "./aria2"
import parseTorrent from "parse-torrent"

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
  TellRangePayload,
  Preferences,
} from "../shared/types"
import { readFile } from "fs-extra"
import fs from "node:fs/promises"
import path from "node:path"
import { closeWindow, getMainWindow, maximizeWindow, minimizeWindow } from "./window"
import { getPreferences, savePreferences } from "./preferences"

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
      return callAria2<string>("aria2.addTorrent", [
        file.toString("base64"),
        [],
        payload.options,
      ])
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

  ipcMain.handle("grabbit.selectFolder", async () => {
    const result = await dialog.showOpenDialog(getMainWindow(), {
      properties: ["openDirectory", "createDirectory"],
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle("grabbit.selectTorrentFile", async () => {
    const result = await dialog.showOpenDialog(getMainWindow(), {
      properties: ["openFile"],
      filters: [{ name: "Torrent", extensions: ["torrent"] }],
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle("grabbit.getClipboardText", () => clipboard.readText())

  ipcMain.handle(
    "grabbit.getTorrentInfo",
    async (_event, torrentPath: string) => {
      try {
        const torrent = await readFile(torrentPath)
        const parsed = parseTorrent(torrent)
        if (!("files" in parsed) || !parsed.files?.length) {
          throw new Error("Torrent file does not contain file metadata")
        }

        const files = parsed.files.map((file, index) => ({
          name:
            file.path ||
            file.name ||
            `${parsed.name || "torrent"}-${index + 1}`,
          selected: true,
          isExpanded: false,
          index: String(index + 1),
          isFile: true,
          length: file.length,
        }))

        return {
          success: true,
          info: {
            name:
              parsed.name ||
              path.basename(torrentPath, path.extname(torrentPath)),
            files,
            isMultiFile: files.length > 1,
            totalSize:
              parsed.length ??
              files.reduce((sum, file) => sum + file.length, 0),
          },
        }
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to parse torrent",
        }
      }
    }
  )

  ipcMain.handle(
    "electronAPI.getDownloadMetadata",
    async (_event, url: string) => {
      try {
        const response = await fetch(url, {
          method: "HEAD",
          redirect: "follow",
        })
        const contentDisposition =
          response.headers.get("content-disposition") || ""
        const fileNameMatch = contentDisposition.match(
          /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i
        )
        const fileName = fileNameMatch?.[1]
          ? decodeURIComponent(fileNameMatch[1])
          : fileNameMatch?.[2] ||
            path.basename(new URL(response.url || url).pathname)

        return {
          success: true,
          metadata: {
            fileName,
            totalLength: Number(response.headers.get("content-length")) || 0,
            contentType: response.headers.get("content-type") || undefined,
            acceptRanges: response.headers.get("accept-ranges") === "bytes",
            finalUrl: response.url,
            statusCode: response.status,
          },
        }
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to fetch metadata",
        }
      }
    }
  )

  ipcMain.handle("electronAPI.getDiskSpace", async (_event, dir: string) => {
    try {
      const stats = await fs.statfs(dir)
      return {
        success: true,
        available: stats.bavail * stats.bsize,
        total: stats.blocks * stats.bsize,
        path: dir,
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get disk space",
      }
    }
  })

  ipcMain.handle(
    "grabbit.deleteDownloadFile",
    async (_event, filePath: string) => {
      await shell.trashItem(filePath)
      return true
    }
  )

  ipcMain.handle("grabbit.getPreferences", async () => {
    return getPreferences()
  })

  ipcMain.handle(
    "grabbit.savePreferences",
    async (
      _event,
      payload: Preferences
    ) => {
      savePreferences(payload)
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
