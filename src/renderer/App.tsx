import type { ComponentType } from "react"

import {
  Activity,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  FileArchive,
  FileDown,
  Files,
  Globe2,
  HardDrive,
  History,
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
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useI18n } from "@/lib/i18n"
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

const history = [
  ["debian-live-13.0.iso", "3.7 GB", "Today 11:42"],
  ["node-v26-linux-x64.tar.xz", "48 MB", "Yesterday"],
  ["fedora-workstation.iso", "2.1 GB", "May 17"],
]

const statusClasses: Record<TaskStatus, string> = {
  downloading: "bg-cyan-400/10 text-cyan-200 ring-cyan-300/20",
  queued: "bg-slate-400/10 text-slate-300 ring-slate-300/20",
  paused: "bg-amber-400/10 text-amber-200 ring-amber-300/20",
  seeding: "bg-violet-400/10 text-violet-200 ring-violet-300/20",
  completed: "bg-emerald-400/10 text-emerald-200 ring-emerald-300/20",
}

function App() {
  const { t } = useI18n()
  const activeTask = tasks[0]

  return (
    <main className="min-h-svh overflow-hidden bg-[#071014] text-slate-50">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.20),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(168,85,247,0.16),transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.2),rgba(2,6,23,0.82))]" />
      <div className="relative mx-auto flex min-h-svh w-full max-w-[96rem] flex-col p-3 sm:p-4 lg:p-5">
        <Card className="flex min-h-[calc(100svh-1.5rem)] flex-row overflow-hidden rounded-[2rem] border-white/10 bg-slate-950/72 text-slate-50 shadow-2xl shadow-black/50 backdrop-blur-2xl sm:min-h-[calc(100svh-2rem)] lg:min-h-[calc(100svh-2.5rem)]">
          <Sidebar />
          <section className="flex min-w-0 flex-1 flex-col">
            <Topbar />
            <Tabs
              defaultValue="overview"
              className="flex min-h-0 flex-1 flex-col gap-0"
            >
              <div className="border-b border-white/10 px-3 py-3 sm:px-5">
                <TabsList className="bg-white/5">
                  <TabsTrigger value="overview">{t.tabs.overview}</TabsTrigger>
                  <TabsTrigger value="queue">{t.tabs.queue}</TabsTrigger>
                  <TabsTrigger value="history">{t.tabs.history}</TabsTrigger>
                  <TabsTrigger value="settings">{t.tabs.settings}</TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="min-h-0 flex-1">
                <div className="grid gap-4 p-3 sm:p-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
                  <div className="grid min-w-0 gap-4">
                    <TabsContent
                      value="overview"
                      className="mt-0 grid gap-4 outline-none"
                    >
                      <Hero />
                      <StatsGrid />
                      <TaskPanel />
                    </TabsContent>
                    <TabsContent
                      value="queue"
                      className="mt-0 grid gap-4 outline-none"
                    >
                      <TaskPanel />
                      <QueueSummary />
                    </TabsContent>
                    <TabsContent
                      value="history"
                      className="mt-0 grid gap-4 outline-none"
                    >
                      <HistoryPanel />
                    </TabsContent>
                    <TabsContent
                      value="settings"
                      className="mt-0 grid gap-4 outline-none"
                    >
                      <SettingsPanel />
                    </TabsContent>
                  </div>

                  <aside className="grid content-start gap-4">
                    <AddDownloadDialog />
                    <TaskDetails task={activeTask} />
                    <QuickControls />
                    <LiveLog />
                  </aside>
                </div>
              </ScrollArea>

              <footer className="border-t border-white/10 px-4 py-3 text-xs text-slate-500">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="inline-flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.8)]" />
                    {t.footer.serviceStatus}
                  </span>
                  <span>{t.footer.traffic}</span>
                </div>
              </footer>
            </Tabs>
          </section>
        </Card>
      </div>
    </main>
  )
}

