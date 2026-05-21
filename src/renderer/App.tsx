import {
  Activity,
  Bell,
  CheckCircle2,
  Clock3,
  CloudLightning,
  Command,
  Cpu,
  DatabaseZap,
  Download,
  FileArchive,
  Files,
  FolderDown,
  Gauge,
  Globe2,
  HardDriveDownload,
  Info,
  Layers3,
  Link2,
  ListFilter,
  LockKeyhole,
  Magnet,
  Pause,
  Play,
  Plus,
  RadioTower,
  RotateCcw,
  Route,
  Save,
  Search,
  ServerCog,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TimerReset,
  Trash2,
  Waves,
  Wifi,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type TaskStatus = "Downloading" | "Seeding" | "Paused" | "Completed" | "Queued"
type PageKind = "main" | "add" | "settings" | "details" | "history"

type DownloadTask = {
  name: string
  detail: string
  status: TaskStatus
  progress: number
  speed: string
  size: string
  accent: string
}

type Design = {
  name: string
  label: string
  mood: string
  surface: string
  frame: string
  sidebar: string
  panel: string
  subtle: string
  border: string
  accent: string
  glow: string
  icon: typeof Download
}

const pages: Array<{ kind: PageKind; title: string }> = [
  { kind: "main", title: "Main downloads" },
  { kind: "add", title: "Add download modal" },
  { kind: "settings", title: "Settings" },
  { kind: "details", title: "Task details" },
  { kind: "history", title: "History" },
]

const tasks: DownloadTask[] = [
  {
    name: "ubuntu-26.04-desktop.iso",
    detail: "HTTP • 18 connections • ~/Downloads/grabbit",
    status: "Downloading",
    progress: 76,
    speed: "42.8 MB/s",
    size: "4.1 / 5.4 GB",
    accent: "from-emerald-400 to-cyan-400",
  },
  {
    name: "archlinux-bootstrap.tar.zst",
    detail: "Mirror group • retry enabled",
    status: "Queued",
    progress: 0,
    speed: "waiting",
    size: "958 MB",
    accent: "from-sky-400 to-blue-500",
  },
  {
    name: "foundation-s01-archive.mkv",
    detail: "Magnet • 84 peers • verified chunks",
    status: "Seeding",
    progress: 100,
    speed: "8.2 MB/s",
    size: "11.7 GB",
    accent: "from-violet-400 to-fuchsia-400",
  },
  {
    name: "stable-diffusion-model.safetensors",
    detail: "HTTPS • paused by scheduler",
    status: "Paused",
    progress: 39,
    speed: "0 KB/s",
    size: "2.5 / 6.6 GB",
    accent: "from-amber-300 to-orange-400",
  },
]

const designs: Design[] = [
  {
    name: "Monolith",
    label: "01",
    mood: "Quiet pro dashboard",
    surface: "bg-zinc-950 text-zinc-50",
    frame: "border-white/10 bg-zinc-950 shadow-2xl shadow-black/60",
    sidebar: "border-white/10 bg-white/[0.04]",
    panel: "border-white/10 bg-white/[0.07]",
    subtle: "bg-white/[0.05]",
    border: "border-white/10",
    accent: "from-zinc-100 to-zinc-400",
    glow: "bg-white/15",
    icon: ServerCog,
  },
  {
    name: "Aurora",
    label: "02",
    mood: "Glass and gradients",
    surface: "bg-slate-950 text-cyan-50",
    frame: "border-cyan-200/15 bg-slate-950 shadow-2xl shadow-cyan-950/50",
    sidebar: "border-cyan-200/15 bg-cyan-100/[0.06]",
    panel: "border-cyan-200/15 bg-cyan-100/[0.08]",
    subtle: "bg-cyan-100/[0.07]",
    border: "border-cyan-200/15",
    accent: "from-cyan-300 via-sky-400 to-violet-400",
    glow: "bg-cyan-300/25",
    icon: CloudLightning,
  },
  {
    name: "Paper Trail",
    label: "03",
    mood: "Warm and readable",
    surface: "bg-stone-100 text-stone-950",
    frame: "border-stone-300 bg-white shadow-xl shadow-stone-300/50",
    sidebar: "border-stone-300 bg-stone-50",
    panel: "border-stone-300 bg-stone-50",
    subtle: "bg-stone-100",
    border: "border-stone-300",
    accent: "from-stone-950 to-amber-700",
    glow: "bg-amber-300/45",
    icon: FileArchive,
  },
  {
    name: "Neon Ops",
    label: "04",
    mood: "Terminal operations",
    surface: "bg-black text-lime-50",
    frame: "border-lime-300/20 bg-black shadow-2xl shadow-lime-950/50",
    sidebar: "border-lime-300/20 bg-lime-300/[0.05]",
    panel: "border-lime-300/20 bg-lime-300/[0.07]",
    subtle: "bg-lime-300/[0.06]",
    border: "border-lime-300/20",
    accent: "from-lime-300 to-emerald-500",
    glow: "bg-lime-300/25",
    icon: RadioTower,
  },
  {
    name: "Graphite",
    label: "05",
    mood: "Dense native utility",
    surface: "bg-neutral-900 text-neutral-100",
    frame: "border-neutral-700 bg-neutral-800 shadow-xl shadow-black/30",
    sidebar: "border-neutral-700 bg-neutral-900/70",
    panel: "border-neutral-700 bg-neutral-900/70",
    subtle: "bg-neutral-700/40",
    border: "border-neutral-700",
    accent: "from-neutral-200 to-neutral-500",
    glow: "bg-neutral-200/15",
    icon: Cpu,
  },
  {
    name: "Tidepool",
    label: "06",
    mood: "Calm bandwidth health",
    surface: "bg-blue-950 text-blue-50",
    frame: "border-blue-200/15 bg-blue-950 shadow-2xl shadow-blue-950/50",
    sidebar: "border-blue-200/15 bg-blue-100/[0.06]",
    panel: "border-blue-200/15 bg-blue-100/[0.08]",
    subtle: "bg-blue-100/[0.07]",
    border: "border-blue-200/15",
    accent: "from-teal-200 via-cyan-300 to-blue-400",
    glow: "bg-teal-200/25",
    icon: Waves,
  },
  {
    name: "Command Mint",
    label: "07",
    mood: "Keyboard-first control",
    surface: "bg-emerald-50 text-emerald-950",
    frame: "border-emerald-200 bg-white shadow-xl shadow-emerald-200/60",
    sidebar: "border-emerald-200 bg-emerald-50",
    panel: "border-emerald-200 bg-emerald-50",
    subtle: "bg-emerald-100/80",
    border: "border-emerald-200",
    accent: "from-emerald-500 to-teal-600",
    glow: "bg-emerald-300/45",
    icon: Command,
  },
  {
    name: "Solar Queue",
    label: "08",
    mood: "Scheduling and limits",
    surface: "bg-orange-50 text-orange-950",
    frame: "border-orange-200 bg-white/95 shadow-xl shadow-orange-200/50",
    sidebar: "border-orange-200 bg-orange-50",
    panel: "border-orange-200 bg-orange-50",
    subtle: "bg-orange-100/80",
    border: "border-orange-200",
    accent: "from-orange-500 via-amber-400 to-yellow-300",
    glow: "bg-yellow-300/50",
    icon: TimerReset,
  },
  {
    name: "Orbit",
    label: "09",
    mood: "Sources and routes",
    surface: "bg-indigo-950 text-indigo-50",
    frame: "border-indigo-200/15 bg-indigo-950 shadow-2xl shadow-indigo-950/50",
    sidebar: "border-indigo-200/15 bg-indigo-100/[0.06]",
    panel: "border-indigo-200/15 bg-indigo-100/[0.08]",
    subtle: "bg-indigo-100/[0.07]",
    border: "border-indigo-200/15",
    accent: "from-indigo-300 via-violet-300 to-fuchsia-300",
    glow: "bg-violet-300/25",
    icon: Route,
  },
  {
    name: "Vault",
    label: "10",
    mood: "Verified archive",
    surface: "bg-slate-100 text-slate-950",
    frame: "border-slate-300 bg-white shadow-xl shadow-slate-300/50",
    sidebar: "border-slate-300 bg-slate-50",
    panel: "border-slate-300 bg-slate-50",
    subtle: "bg-slate-100",
    border: "border-slate-300",
    accent: "from-slate-900 to-blue-700",
    glow: "bg-blue-300/40",
    icon: ShieldCheck,
  },
]

const statusClass: Record<TaskStatus, string> = {
  Downloading: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/20",
  Seeding: "bg-violet-500/15 text-violet-300 ring-violet-400/20",
  Paused: "bg-amber-500/15 text-amber-300 ring-amber-400/20",
  Completed: "bg-sky-500/15 text-sky-300 ring-sky-400/20",
  Queued: "bg-zinc-500/15 text-zinc-300 ring-zinc-400/20",
}

const lightStatusClass: Record<TaskStatus, string> = {
  Downloading: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  Seeding: "bg-violet-100 text-violet-800 ring-violet-200",
  Paused: "bg-amber-100 text-amber-800 ring-amber-200",
  Completed: "bg-sky-100 text-sky-800 ring-sky-200",
  Queued: "bg-zinc-100 text-zinc-700 ring-zinc-200",
}

function App() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-[120rem] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-3xl border bg-card p-5 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5" />
            Neon Ops structure, 10 visual directions
          </div>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
                One structure, 10 visual systems
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                Every mock now uses the Neon Ops layout: compact left rail,
                top action bar, dense central workspace, and bottom aria2c
                status strip. Only the visual language changes.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <ListFilter />
                Compare
              </Button>
              <Button>
                <Plus />
                New task
              </Button>
            </div>
          </div>
        </header>

        <div className="grid gap-8">
          {designs.map((design) => (
            <DesignSuite key={design.name} design={design} />
          ))}
        </div>
      </section>
    </main>
  )
}

