import type { ComponentType, ReactNode } from "react"

import {
  Activity,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Command,
  Download,
  FileArchive,
  FileDown,
  Files,
  FolderDown,
  Gauge,
  Globe2,
  HardDrive,
  History,
  Info,
  Link2,
  ListFilter,
  Magnet,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RadioTower,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  Wifi,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type TaskStatus = "downloading" | "queued" | "paused" | "seeding" | "completed"

type DownloadTask = {
  id: string
  name: string
  source: string
  status: TaskStatus
  progress: number
  size: string
  speed: string
  eta: string
  peers: string
  savePath: string
  accent: string
}

type StatItem = {
  label: string
  value: string
  detail: string
  icon: ComponentType<{ className?: string }>
}

const tasks: DownloadTask[] = [
  {
    id: "8f2c4a91",
    name: "ubuntu-26.04-desktop-amd64.iso",
    source: "https://releases.ubuntu.com/26.04/ubuntu.iso",
    status: "downloading",
    progress: 76,
    size: "4.1 / 5.4 GB",
    speed: "42.8 MB/s",
    eta: "02:18",
    peers: "18 conns",
    savePath: "~/Downloads/grabbit/linux",
    accent: "from-cyan-300 to-blue-500",
  },
  {
    id: "90ad112e",
    name: "foundation-s01-archive.mkv",
    source: "magnet:?xt=urn:btih:foundation-archive",
    status: "seeding",
    progress: 100,
    size: "11.7 GB",
    speed: "8.2 MB/s up",
    eta: "ratio 2.1",
    peers: "84 peers",
    savePath: "~/Media/Series/Foundation",
    accent: "from-violet-300 to-fuchsia-500",
  },
  {
    id: "e4b70d30",
    name: "stable-diffusion-model.safetensors",
    source: "https://models.example.com/sd-model.safetensors",
    status: "paused",
    progress: 39,
    size: "2.5 / 6.6 GB",
    speed: "0 KB/s",
    eta: "paused",
    peers: "12 conns",
    savePath: "~/AI/models",
    accent: "from-amber-300 to-orange-500",
  },
  {
    id: "72ab0081",
    name: "archlinux-bootstrap-2026.05.tar.zst",
    source: "https://mirrors.edge.kernel.org/archlinux/iso/latest/",
    status: "queued",
    progress: 0,
    size: "958 MB",
    speed: "waiting",
    eta: "queue #2",
    peers: "mirror set",
    savePath: "~/Downloads/grabbit/linux",
    accent: "from-sky-300 to-indigo-500",
  },
]

const stats: StatItem[] = [
  {
    label: "Download",
    value: "51.0 MB/s",
    detail: "+12% from avg",
    icon: Download,
  },
  { label: "Upload", value: "8.2 MB/s", detail: "304 peers", icon: Upload },
  { label: "Disk", value: "128 MB", detail: "cache active", icon: HardDrive },
  { label: "RPC", value: "4 ms", detail: "127.0.0.1", icon: RadioTower },
]

const history = [
  ["debian-live-13.0.iso", "3.7 GB", "Today 11:42"],
  ["node-v26-linux-x64.tar.xz", "48 MB", "Yesterday"],
  ["fedora-workstation.iso", "2.1 GB", "May 17"],
]

const statusLabels: Record<TaskStatus, string> = {
  downloading: "Downloading",
  queued: "Queued",
  paused: "Paused",
  seeding: "Seeding",
  completed: "Completed",
}

const statusClasses: Record<TaskStatus, string> = {
  downloading: "bg-cyan-400/10 text-cyan-200 ring-cyan-300/20",
  queued: "bg-slate-400/10 text-slate-300 ring-slate-300/20",
  paused: "bg-amber-400/10 text-amber-200 ring-amber-300/20",
  seeding: "bg-violet-400/10 text-violet-200 ring-violet-300/20",
  completed: "bg-emerald-400/10 text-emerald-200 ring-emerald-300/20",
}

function App() {
  const activeTask = tasks[0]

  return (
    <main className="min-h-svh overflow-hidden bg-[#071014] text-slate-50">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.20),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(168,85,247,0.16),transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.2),rgba(2,6,23,0.82))]" />
      <div className="relative mx-auto flex min-h-svh w-full max-w-[96rem] flex-col p-3 sm:p-4 lg:p-5">
        <AppChrome>
          <Sidebar />
          <section className="flex min-w-0 flex-1 flex-col">
            <Topbar />
            <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-3 sm:p-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
              <div className="grid min-w-0 gap-4">
                <Hero />
                <StatsGrid />
                <TaskPanel />
              </div>
              <aside className="grid content-start gap-4">
                <AddDownloadCard />
                <TaskDetails task={activeTask} />
                <SettingsCard />
                <HistoryCard />
              </aside>
            </div>
            <StatusBar />
          </section>
        </AppChrome>
      </div>
    </main>
  )
}