function Sidebar() {
  const { t } = useI18n()
  const navItems = [
    { label: t.navigation.tasks, icon: Download, active: true },
    { label: t.navigation.queue, icon: Clock3 },
    { label: t.navigation.files, icon: Files },
    { label: t.navigation.history, icon: History },
    { label: t.navigation.settings, icon: Settings2 },
  ]

  return (
    <aside className="hidden w-20 shrink-0 flex-col items-center border-r border-white/10 bg-white/[0.03] px-3 py-4 md:flex">
      <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 via-blue-400 to-violet-500 text-slate-950 shadow-lg shadow-cyan-500/20">
        <FileDown className="size-6" />
      </div>
      <nav className="mt-8 flex flex-1 flex-col gap-2">
        {navItems.map((item) => (
          <Tooltip key={item.label}>
            <TooltipTrigger
              render={
                <Button
                  aria-label={item.label}
                  variant="ghost"
                  size="icon-lg"
                  className={cn(
                    "size-11 rounded-2xl text-slate-400 hover:bg-white/10 hover:text-white",
                    item.active &&
                      "bg-white/12 text-cyan-100 shadow-inner shadow-white/5"
                  )}
                  type="button"
                />
              }
            >
              <item.icon className="size-5" />
            </TooltipTrigger>
            <TooltipContent>{item.label}</TooltipContent>
          </Tooltip>
        ))}
      </nav>
      <Badge
        variant="outline"
        className="grid size-11 place-items-center rounded-2xl border-emerald-300/20 bg-emerald-400/10 p-0 text-emerald-200"
      >
        <Activity className="size-5" />
      </Badge>
    </aside>
  )
}

function Topbar() {
  const { t } = useI18n()

  return (
    <header className="flex min-h-16 items-center gap-3 border-b border-white/10 px-3 sm:px-5">
      <div className="relative min-w-0 flex-1">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" />
        <Input
          aria-label={t.topbar.searchAria}
          className="h-11 rounded-2xl border-white/10 bg-white/[0.04] pr-12 pl-10 text-slate-200 placeholder:text-slate-500"
          placeholder={t.topbar.searchPlaceholder}
        />
        <kbd className="absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[0.65rem] text-slate-500 sm:block">
          /
        </kbd>
      </div>
      <Button className="hidden bg-cyan-300 text-slate-950 hover:bg-cyan-200 sm:inline-flex">
        <Plus />
        {t.topbar.newTask}
      </Button>
      <Tooltip>
        <TooltipTrigger
          render={<Button variant="ghost" size="icon" aria-label={t.topbar.filters} />}
        >
          <ListFilter />
        </TooltipTrigger>
        <TooltipContent>{t.topbar.filters}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="ghost" size="icon" aria-label={t.topbar.notifications} />
          }
        >
          <Bell />
        </TooltipTrigger>
        <TooltipContent>{t.topbar.notifications}</TooltipContent>
      </Tooltip>
    </header>
  )
}

function Hero() {
  const { t } = useI18n()

  return (
    <Card className="overflow-hidden border-white/10 bg-white/[0.04] text-slate-50 shadow-xl shadow-black/20">
      <CardContent className="flex flex-col gap-5 p-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge
            variant="outline"
            className="gap-2 border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
          >
            <Sparkles className="size-3.5" />
            {t.hero.badge}
          </Badge>
          <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            {t.hero.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            {t.hero.description}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-3xl border border-white/10 bg-slate-950/60 p-2 text-center">
          <MiniMetric value="5" label={t.hero.metrics.active} />
          <MiniMetric value="128" label={t.hero.metrics.done} />
          <MiniMetric value="942 GB" label={t.hero.metrics.saved} />
        </div>
      </CardContent>
    </Card>
  )
}

function MiniMetric({ value, label }: { value: string; label: string }) {
  return (
    <Card className="min-w-20 border-transparent bg-white/[0.05] text-center text-slate-50 shadow-none">
      <CardContent className="px-3 py-3">
        <div className="text-lg font-semibold text-white">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </CardContent>
    </Card>
  )
}

function StatsGrid() {
  const { t } = useI18n()
  const stats: StatItem[] = [
    {
      label: t.stats.download,
      value: "51.0 MB/s",
      detail: t.stats.downloadDetail,
      icon: Download,
    },
    {
      label: t.stats.upload,
      value: "8.2 MB/s",
      detail: t.stats.uploadDetail,
      icon: Upload,
    },
    {
      label: t.stats.disk,
      value: "128 MB",
      detail: t.stats.diskDetail,
      icon: HardDrive,
    },
    {
      label: t.stats.rpc,
      value: "4 ms",
      detail: t.stats.rpcDetail,
      icon: RadioTower,
    },
  ]

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="border-white/10 bg-white/[0.045] text-slate-50 shadow-lg shadow-black/15"
        >
          <CardContent className="p-4">
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
          </CardContent>
        </Card>
      ))}
    </section>
  )
}