function DesignSuite({ design }: { design: Design }) {
  const Icon = design.icon
  const light = isLight(design)

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-[2rem] border p-4 sm:p-5",
        design.surface,
        light ? "border-black/10" : "border-white/10"
      )}
    >
      <div className={cn("absolute -right-16 -top-24 size-72 rounded-full blur-3xl", design.glow)} />
      <div className={cn("absolute -bottom-32 left-1/3 size-80 rounded-full blur-3xl", design.glow)} />

      <div className="relative z-10 mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("grid size-11 place-items-center rounded-2xl bg-gradient-to-br text-black", design.accent)}>
            <Icon className="size-5" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] opacity-55">
              {design.label} / {design.mood}
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">{design.name}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs opacity-70">
          {pages.map((page) => (
            <span key={`${design.name}-${page.kind}`}>{page.title}</span>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex gap-5 overflow-x-auto pb-3 [scrollbar-width:thin]">
        {pages.map((page) => (
          <MockFrame key={`${design.name}-${page.kind}`} title={page.title} design={design}>
            <AppShellMock design={design} light={light} page={page.kind} />
          </MockFrame>
        ))}
      </div>
    </article>
  )
}

function MockFrame({
  title,
  design,
  children,
}: {
  title: string
  design: Design
  children: React.ReactNode
}) {
  return (
    <section className={cn("w-[min(74rem,calc(100vw-4rem))] shrink-0 rounded-[1.75rem] border p-3", design.frame)}>
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] opacity-60">{title}</div>
        <div className="flex gap-1.5 opacity-70">
          <span className="size-2 rounded-full bg-red-400" />
          <span className="size-2 rounded-full bg-amber-400" />
          <span className="size-2 rounded-full bg-emerald-400" />
        </div>
      </div>
      {children}
    </section>
  )
}