function AppChrome({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100svh-1.5rem)] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/72 shadow-2xl shadow-black/50 backdrop-blur-2xl sm:min-h-[calc(100svh-2rem)] lg:min-h-[calc(100svh-2.5rem)]">
      {children}
    </div>
  )
}

function Sidebar() {
  const navItems = [
    { label: "Tasks", icon: Download, active: true },
    { label: "Queue", icon: Clock3 },
    { label: "Files", icon: Files },
    { label: "History", icon: History },
    { label: "Settings", icon: Settings2 },
  ]

  return (
    <aside className="hidden w-20 shrink-0 flex-col items-center border-r border-white/10 bg-white/[0.03] px-3 py-4 md:flex">
      <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 via-blue-400 to-violet-500 text-slate-950 shadow-lg shadow-cyan-500/20">
        <FileDown className="size-6" />
      </div>
      <nav className="mt-8 flex flex-1 flex-col gap-2">
        {navItems.map((item) => (
          <button
            key={item.label}
            aria-label={item.label}
            className={cn(
              "grid size-11 place-items-center rounded-2xl text-slate-400 transition hover:bg-white/10 hover:text-white",
              item.active &&
                "bg-white/12 text-cyan-100 shadow-inner shadow-white/5"
            )}
            type="button"
          >
            <item.icon className="size-5" />
          </button>
        ))}
      </nav>
      <div className="grid size-11 place-items-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
        <Activity className="size-5" />
      </div>
    </aside>
  )
}

function Topbar() {
  return (
    <header className="flex min-h-16 items-center gap-3 border-b border-white/10 px-3 sm:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-slate-400">
        <Search className="size-4 shrink-0" />
        <span className="truncate">
          Search URL, magnet, file name, task id...
        </span>
        <kbd className="ml-auto hidden rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[0.65rem] text-slate-500 sm:block">
          /
        </kbd>
      </div>
      <Button className="hidden bg-cyan-300 text-slate-950 hover:bg-cyan-200 sm:inline-flex">
        <Plus />
        New task
      </Button>
      <Button variant="ghost" size="icon" aria-label="Filters">
        <ListFilter />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Notifications">
        <Bell />
      </Button>
    </header>
  )
}

function Hero() {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/20">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
            <Sparkles className="size-3.5" />
            aria2 powered desktop downloader
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Grab files, torrents, and mirrors without losing control.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            A complete Grabbit workspace for managing active downloads, queue
            limits, task details, history, and local RPC health from one screen.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-3xl border border-white/10 bg-slate-950/60 p-2 text-center">
          <MiniMetric value="5" label="active" />
          <MiniMetric value="128" label="done" />
          <MiniMetric value="942 GB" label="saved" />
        </div>
      </div>
    </section>
  )
}

function MiniMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-20 rounded-2xl bg-white/[0.05] px-3 py-3">
      <div className="text-lg font-semibold text-white">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  )
}

function StatsGrid() {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm text-slate-400">{stat.label}</div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {stat.value}
              </div>
              <div className="mt-1 text-xs text-slate-500">{stat.detail}</div>
            </div>
            <div className="grid size-10 place-items-center rounded-2xl bg-white/[0.06] text-cyan-200">
              <stat.icon className="size-5" />
            </div>
          </div>
        </Card>
      ))}
    </section>
  )
}

function TaskPanel() {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Active downloads</h2>
          <p className="text-sm text-slate-500">
            4 tasks across HTTP, magnet, and mirrored sources
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            <Pause />
            Pause all
          </Button>
          <Button variant="ghost" size="sm">
            <RotateCcw />
            Retry failed
          </Button>
        </div>
      </div>
      <div className="hidden grid-cols-[1fr_8rem_8rem_7rem_5rem] gap-3 border-b border-white/10 px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase lg:grid">
        <span>Name</span>
        <span>Status</span>
        <span>Speed</span>
        <span>ETA</span>
        <span>Action</span>
      </div>
      <div>
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </div>
    </Card>
  )
}

function TaskRow({ task }: { task: DownloadTask }) {
  return (
    <article className="grid gap-3 border-b border-white/10 p-4 last:border-b-0 lg:grid-cols-[1fr_8rem_8rem_7rem_5rem] lg:items-center">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-slate-950",
              task.accent
            )}
          >
            {task.source.startsWith("magnet") ? (
              <Magnet className="size-5" />
            ) : (
              <Globe2 className="size-5" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-white">
              {task.name}
            </h3>
            <p className="truncate text-xs text-slate-500">{task.source}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Progress value={task.progress} accent={task.accent} />
          <span className="w-10 text-right text-xs text-slate-500">
            {task.progress}%
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500 lg:hidden">
          {task.speed} · {task.size} · {task.eta}
        </div>
      </div>
      <StatusBadge status={task.status} />
      <div className="hidden text-sm font-medium text-slate-200 lg:block">
        {task.speed}
      </div>
      <div className="hidden text-sm text-slate-400 lg:block">{task.eta}</div>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon-sm" aria-label="Resume task">
          <Play />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Task menu">
          <MoreHorizontal />
        </Button>
      </div>
    </article>
  )
}

