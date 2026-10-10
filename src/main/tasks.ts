import Store from "electron-store"
import { callAria2 } from "./aria2"
import type { Aria2Status } from "../shared/aria2"

type Task = {
  gid: string
  status: "unfinished" | "completed"
}

type Tasks = Task[]

// const unfinishedTasks = new Store<Tasks>({
//   name: "unfinishedTasks",
//   defaults: new Set(),
// })

const completedTasks = new Store<Tasks>({
  name: "completedTasks",
  defaults: [],
})

// const terminalStatuses: TaskStatus[] = ["complete", "error", "removed"]
// const taskStatuses: TaskStatus[] = [
//   "active",
//   "waiting",
//   "paused",
//   ...terminalStatuses,
// ]

// function getTaskByGid(gid: string): TaskRecord | null {
//   return store.get("tasks")[gid] ?? null
// }

export function addCompletedTasks(gid: string) {
  unfinishedTasks.store.delete(gid)
  completedTasks.store.add(gid)
}

export function removeTask(gid: string) {
  unfinishedTasks.store.delete(gid)
  completedTasks.store.delete(gid)
}

export async function getUnfinishedTasks() {
  const [active, waiting] = await Promise.all([
    callAria2<Aria2Status[]>("aria2.tellActive"),
    callAria2<Aria2Status[]>("aria2.tellWaiting", [0, 1000000]),
  ])
  return [...active, ...waiting]
}

export function getCompletedTasks() {
  return completedTasks.store
}
