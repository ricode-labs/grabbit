import { ipcMain } from "electron/main"
import Store from "electron-store"
import { callAria2 } from "./aria2"
import type { Aria2Status, GidPayload } from "../shared/aria2"
import type {
  RegisterTaskPayload,
  TaskRecord,
  TaskSource,
  TaskStatus,
} from "../shared/tasks"

const store = new Store<{ tasks: Record<string, TaskRecord> }>({
  name: "tasks",
  defaults: { tasks: {} },
})

const terminalStatuses: TaskStatus[] = ["complete", "error", "removed"]
const taskStatuses: TaskStatus[] = [
  "active",
  "waiting",
  "paused",
  ...terminalStatuses,
]

function requireGid(payload: GidPayload): string {
  const gid = payload?.gid
  if (typeof gid !== "string" || !/^[0-9a-f]{1,16}$/i.test(gid)) {
    throw new Error("Invalid aria2 GID")
  }
  return gid
}

function requireSource(source?: TaskSource): TaskSource | undefined {
  if (source === undefined) return undefined
  if (
    !source ||
    !["uri", "torrent", "metalink"].includes(source.kind) ||
    typeof source.value !== "string" ||
    !source.value.trim()
  ) {
    throw new Error("Invalid task source")
  }
  return source
}

function getTaskByGid(gid: string): TaskRecord | null {
  return store.get("tasks")[gid] ?? null
}

function saveTask(task: TaskRecord): TaskRecord {
  store.set("tasks", { ...store.get("tasks"), [task.gid]: task })
  return task
}

function snapshotTask(
  status: Aria2Status,
  now: number,
  existing?: TaskRecord,
  source?: TaskSource
): TaskRecord {
  if (!taskStatuses.includes(status.status as TaskStatus)) {
    throw new Error(`Unsupported aria2 task status: ${status.status}`)
  }

  const taskStatus = status.status as TaskStatus
  const torrentName = status.bittorrent?.info?.name
  const files =
    status.files?.map((file) => ({
      index: file.index,
      path: file.path,
      length: file.length,
      completedLength: file.completedLength,
      selected: file.selected,
    })) ?? []

  return {
    gid: status.gid,
    source: existing?.source ?? source,
    status: taskStatus,
    fileName:
      torrentName || files[0]?.path?.split(/[\\/]/).pop() || existing?.fileName,
    torrentName: torrentName ?? existing?.torrentName,
    dir: status.dir || existing?.dir || "",
    files: files.length > 0 ? files : (existing?.files ?? []),
    totalLength:
      status.totalLength !== "0"
        ? status.totalLength
        : (existing?.totalLength ?? status.totalLength),
    completedLength: status.completedLength,
    infoHash: status.infoHash ?? existing?.infoHash,
    errorCode: status.errorCode,
    errorMessage: status.errorMessage,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    completedAt:
      taskStatus === "complete"
        ? (existing?.completedAt ?? now)
        : existing?.completedAt,
    removedAt:
      taskStatus === "removed"
        ? (existing?.removedAt ?? now)
        : existing?.removedAt,
  }
}

function hasNewMetadata(task: TaskRecord, status: Aria2Status): boolean {
  return Boolean(
    (status.dir && task.dir !== status.dir) ||
    (status.infoHash && task.infoHash !== status.infoHash) ||
    (status.errorCode && task.errorCode !== status.errorCode) ||
    (status.errorMessage && task.errorMessage !== status.errorMessage) ||
    (status.bittorrent?.info?.name &&
      task.torrentName !== status.bittorrent.info.name) ||
    (status.totalLength !== "0" && task.totalLength !== status.totalLength) ||
    status.files?.some((file, index) => {
      const recorded = task.files[index]
      return (
        !recorded ||
        recorded.path !== file.path ||
        recorded.length !== file.length ||
        recorded.selected !== file.selected
      )
    })
  )
}

export function listTasks(): TaskRecord[] {
  return Object.values(store.get("tasks")).sort(
    (a, b) => b.updatedAt - a.updatedAt
  )
}

export function getTask(payload: GidPayload): TaskRecord | null {
  return getTaskByGid(requireGid(payload))
}

export async function registerTask(
  payload: RegisterTaskPayload
): Promise<TaskRecord> {
  const gid = requireGid(payload)
  const source = requireSource(payload.source)
  const existing = getTaskByGid(gid)
  if (existing) {
    return source && !existing.source
      ? saveTask({ ...existing, source })
      : existing
  }

  const status = await callAria2<Aria2Status>("aria2.tellStatus", [gid])
  if (status.gid !== gid) throw new Error("aria2 returned a different GID")

  // Another registration may have completed while the RPC call was in flight.
  const current = getTaskByGid(gid)
  if (current) {
    return source && !current.source
      ? saveTask({ ...current, source })
      : current
  }
  return saveTask(snapshotTask(status, Date.now(), undefined, source))
}

export async function syncTask(payload: GidPayload): Promise<TaskRecord> {
  const gid = requireGid(payload)
  const existing = getTaskByGid(gid)
  if (!existing) throw new Error(`Task not registered: ${gid}`)
  if (terminalStatuses.includes(existing.status)) return existing

  const status = await callAria2<Aria2Status>("aria2.tellStatus", [gid])
  if (status.gid !== gid) throw new Error("aria2 returned a different GID")

  // A deletion or terminal update during the RPC call must not be undone.
  const current = getTaskByGid(gid)
  if (!current) throw new Error(`Task not registered: ${gid}`)
  if (terminalStatuses.includes(current.status)) return current

  // Persist status transitions and metadata (e.g. magnet info), not every
  // progress update; active download progress belongs to aria2.
  if (current.status === status.status && !hasNewMetadata(current, status)) {
    return current
  }

  return saveTask(snapshotTask(status, Date.now(), current))
}

export function markTaskRemoved(payload: GidPayload): TaskRecord {
  const gid = requireGid(payload)
  const existing = getTaskByGid(gid)
  if (!existing) throw new Error(`Task not registered: ${gid}`)
  if (existing.status === "removed") return existing

  const now = Date.now()
  return saveTask({
    ...existing,
    status: "removed",
    updatedAt: now,
    removedAt: now,
  })
}

export function forgetTask(payload: GidPayload): boolean {
  const gid = requireGid(payload)
  const tasks = store.get("tasks")
  if (!Object.hasOwn(tasks, gid)) return false

  const remaining = { ...tasks }
  delete remaining[gid]
  store.set("tasks", remaining)
  return true
}

export function registerTaskIpcHandlers() {
  ipcMain.handle("grabbit.listTasks", () => listTasks())
  ipcMain.handle("grabbit.getTask", (_event, payload: GidPayload) =>
    getTask(payload)
  )
  ipcMain.handle(
    "grabbit.registerTask",
    (_event, payload: RegisterTaskPayload) => registerTask(payload)
  )
  ipcMain.handle("grabbit.syncTask", (_event, payload: GidPayload) =>
    syncTask(payload)
  )
  ipcMain.handle("grabbit.markTaskRemoved", (_event, payload: GidPayload) =>
    markTaskRemoved(payload)
  )
  ipcMain.handle("grabbit.forgetTask", (_event, payload: GidPayload) =>
    forgetTask(payload)
  )
}