function AppShellMock({
  design,
  light,
  page,
}: {
  design: Design
  light: boolean
  page: PageKind
}) {
  const workspace = <Workspace design={design} light={light} page={page} />

  return (
    <ShellRoot className="grid-cols-[4.75rem_1fr]">
      <RailNav design={design} light={light} page={page} />
      <MainPane design={design} light={light} page={page}>{workspace}</MainPane>
    </ShellRoot>
  )
}

function ShellRoot({ className, children }: { className: string; children: React.ReactNode }) {
  return <div className={cn("relative grid h-[44rem] overflow-hidden rounded-[1.35rem]", className)}>{children}</div>
}

function MainPane({
  design,
  light,
  page,
  children,
}: {
  design: Design
  light: boolean
  page: PageKind
  children: React.ReactNode
}) {
  return (
    <section className={cn("relative flex min-w-0 flex-col", design.border)}>
      <Toolbar design={design} light={light} page={page} />
      <div className="min-h-0 flex-1 overflow-hidden p-4">{children}</div>
      <StatusBar design={design} />
    </section>
  )
}

function Workspace({ design, light, page }: { design: Design; light: boolean; page: PageKind }) {
  if (page === "add") return <AddWorkspace design={design} light={light} />
  if (page === "settings") return <SettingsWorkspace design={design} light={light} />
  if (page === "details") return <DetailsWorkspace design={design} light={light} />
  if (page === "history") return <HistoryWorkspace design={design} light={light} />
  return <MainWorkspace design={design} light={light} />
}