function TaskPanel() {
  const { t } = useI18n()
  const statusLabels: Record<TaskStatus, string> = {
    downloading: t.status.downloading,
    queued: t.status.queued,
    paused: t.status.paused,
    seeding: t.status.seeding,
    completed: t.status.completed,
  }

  return (
    <Card className="overflow-hidden border-white/10 bg-white/[0.045] text-slate-50 shadow-lg shadow-black/15">
      <CardHeader className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg text-white">{t.taskPanel.title}</CardTitle>
          <CardDescription className="text-slate-500">
            {t.taskPanel.description}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            <Pause />
            {t.taskPanel.pauseAll}
          </Button>
          <Button variant="ghost" size="sm">
            <RotateCcw />
            {t.taskPanel.retryFailed}
          </Button>
        </div>
      </CardHeader>

      <Table>
        <TableHeader className="hidden lg:table-header-group">
            <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="px-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  {t.taskPanel.columns.name}
                </TableHead>
                <TableHead className="w-32 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  {t.taskPanel.columns.status}
                </TableHead>
                <TableHead className="w-32 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  {t.taskPanel.columns.speed}
                </TableHead>
                <TableHead className="w-28 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  {t.taskPanel.columns.eta}
                </TableHead>
                <TableHead className="w-24 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  {t.taskPanel.columns.action}
                </TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow
              key={task.id}
              className="grid border-white/10 hover:bg-white/[0.03] lg:table-row"
            >
              <TableCell className="min-w-0 p-4 lg:w-auto">
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
                    <p className="truncate text-xs text-slate-500">
                      {task.source}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Progress value={task.progress} className="flex-1">
                    <ProgressTrack className="h-2 bg-white/[0.07]">
                      <ProgressIndicator
                        className={cn(
                          "rounded-full bg-gradient-to-r",
                          task.accent
                        )}
                      />
                    </ProgressTrack>
                  </Progress>
                  <span className="w-10 text-right text-xs text-slate-500">
                    {task.progress}%
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-500 lg:hidden">
                  {task.speed} · {task.size} · {task.eta}
                </div>
              </TableCell>
              <TableCell className="px-4 py-0 pb-3 lg:p-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "w-fit border-transparent px-2.5 py-1 text-xs font-semibold ring-1",
                    statusClasses[task.status]
                  )}
                >
                  {statusLabels[task.status]}
                </Badge>
              </TableCell>
              <TableCell className="hidden text-sm font-medium text-slate-200 lg:table-cell">
                {task.speed}
              </TableCell>
              <TableCell className="hidden text-sm text-slate-400 lg:table-cell">
                {task.eta}
              </TableCell>
              <TableCell className="flex gap-1 px-4 pb-4 lg:table-cell lg:p-2">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t.taskPanel.resume}
                      />
                    }
                  >
                    <Play />
                  </TooltipTrigger>
                  <TooltipContent>{t.taskPanel.resume}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t.taskPanel.moreActions}
                      />
                    }
                  >
                    <MoreHorizontal />
                  </TooltipTrigger>
                  <TooltipContent>{t.taskPanel.moreActions}</TooltipContent>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

