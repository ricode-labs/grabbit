import Store from "electron-store"


// type Task = {
//   gid: string
//   status: "unfinished" | "completed"
// }

type Tasks = Set<string>

const unfinishedTasks = new Store<Tasks>({
  name: "unfinishedTasks",
  defaults: new Set(),
})

const completedTasks = new Store<Tasks>({
  name: "completedTasks",
  defaults: new Set(),
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

export function addTask(gid: string) {
  unfinishedTasks.store.add(gid)
}

export function removeTask(gid: string) {
  unfinishedTasks.store.delete(gid)
  completedTasks.store.delete(gid)
}

export function getUnfinishedTasks() {
  return unfinishedTasks.store
}

export function getCompletedTasks() {
  return completedTasks.store
}

