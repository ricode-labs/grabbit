import { shell } from "electron"
import fs from "node:fs/promises"
import path from "node:path"
// import parseTorrent from "parse-torrent"

import {
  normalizeAria2Options,
  type ParsedTorrentInfo,
  type TorrentFileEntry,
} from "../shared/grabbit"
import { callAria2 } from "./aria2"
import { downloadDirectoryPath } from "./paths"
import type { Aria2Task, DeleteTaskFilesResult, ParsedTorrent } from "./types"

export const normalizeOptions = normalizeAria2Options

const getFileExtension = (filePath: string) => {
  const extension = path.extname(filePath)
  return extension || ""
}

// export const parseTorrentFile = async (
//   torrentPath: string
// ): Promise<ParsedTorrentInfo> => {
//   const torrent = await fs.readFile(torrentPath)
//   const parsed = parseTorrent(torrent) as ParsedTorrent
//   const filesSource = parsed.files?.length
//     ? parsed.files
//     : [{ path: parsed.name, name: parsed.name, length: parsed.length }]

//   const files: TorrentFileEntry[] = filesSource.map((file, index) => {
//     const filePath =
//       file.path || file.name || `${parsed.name || "torrent"}-${index + 1}`
//     const name = path.basename(filePath)
//     return {
//       index: index + 1,
//       path: filePath,
//       name,
//       extension: getFileExtension(name),
//       length: Number(file.length ?? 0),
//     }
//   })

//   return {
//     name: parsed.name || path.basename(torrentPath),
//     files,
//     totalLength: files.reduce((sum, file) => sum + file.length, 0),
//   }
// }

const isStoppedTask = (task: Pick<Aria2Task, "status">) =>
  task.status === "complete" ||
  task.status === "error" ||
  task.status === "removed"

const isPathInside = (candidatePath: string, parentPath: string) => {
  const relativePath = path.relative(parentPath, candidatePath)
  return (
    relativePath === "" ||
    (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
  )
}

export const deleteTaskFiles = async (
  task: Aria2Task
): Promise<DeleteTaskFilesResult> => {
  const result: DeleteTaskFilesResult = {
    deleted: [],
    skipped: [],
    failed: [],
  }
  const taskDir = path.resolve(task.dir || downloadDirectoryPath)
  const rawPaths = Array.from(
    new Set(task.files?.map((file) => file.path.trim()).filter(Boolean) ?? [])
  )

  if (rawPaths.length === 0) {
    result.skipped.push({
      path: taskDir,
      reason: "这个任务没有可删除的本地文件路径",
    })
    return result
  }

  for (const rawPath of rawPaths) {
    const filePath = path.resolve(rawPath)

    if (!isPathInside(filePath, taskDir)) {
      result.skipped.push({
        path: rawPath,
        reason: "文件路径不在任务保存目录内，已跳过",
      })
      continue
    }

    try {
      const stats = await fs.stat(filePath)
      if (stats.isDirectory()) {
        result.skipped.push({
          path: filePath,
          reason: "为避免误删目录，仅移入任务文件",
        })
        continue
      }

      await shell.trashItem(filePath)
      result.deleted.push(filePath)
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException
      if (nodeError.code === "ENOENT") {
        result.skipped.push({ path: filePath, reason: "文件不存在" })
      } else {
        result.failed.push({
          path: filePath,
          error: error instanceof Error ? error.message : "删除失败",
        })
      }
    }
  }

  return result
}

export const removeTask = async (task: Aria2Task, deleteFiles = false) => {
  if (isStoppedTask(task)) {
    await callAria2("aria2.removeDownloadResult", [task.gid])
  } else {
    await callAria2("aria2.remove", [task.gid])
  }

  if (!deleteFiles) {
    return null
  }

  return deleteTaskFiles(task)
}

export const fetchTasks = async (status: "active" | "waiting" | "stopped") => {
  const keys = [
    "gid",
    "status",
    "totalLength",
    "completedLength",
    "downloadSpeed",
    "uploadSpeed",
    "connections",
    "dir",
    "files",
    "bittorrent",
    "verifiedLength",
    "verifyIntegrityPending",
    "numSeeders",
    "seeder",
    "errorCode",
    "errorMessage",
  ]

  if (status === "active") {
    return callAria2<Aria2Task[]>("aria2.tellActive", [keys])
  }

  if (status === "waiting") {
    return callAria2<Aria2Task[]>("aria2.tellWaiting", [0, 100, keys])
  }

  return callAria2<Aria2Task[]>("aria2.tellStopped", [0, 100, keys])
}