function AddDownloadDialog() {
  const { t } = useI18n()

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button className="w-full bg-cyan-300 text-slate-950 hover:bg-cyan-200" />
        }
      >
        <Plus />
        {t.addDialog.button}
      </DialogTrigger>
      <DialogContent className="max-w-xl border-white/10 bg-slate-950 text-slate-50">
        <DialogHeader>
          <DialogTitle>{t.addDialog.title}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {t.addDialog.description}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>{t.addDialog.source}</Label>
            <Input className="border-white/10 bg-white/[0.04]" placeholder={t.addDialog.sourcePlaceholder} />
          </div>
          <div className="grid gap-2">
            <Label>{t.addDialog.saveTo}</Label>
            <Input
              className="border-white/10 bg-white/[0.04]"
              defaultValue="~/Downloads/grabbit"
            />
          </div>
          <div className="grid gap-2">
            <Label>{t.addDialog.comment}</Label>
            <Textarea className="min-h-24 border-white/10 bg-white/[0.04]" placeholder={t.addDialog.commentPlaceholder} />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>{t.addDialog.connections}</span>
              <span>16</span>
            </div>
            <Slider defaultValue={[16]} max={32} step={1} />
          </div>
          <div className="grid gap-2">
            <Label>{t.addDialog.priority}</Label>
            <Select defaultValue="normal">
              <SelectTrigger className="w-full border-white/10 bg-white/[0.04]">
                <SelectValue placeholder={t.addDialog.priorityPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t.addDialog.low}</SelectItem>
                <SelectItem value="normal">{t.addDialog.normal}</SelectItem>
                <SelectItem value="high">{t.addDialog.high}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 border-white/10">
              {t.addDialog.cancel}
            </Button>
            <Button className="flex-1 bg-cyan-300 text-slate-950 hover:bg-cyan-200">
              {t.addDialog.queueTask}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TaskDetails({ task }: { task: DownloadTask }) {
  const { t } = useI18n()

  return (
    <Card className="border-white/10 bg-white/[0.045] text-slate-50 shadow-lg shadow-black/15">
      <CardHeader className="flex flex-row items-center justify-between gap-3 p-4 pb-0">
        <div>
          <CardTitle className="text-lg text-white">{t.taskDetails.title}</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            GID {task.id}b70d01ef
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label={t.taskDetails.actionLabel}>
          <ChevronRight />
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4 p-4">
        <Card className="rounded-2xl border-white/10 bg-white/[0.03] text-slate-50 shadow-none">
          <CardContent className="p-3">
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
              <Progress value={task.progress} className="flex-1">
                <ProgressTrack className="h-2 bg-white/[0.07]">
                  <ProgressIndicator
                    className={cn("rounded-full bg-gradient-to-r", task.accent)}
                  />
                </ProgressTrack>
              </Progress>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-3 gap-2">
          <IconAction icon={Pause} label={t.taskDetails.pause} />
          <IconAction icon={RotateCcw} label={t.taskDetails.retry} />
          <IconAction icon={Trash2} label={t.taskDetails.remove} danger />
        </div>
      </CardContent>
    </Card>
  )
}