function Toolbar({ design, light, page }: { design: Design; light: boolean; page: PageKind }) {
  return (
    <header className={cn("flex h-16 items-center gap-3 border-b px-4", design.border)}>
      <div className={cn("flex min-w-0 flex-1 items-center gap-2 rounded-2xl border px-3 py-2", design.panel)}>
        <Search className="size-4 opacity-55" />
        <span className="truncate text-sm opacity-60">Search tasks, URLs, files, or GID</span>
      </div>
      <Button size="sm" variant={light ? "default" : "secondary"}>
        <Plus />
        Add
      </Button>
      <Button size="icon-sm" variant="ghost" aria-label="Filter downloads">
        <ListFilter />
      </Button>
      <Button size="icon-sm" variant="ghost" aria-label="Notifications">
        <Bell />
      </Button>
      <Button size="icon-sm" variant={page === "settings" ? "default" : "ghost"} aria-label="Settings">
        <Settings2 />
      </Button>
    </header>
  )
}

function RailNav({ design, light, page }: { design: Design; light: boolean; page: PageKind }) {
  const items = [Download, Clock3, CheckCircle2, Pause, Settings2]
  return (
    <aside className={cn("hidden flex-col items-center gap-3 border-r p-3 md:flex", design.sidebar)}>
      <div className={cn("mb-4 grid size-10 place-items-center rounded-2xl bg-gradient-to-br text-black", design.accent)}>
        <RadioTower className="size-5" />
      </div>
      {items.map((Icon, index) => {
        const active =
          (index === 0 && (page === "main" || page === "add" || page === "details")) ||
          (index === 2 && page === "history") ||
          (index === 4 && page === "settings")
        return (
          <div key={`${design.name}-rail-${index}`} className={cn("grid size-10 place-items-center rounded-2xl", active ? cn("font-semibold", light ? "bg-black/10" : "bg-white/10") : "opacity-55")}>
            <Icon className="size-4" />
          </div>
        )
      })}
      <div className={cn("mt-auto grid size-10 place-items-center rounded-2xl", design.panel)}>
        <Activity className="size-4 text-emerald-400" />
      </div>
    </aside>
  )
}

function MainWorkspace({ design, light }: { design: Design; light: boolean }) {
  return (
    <div className={cn("h-full overflow-hidden rounded-2xl border", design.panel)}>
      <TaskTableHeader design={design} />
      {tasks.concat(tasks.slice(0, 2)).map((task, index) => (
        <TaskTableRow key={`${design.name}-dense-${task.name}-${index}`} task={task} design={design} light={light} />
      ))}
    </div>
  )
}