function AddDownloadCard() {
  return (
    <Card className="p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Add download</h2>
          <p className="text-sm text-slate-500">
            URL, magnet, torrent, or metalink
          </p>
        </div>
        <div className="grid size-10 place-items-center rounded-2xl bg-cyan-300 text-slate-950">
          <Plus className="size-5" />
        </div>
      </div>
      <Field icon={Link2} label="Source" value="Paste a link or magnet URI" />
      <Field icon={FolderDown} label="Save to" value="~/Downloads/grabbit" />
      <div className="grid grid-cols-2 gap-3">
        <Field icon={SlidersHorizontal} label="Split" value="16" />
        <Field icon={Gauge} label="Limit" value="No cap" />
      </div>
      <Button className="mt-4 w-full bg-cyan-300 text-slate-950 hover:bg-cyan-200">
        <Plus />
        Queue task
      </Button>
    </Card>
  )
}

function TaskDetails({ task }: { task: DownloadTask }) {
  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Task details</h2>
          <p className="text-xs text-slate-500">GID {task.id}b70d01ef</p>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Task info">
          <Info />
        </Button>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <div className="truncate text-sm font-semibold text-white">
          {task.name}
        </div>
        <div className="mt-1 truncate text-xs text-slate-500">
          {task.savePath}
        </div>
        <div className="mt-4">
          <div className="mb-2 flex justify-between text-xs text-slate-400">
            <span>{task.size}</span>
            <span>{task.peers}</span>
          </div>
          <Progress value={task.progress} accent={task.accent} />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <IconAction icon={Pause} label="Pause" />
        <IconAction icon={RotateCcw} label="Retry" />
        <IconAction icon={Trash2} label="Remove" danger />
      </div>
    </Card>
  )
}

function SettingsCard() {
  const settings = [
    ["RPC endpoint", "127.0.0.1 : dynamic", Wifi],
    ["RPC secret", "Generated on launch", ShieldCheck],
    ["Max active", "5 downloads", Command],
  ] as const

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Settings</h2>
        <Button variant="ghost" size="icon-sm" aria-label="Open settings">
          <ChevronRight />
        </Button>
      </div>
      <div className="grid gap-2">
        {settings.map(([label, value, Icon]) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
          >
            <Icon className="size-4 text-slate-400" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-200">{label}</div>
              <div className="truncate text-xs text-slate-500">{value}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function HistoryCard() {
  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Recent history</h2>
        <FileArchive className="size-5 text-slate-500" />
      </div>
      <div className="grid gap-2">
        {history.map(([name, size, date]) => (
          <div
            key={name}
            className="flex items-center gap-3 rounded-2xl bg-white/[0.03] p-3"
          >
            <CheckCircle2 className="size-4 shrink-0 text-emerald-300" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-slate-200">
                {name}
              </div>
              <div className="text-xs text-slate-500">{date}</div>
            </div>
            <div className="text-xs text-slate-500">{size}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function StatusBar() {
  return (
    <footer className="flex flex-col gap-2 border-t border-white/10 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <span className="inline-flex items-center gap-2">
        <span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.8)]" />
        aria2c running · session saved 8s ago
      </span>
      <span>Down 51 MB/s · Up 8.2 MB/s · 304 peers · 5 active</span>
    </footer>
  )
}

function Card({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <section
      className={cn(
        "rounded-[1.5rem] border border-white/10 bg-white/[0.045] shadow-lg shadow-black/15",
        className
      )}
    >
      {children}
    </section>
  )
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-xs font-medium text-slate-500">
        {label}
      </span>
      <span className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-slate-400">
        <Icon className="size-4 shrink-0" />
        <span className="truncate">{value}</span>
      </span>
    </label>
  )
}

function Progress({ value, accent }: { value: number; accent: string }) {
  return (
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
      <div
        className={cn("h-full rounded-full bg-gradient-to-r", accent)}
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={cn(
        "w-fit rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        statusClasses[status]
      )}
    >
      {statusLabels[status]}
    </span>
  )
}

function IconAction({
  icon: Icon,
  label,
  danger,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  danger?: boolean
}) {
  return (
    <button
      className={cn(
        "flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-3 text-xs text-slate-400 transition hover:bg-white/10 hover:text-white",
        danger && "hover:text-red-200"
      )}
      type="button"
    >
      <Icon className="size-4" />
      {label}
    </button>
  )
}

export default App