function QuickControls() {
  const { t } = useI18n()

  return (
    <Card className="border-white/10 bg-white/[0.045] text-slate-50 shadow-lg shadow-black/15">
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-lg text-white">{t.quickControls.title}</CardTitle>
        <CardDescription className="text-slate-500">
          {t.quickControls.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 p-4">
        <div className="grid gap-2">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>{t.quickControls.queueLimit}</span>
            <span>5 {t.quickControls.active}</span>
          </div>
          <Slider defaultValue={[5]} max={10} step={1} />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>{t.quickControls.downloadCap}</span>
            <span>51 MB/s</span>
          </div>
          <Slider defaultValue={[51]} max={100} step={1} />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1">
            <Pause />
            {t.quickControls.pauseAll}
          </Button>
          <Button variant="outline" className="flex-1 border-white/10">
            <RotateCcw />
            {t.quickControls.resumeAll}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function HistoryPanel() {
  const { t } = useI18n()

  return (
    <Card className="border-white/10 bg-white/[0.045] text-slate-50 shadow-lg shadow-black/15">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-0">
        <div>
          <CardTitle className="text-lg text-white">{t.history.title}</CardTitle>
          <CardDescription className="text-slate-500">
            {t.history.description}
          </CardDescription>
        </div>
        <FileArchive className="size-5 text-slate-500" />
      </CardHeader>
      <CardContent className="p-4">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-slate-500">{t.history.columns.name}</TableHead>
              <TableHead className="text-slate-500">{t.history.columns.size}</TableHead>
              <TableHead className="text-slate-500">{t.history.columns.when}</TableHead>
              <TableHead className="text-slate-500">{t.history.columns.status}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map(([name, size, date]) => (
              <TableRow
                key={name}
                className="border-white/10 hover:bg-white/[0.03]"
              >
                <TableCell className="font-medium text-slate-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-300" />
                    {name}
                  </div>
                </TableCell>
                <TableCell className="text-slate-400">{size}</TableCell>
                <TableCell className="text-slate-400">{date}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
                  >
                    {t.history.completed}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function SettingsPanel() {
  const { locale, setLocale, t } = useI18n()

  return (
      <Card className="border-white/10 bg-white/[0.045] text-slate-50 shadow-lg shadow-black/15">
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-lg text-white">{t.settings.title}</CardTitle>
        <CardDescription className="text-slate-500">{t.settings.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 p-4">
        <div className="grid gap-2">
          <Label>{t.settings.theme}</Label>
          <Select defaultValue="system">
            <SelectTrigger className="w-full border-white/10 bg-white/[0.04]">
              <SelectValue placeholder={t.settings.themePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dark">{t.settings.dark}</SelectItem>
              <SelectItem value="light">{t.settings.light}</SelectItem>
              <SelectItem value="system">{t.settings.system}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>{t.settings.language}</Label>
          <Select
            value={locale}
            onValueChange={(value) => setLocale(value as typeof locale)}
          >
            <SelectTrigger className="w-full border-white/10 bg-white/[0.04]">
              <SelectValue placeholder={t.settings.language} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(t.languageOptions).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>{t.settings.defaultFolder}</Label>
          <Input
            className="border-white/10 bg-white/[0.04]"
            defaultValue="~/Downloads/grabbit"
          />
        </div>
        <div className="grid gap-2">
          <Label>{t.settings.rpcSecret}</Label>
          <Textarea
            className="min-h-20 border-white/10 bg-white/[0.04]"
            defaultValue="Generated on launch"
          />
        </div>
      </CardContent>
    </Card>
  )
}

function LiveLog() {
  const { t } = useI18n()

  const lines = [
    [t.liveLog.scopes.aria2c, t.liveLog.messages.rpcReady],
    [t.liveLog.scopes.queue, t.liveLog.messages.tasksWaiting],
    [t.liveLog.scopes.disk, t.liveLog.messages.sessionSaved],
    [t.liveLog.scopes.net, t.liveLog.messages.peerCount],
  ]

  return (
    <Card className="border-white/10 bg-white/[0.045] text-slate-50 shadow-lg shadow-black/15">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-0">
        <div>
          <CardTitle className="text-lg text-white">{t.liveLog.title}</CardTitle>
          <CardDescription className="text-slate-500">
            {t.liveLog.description}
          </CardDescription>
        </div>
        <MoreHorizontal className="size-5 text-slate-500" />
      </CardHeader>
      <CardContent className="grid gap-2 p-4">
        {lines.map(([scope, message]) => (
          <div
            key={`${scope}-${message}`}
            className="flex items-center gap-3 rounded-2xl bg-white/[0.03] px-3 py-2"
          >
            <Badge
              variant="outline"
              className="border-white/10 bg-white/[0.03] text-slate-300"
            >
              {scope}
            </Badge>
            <span className="text-sm text-slate-400">{message}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function QueueSummary() {
  const { t } = useI18n()

  return (
    <Card className="border-white/10 bg-white/[0.045] text-slate-50 shadow-lg shadow-black/15">
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-lg text-white">{t.queueSummary.title}</CardTitle>
        <CardDescription className="text-slate-500">
          {t.queueSummary.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 p-4">
        <div className="grid gap-2">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>{t.queueSummary.waiting}</span>
            <span>2 {t.queueSummary.tasks}</span>
          </div>
          <Progress value={50} className="flex-1">
            <ProgressTrack className="h-2 bg-white/[0.07]">
              <ProgressIndicator className="rounded-full bg-gradient-to-r from-cyan-300 to-blue-500" />
            </ProgressTrack>
          </Progress>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-white/10 bg-white/[0.03] shadow-none">
            <CardContent className="p-3">
              <div className="text-xs text-slate-500">{t.queueSummary.retryWait}</div>
              <div className="text-base font-semibold text-white">10s</div>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/[0.03] shadow-none">
            <CardContent className="p-3">
              <div className="text-xs text-slate-500">{t.queueSummary.diskCache}</div>
              <div className="text-base font-semibold text-white">128 MB</div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
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
    <Button
      variant="outline"
      className={cn(
        "h-auto flex-col gap-1 rounded-2xl border-white/10 bg-white/[0.03] px-2 py-3 text-xs text-slate-400 hover:bg-white/10 hover:text-white",
        danger && "hover:text-red-200"
      )}
      type="button"
    >
      <Icon className="size-4" />
      {label}
    </Button>
  )
}

export default App