function AddWorkspace({ design, light }: { design: Design; light: boolean }) {
  return (
    <div className="relative h-full overflow-hidden rounded-3xl">
      <MainWorkspace design={design} light={light} />
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" />
      <div className={cn("absolute left-1/2 top-1/2 w-[32rem] max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-[1.75rem] border p-5 shadow-2xl", design.frame)}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold">Add download</div>
            <div className="mt-1 text-sm opacity-60">URL, magnet, torrent, or metalink</div>
          </div>
          <Button size="icon-sm" variant="ghost" aria-label="Close modal">
            <X />
          </Button>
        </div>
        <Field design={design} icon={Link2} label="Source" value="https://releases.ubuntu.com/26.04/ubuntu.iso" />
        <Field design={design} icon={FolderDown} label="Save to" value="~/Downloads/grabbit" />
        <div className="grid grid-cols-2 gap-3">
          <Field design={design} icon={Layers3} label="Split" value="16" />
          <Field design={design} icon={Gauge} label="Speed limit" value="No cap" />
        </div>
        <div className="mt-5 flex gap-2">
          <Button className="flex-1" variant="outline">Cancel</Button>
          <Button className="flex-1">
            <Plus />
            Add task
          </Button>
        </div>
      </div>
    </div>
  )
}

function SettingsWorkspace({ design }: { design: Design; light: boolean }) {
  return (
    <div className="grid h-full gap-4 lg:grid-cols-[1fr_22rem]">
      <div className="grid content-start gap-3">
        <SectionTitle title="Core" description="Bundled aria2c process and secure local RPC" />
        <div className="grid gap-3 lg:grid-cols-2">
          <SettingRow design={design} icon={ServerCog} label="aria2c binary" value="resources/aria2/linux-x64/aria2c" />
          <SettingRow design={design} icon={Wifi} label="RPC endpoint" value="127.0.0.1 : dynamic" />
          <SettingRow design={design} icon={LockKeyhole} label="RPC secret" value="Generated on launch" />
          <SettingRow design={design} icon={FolderDown} label="Default folder" value="~/Downloads/grabbit" />
        </div>
        <SectionTitle title="Performance" description="Connections, retries, and queue limits" />
        <div className={cn("rounded-3xl border p-4", design.panel)}>
          {[
            ["Max concurrent downloads", "5", 55],
            ["Connections per server", "16", 80],
            ["Retry wait", "10s", 40],
            ["Disk cache", "128 MB", 64],
          ].map(([label, value, width]) => (
            <div key={`${design.name}-${label}`} className="mb-4 last:mb-0">
              <div className="mb-2 flex justify-between text-sm">
                <span>{label}</span>
                <span className="opacity-60">{value}</span>
              </div>
              <div className={cn("h-2 rounded-full", design.subtle)}>
                <div className={cn("h-full rounded-full bg-gradient-to-r", design.accent)} style={{ width: `${width}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={cn("flex flex-col rounded-3xl border p-4", design.panel)}>
        <SlidersHorizontal className="mb-4 size-6 opacity-60" />
        <div className="text-lg font-semibold">Profile</div>
        <div className="mt-1 text-sm leading-6 opacity-60">Optimized for local Linux x64 aria2c with dynamic RPC and persistent session files.</div>
        <Button className="mt-auto">
          <Save />
          Save settings
        </Button>
      </div>
    </div>
  )
}

function DetailsWorkspace({ design, light }: { design: Design; light: boolean }) {
  const task = tasks[0]

  return (
    <div className="grid h-full gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="grid content-start gap-4">
        <div className={cn("rounded-3xl border p-5", design.panel)}>
          <div className="mb-5 flex items-start gap-4">
            <div className={cn("grid size-14 place-items-center rounded-2xl bg-gradient-to-br text-black", task.accent)}>
              <HardDriveDownload className="size-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-2xl font-semibold">{task.name}</div>
              <div className="mt-1 text-sm opacity-60">GID 8f2c4a91b70d01ef • HTTP • verified</div>
            </div>
          </div>
          <TaskProgress task={task} design={design} />
          <div className="mt-5 flex gap-2">
            <Button size="sm">
              <Pause />
              Pause
            </Button>
            <Button size="sm" variant="outline">
              <RotateCcw />
              Retry
            </Button>
            <Button size="sm" variant="ghost">
              <Trash2 />
              Remove
            </Button>
          </div>
        </div>
        <div className={cn("rounded-3xl border p-4", design.panel)}>
          <SectionTitle title="Files" description="Selected files inside this task" />
          {[
            ["ubuntu.iso", "5.4 GB", 76],
            ["SHA256SUMS", "13 KB", 100],
            ["README", "4 KB", 100],
          ].map(([name, size, progress]) => (
            <FileRow key={`${design.name}-${name}`} design={design} name={`${name}`} size={`${size}`} progress={Number(progress)} />
          ))}
        </div>
      </div>
      <div className="grid content-start gap-3">
        <Stat design={design} icon={Globe2} label="Connections" value="18" />
        <Stat design={design} icon={Files} label="Pieces" value="8192" />
        <Stat design={design} icon={Gauge} label="Avg speed" value="39 MB/s" />
        <TaskCard task={tasks[3]} design={design} light={light} />
      </div>
    </div>
  )
}

function HistoryWorkspace({ design, light }: { design: Design; light: boolean }) {
  const history = [
    ["debian-live.iso", "Completed", "3.7 GB"],
    ["node-v26-linux-x64.tar.xz", "Completed", "48 MB"],
    ["dataset-part-09.zip", "Removed", "1.2 GB"],
    ["fedora-workstation.iso", "Completed", "2.1 GB"],
    ["aria2-1.37-linux.tar.bz2", "Completed", "2.8 MB"],
  ]

  return (
    <div className="grid h-full grid-rows-[auto_1fr] gap-4">
      <div className="grid gap-3 lg:grid-cols-4">
        <Stat design={design} icon={CheckCircle2} label="Done" value="128" />
        <Stat design={design} icon={DatabaseZap} label="Saved" value="942 GB" />
        <Stat design={design} icon={Clock3} label="This week" value="18" />
        <Stat design={design} icon={Magnet} label="Magnets" value="27" />
      </div>
      <div className={cn("overflow-hidden rounded-3xl border", design.panel)}>
        <div className={cn("grid grid-cols-[1fr_8rem_7rem_3rem] border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide opacity-60", design.border)}>
          <span>Name</span>
          <span>Status</span>
          <span>Size</span>
          <span />
        </div>
        {history.map(([name, status, size]) => (
          <div key={`${design.name}-${name}`} className={cn("grid grid-cols-[1fr_8rem_7rem_3rem] items-center gap-3 border-b px-4 py-3 last:border-b-0", design.border)}>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{name}</div>
              <div className="text-xs opacity-55">~/Downloads/grabbit</div>
            </div>
            <span className={cn("w-fit rounded-full px-2 py-1 text-xs ring-1", status === "Completed" ? (light ? lightStatusClass.Completed : statusClass.Completed) : lightStatusClass.Paused)}>
              {status}
            </span>
            <span className="text-sm opacity-70">{size}</span>
            <Button size="icon-sm" variant="ghost" aria-label="Show details">
              <Info />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusBar({ design }: { design: Design }) {
  return (
    <footer className={cn("flex h-10 items-center justify-between border-t px-4 text-xs opacity-70", design.border)}>
      <span>aria2c running • session saved 8s ago</span>
      <span>Down 51 MB/s • Up 8.2 MB/s • 304 peers</span>
    </footer>
  )
}

function TaskTableHeader({ design }: { design: Design }) {
  return (
    <div className={cn("grid grid-cols-[1fr_8rem_8rem_8rem_7rem] border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide opacity-60", design.border)}>
      <span>Name</span>
      <span>Status</span>
      <span>Speed</span>
      <span>Size</span>
      <span>Action</span>
    </div>
  )
}

function TaskTableRow({ task, design, light }: { task: DownloadTask; design: Design; light: boolean }) {
  return (
    <div className={cn("grid grid-cols-[1fr_8rem_8rem_8rem_7rem] items-center gap-3 border-b px-4 py-3 last:border-b-0", design.border)}>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{task.name}</div>
        <div className="mt-1 flex items-center gap-3 text-xs opacity-60">
          <span className="truncate">{task.detail}</span>
          <span>{task.progress}%</span>
        </div>
        <div className={cn("mt-2 h-1.5 rounded-full", design.subtle)}>
          <div className={cn("h-full rounded-full bg-gradient-to-r", task.accent)} style={{ width: `${task.progress}%` }} />
        </div>
      </div>
      <span className={cn("w-fit rounded-full px-2 py-1 text-xs font-medium ring-1", light ? lightStatusClass[task.status] : statusClass[task.status])}>
        {task.status}
      </span>
      <span className="text-sm font-medium">{task.speed}</span>
      <span className="text-sm opacity-70">{task.size}</span>
      <div className="flex gap-1">
        <Button size="icon-sm" variant="ghost" aria-label="Pause download">
          <Pause />
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label="Resume download">
          <Play />
        </Button>
      </div>
    </div>
  )
}

function TaskProgress({ task, design }: { task: DownloadTask; design: Design }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span>{task.speed}</span>
        <span className="opacity-60">{task.size}</span>
      </div>
      <div className={cn("h-3 rounded-full", design.subtle)}>
        <div className={cn("h-full rounded-full bg-gradient-to-r", task.accent)} style={{ width: `${task.progress}%` }} />
      </div>
    </div>
  )
}

function TaskCard({ task, design, light }: { task: DownloadTask; design: Design; light: boolean }) {
  return (
    <div className={cn("rounded-3xl border p-4", design.panel)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{task.name}</div>
          <div className="truncate text-xs opacity-60">{task.detail}</div>
        </div>
        <span className={cn("shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ring-1", light ? lightStatusClass[task.status] : statusClass[task.status])}>
          {task.status}
        </span>
      </div>
      <TaskProgress task={task} design={design} />
    </div>
  )
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <div className="text-lg font-semibold">{title}</div>
      <div className="text-sm opacity-60">{description}</div>
    </div>
  )
}

function Stat({ design, icon: Icon, label, value }: { design: Design; icon: typeof Download; label: string; value: string }) {
  return (
    <div className={cn("rounded-3xl border p-4", design.panel)}>
      <Icon className="mb-3 size-4 opacity-60" />
      <div className="text-xs opacity-55">{label}</div>
      <div className="truncate text-lg font-semibold">{value}</div>
    </div>
  )
}

function Field({ design, icon: Icon, label, value }: { design: Design; icon: typeof Download; label: string; value: string }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-xs font-medium opacity-65">{label}</span>
      <span className={cn("flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm", design.panel)}>
        <Icon className="size-4 shrink-0 opacity-55" />
        <span className="truncate opacity-80">{value}</span>
      </span>
    </label>
  )
}

function SettingRow({ design, icon: Icon, label, value }: { design: Design; icon: typeof Download; label: string; value: string }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-3xl border p-4", design.panel)}>
      <div className={cn("grid size-10 place-items-center rounded-2xl", design.subtle)}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{label}</div>
        <div className="truncate text-xs opacity-60">{value}</div>
      </div>
    </div>
  )
}

function FileRow({ design, name, size, progress }: { design: Design; name: string; size: string; progress: number }) {
  return (
    <div className={cn("grid grid-cols-[1fr_7rem] items-center gap-3 border-t py-3", design.border)}>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{name}</div>
        <div className="mt-1 text-xs opacity-55">{progress}% complete</div>
      </div>
      <div className="text-right text-sm opacity-70">{size}</div>
    </div>
  )
}

function isLight(design: Design) {
  return (
    design.surface.includes("bg-stone") ||
    design.surface.includes("bg-emerald-50") ||
    design.surface.includes("bg-orange-50") ||
    design.surface.includes("bg-slate-100")
  )
}

export default App
