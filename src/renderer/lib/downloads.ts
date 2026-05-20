import type {
  DownloadGlobalStat,
  DownloadTask as Aria2DownloadTask,
} from "../../shared/download-api"

export type TaskStatus =
  | "downloading"
  | "queued"
  | "paused"
  | "seeding"
  | "completed"
  | "error"
  | "removed"

export type TaskProtocol = "http" | "ftp" | "bt" | "magnet" | "metalink"

export type DownloadTask = {
  id: string
  name: string
  source: string
  protocol: TaskProtocol
  status: TaskStatus
  progress: number
  size: string
  speed: string
  eta: string
  peers: string
  connections: number
  downloaded: string
  uploaded: string
  ratio: string
  savePath: string
  accent: string
}

export const fallbackTasks: DownloadTask[] = [
  {
    id: "8f2c4a91",
    name: "ubuntu-26.04-desktop-amd64.iso",
    source: "https://releases.ubuntu.com/26.04/ubuntu.iso",
    protocol: "http",
    status: "downloading",
    progress: 76,
    size: "4.1 / 5.4 GB",
    speed: "42.8 MB/s",
    eta: "02:18",
    peers: "18 conns",
    connections: 18,
    downloaded: "4.1 GB",
    uploaded: "0 MB",
    ratio: "0.00",
    savePath: "~/Downloads/grabbit/linux",
    accent: "from-cyan-300 to-blue-500",
  },
  {
    id: "90ad112e",
    name: "foundation-s01-archive.mkv",
    source: "magnet:?xt=urn:btih:foundation-archive",
    protocol: "magnet",
    status: "seeding",
    progress: 100,
    size: "11.7 GB",
    speed: "8.2 MB/s up",
    eta: "ratio 2.1",
    peers: "84 peers",
    connections: 84,
    downloaded: "11.7 GB",
    uploaded: "24.6 GB",
    ratio: "2.10",
    savePath: "~/Media/Series/Foundation",
    accent: "from-violet-300 to-fuchsia-500",
  },
  {
    id: "e4b70d30",
    name: "stable-diffusion-model.safetensors",
    source: "https://models.example.com/sd-model.safetensors",
    protocol: "http",
    status: "paused",
    progress: 39,
    size: "2.5 / 6.6 GB",
    speed: "0 KB/s",
    eta: "paused",
    peers: "12 conns",
    connections: 12,
    downloaded: "2.5 GB",
    uploaded: "0 MB",
    ratio: "0.00",
    savePath: "~/AI/models",
    accent: "from-amber-300 to-orange-500",
  },
  {
    id: "72ab0081",
    name: "archlinux-bootstrap-2026.05.tar.zst",
    source: "https://mirrors.edge.kernel.org/archlinux/iso/latest/",
    protocol: "ftp",
    status: "queued",
    progress: 0,
    size: "958 MB",
    speed: "waiting",
    eta: "queue #2",
    peers: "mirror set",
    connections: 0,
    downloaded: "0 MB",
    uploaded: "0 MB",
    ratio: "0.00",
    savePath: "~/Downloads/grabbit/linux",
    accent: "from-sky-300 to-indigo-500",
  },
]

export function toDownloadTask(task: Aria2DownloadTask): DownloadTask {
  const primaryFile = task.files[0]
  const source = primaryFile?.uris[0]?.uri ?? task.infoHash ?? task.gid
  const totalLength = task.totalLength || primaryFile?.length || 0
  const completedLength = task.completedLength || primaryFile?.completedLength || 0
  const protocol = getProtocol(task, source)

  return {
    id: task.gid,
    name: getTaskName(task, primaryFile?.path),
    source,
    protocol,
    status: getTaskStatus(task),
    progress: totalLength > 0 ? Math.round((completedLength / totalLength) * 100) : 0,
    size: `${formatBytes(completedLength)} / ${formatBytes(totalLength)}`,
    speed:
      task.status === "active"
        ? formatSpeed(task.downloadSpeed || task.uploadSpeed)
        : getTaskStatus(task),
    eta: getEta(totalLength, completedLength, task.downloadSpeed),
    peers: task.infoHash ? `${task.numSeeders} seeders` : `${task.connections} conns`,
    connections: task.connections,
    downloaded: formatBytes(completedLength),
    uploaded: formatBytes(task.uploadLength),
    ratio: completedLength > 0 ? (task.uploadLength / completedLength).toFixed(2) : "0.00",
    savePath: task.dir,
    accent: getTaskAccent(protocol),
  }
}

export function formatTraffic(stat: DownloadGlobalStat | null) {
  if (!stat) return "Down 0 B/s · Up 0 B/s · 0 waiting · 0 active"

  return `Down ${formatSpeed(stat.downloadSpeed)} · Up ${formatSpeed(stat.uploadSpeed)} · ${stat.numWaiting} waiting · ${stat.numActive} active`
}

export function formatSpeed(bytesPerSecond: number) {
  return `${formatBytes(bytesPerSecond)}/s`
}

function getTaskStatus(task: Aria2DownloadTask): TaskStatus {
  if (task.status === "active" && task.infoHash && task.seeder) return "seeding"
  if (task.status === "active") return "downloading"
  if (task.status === "waiting") return "queued"
  if (task.status === "paused") return "paused"
  if (task.status === "complete") return task.infoHash ? "seeding" : "completed"
  if (task.status === "error") return "error"
  return "removed"
}

function getProtocol(task: Aria2DownloadTask, source: string): TaskProtocol {
  if (task.bittorrent) return "bt"
  if (source.startsWith("magnet:")) return "magnet"
  if (source.endsWith(".metalink") || source.endsWith(".meta4")) return "metalink"
  if (source.startsWith("ftp:")) return "ftp"
  return "http"
}

function getTaskName(task: Aria2DownloadTask, filePath: string | undefined) {
  if (task.bittorrent?.info?.name) return task.bittorrent.info.name
  if (!filePath) return task.gid

  const parts = filePath.split(/[\\/]/).filter(Boolean)
  return parts.at(-1) ?? task.gid
}

function getTaskAccent(protocol: TaskProtocol) {
  if (protocol === "bt" || protocol === "magnet") return "from-violet-300 to-fuchsia-500"
  if (protocol === "ftp") return "from-sky-300 to-indigo-500"
  if (protocol === "metalink") return "from-amber-300 to-orange-500"
  return "from-cyan-300 to-blue-500"
}

function getEta(totalLength: number, completedLength: number, speed: number) {
  if (speed <= 0 || completedLength >= totalLength) return "--"

  const seconds = Math.ceil((totalLength - completedLength) / speed)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`
}

function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB", "TB"]
  let value = bytes
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  const precision = value >= 10 || unitIndex === 0 ? 0 : 1
  return `${value.toFixed(precision)} ${units[unitIndex]}`
}
