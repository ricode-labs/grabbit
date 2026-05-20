import { useEffect, useState, type ComponentType } from "react"

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
import {
  formatBytes,
  formatSpeed,
  formatTraffic,
  toDownloadTask,
  type DownloadTask,
  type TaskStatus,
} from "@/lib/downloads"
import type {
  DownloadGlobalStat,
  DownloadServiceStatus,
  DownloadVersion,
} from "../shared/download-api"

type StatItem = {
  label: string
  value: string
  detail: string
  icon: ComponentType<{ className?: string }>
}

const statusClasses: Record<TaskStatus, string> = {
  downloading: "bg-cyan-400/10 text-cyan-200 ring-cyan-300/20",
  queued: "bg-slate-400/10 text-slate-300 ring-slate-300/20",
  paused: "bg-amber-400/10 text-amber-200 ring-amber-300/20",
  seeding: "bg-violet-400/10 text-violet-200 ring-violet-300/20",
  completed: "bg-emerald-400/10 text-emerald-200 ring-emerald-300/20",
  error: "bg-red-400/10 text-red-200 ring-red-300/20",
  removed: "bg-slate-400/10 text-slate-400 ring-slate-300/20",
}

function App() {
  const { t } = useI18n()
  const [tasks, setTasks] = useState<DownloadTask[]>([])
  const [globalStat, setGlobalStat] = useState<DownloadGlobalStat | null>(null)
  const [serviceStatus, setServiceStatus] = useState<DownloadServiceStatus>({
    running: false,
    rpcPort: null,
  })
  const [version, setVersion] = useState<DownloadVersion | null>(null)
  const [globalOptions, setGlobalOptions] = useState<Record<string, string>>({})
  const [rpcError, setRpcError] = useState<string | null>(null)
  const activeTask = tasks[0] ?? null

  async function refreshDownloads() {
    const [nextTasks, nextStat, nextStatus, nextOptions] = await Promise.all([
      window.grabbit.downloads.list(),
      window.grabbit.downloads.getGlobalStat(),
      window.grabbit.downloads.getServiceStatus(),
      window.grabbit.downloads.getGlobalOption(),
    ])

    setTasks(nextTasks.map(toDownloadTask))
    setGlobalStat(nextStat)
    setServiceStatus(nextStatus)
    setGlobalOptions(nextOptions)
    setRpcError(null)
  }

  async function runDownloadAction(action: () => Promise<unknown>) {
    try {
      await action()
      await refreshDownloads()
    } catch (error) {
      setRpcError(error instanceof Error ? error.message : String(error))
    }
  }

  useEffect(() => {
    let cancelled = false

    async function startAndPoll() {
      try {
        const [status, ariaVersion] = await Promise.all([
          window.grabbit.downloads.startService(),
          window.grabbit.downloads.getVersion(),
        ])

        if (cancelled) {
          return
        }

        setServiceStatus(status)
        setVersion(ariaVersion)
        await refreshDownloads()
      } catch (error) {
        if (!cancelled) {
          setRpcError(error instanceof Error ? error.message : String(error))
        }
      }
    }

    startAndPoll()
    const interval = window.setInterval(() => {
      refreshDownloads().catch((error: unknown) => {
        setRpcError(error instanceof Error ? error.message : String(error))
      })
    }, 2_000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

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
                  <TabsTrigger value="overview">
                    {t("tabs.overview")}
                  </TabsTrigger>
                  <TabsTrigger value="queue">{t("tabs.queue")}</TabsTrigger>
                  <TabsTrigger value="history">{t("tabs.history")}</TabsTrigger>
                  <TabsTrigger value="settings">
                    {t("tabs.settings")}
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="min-h-0 flex-1">
                <div className="grid gap-4 p-3 sm:p-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
                  <div className="grid min-w-0 gap-4">
                    <TabsContent
                      value="overview"
                      className="mt-0 grid gap-4 outline-none"
                    >
                      <Hero tasks={tasks} globalStat={globalStat} />
                      <StatsGrid globalStat={globalStat} tasks={tasks} />
                      {rpcError ? <RpcError message={rpcError} /> : null}
                      <TaskPanel
                        tasks={tasks}
                        onPauseAll={() =>
                          runDownloadAction(() =>
                            window.grabbit.downloads.pauseAll()
                          )
                        }
                        onResume={(gid) =>
                          runDownloadAction(() =>
                            window.grabbit.downloads.resume(gid)
                          )
                        }
                        onRemove={(gid) =>
                          runDownloadAction(() =>
                            window.grabbit.downloads.forceRemove(gid)
                          )
                        }
                      />
                    </TabsContent>
                    <TabsContent
                      value="queue"
                      className="mt-0 grid gap-4 outline-none"
                    >
                      <TaskPanel
                        tasks={tasks}
                        onPauseAll={() =>
                          runDownloadAction(() =>
                            window.grabbit.downloads.pauseAll()
                          )
                        }
                        onResume={(gid) =>
                          runDownloadAction(() =>
                            window.grabbit.downloads.resume(gid)
                          )
                        }
                        onRemove={(gid) =>
                          runDownloadAction(() =>
                            window.grabbit.downloads.forceRemove(gid)
                          )
                        }
                      />
                      <QueueSummary
                        globalStat={globalStat}
                        globalOptions={globalOptions}
                      />
                    </TabsContent>
                    <TabsContent
                      value="history"
                      className="mt-0 grid gap-4 outline-none"
                    >
                      <HistoryPanel tasks={tasks} />
                    </TabsContent>
                    <TabsContent
                      value="settings"
                      className="mt-0 grid gap-4 outline-none"
                    >
                      <SettingsPanel globalOptions={globalOptions} />
                    </TabsContent>
                  </div>

                  <aside className="grid content-start gap-4">
                    <AddDownloadDialog
                      onAdd={(source, savePath, connections) =>
                        runDownloadAction(() =>
                          window.grabbit.downloads.addUri({
                            uris: [source],
                            options: {
                              dir: savePath,
                              split: connections,
                              "max-connection-per-server": connections,
                            },
                          })
                        )
                      }
                    />
                    <TaskDetails task={activeTask} />
                    <QuickControls
                      globalStat={globalStat}
                      onPauseAll={() =>
                        runDownloadAction(() =>
                          window.grabbit.downloads.pauseAll()
                        )
                      }
                      onResumeAll={() =>
                        runDownloadAction(() =>
                          window.grabbit.downloads.resumeAll()
                        )
                      }
                    />
                    <LiveLog
                      serviceStatus={serviceStatus}
                      globalStat={globalStat}
                      tasks={tasks}
                    />
                  </aside>
                </div>
              </ScrollArea>

              <footer className="border-t border-white/10 px-4 py-3 text-xs text-slate-500">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="inline-flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.8)]" />
                    {serviceStatus.running
                      ? `aria2c ${version?.version ?? "running"} · RPC ${serviceStatus.rpcPort}`
                      : t("footer.serviceStatus")}
                  </span>
                  <span>{formatTraffic(globalStat)}</span>
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
    { label: t("navigation.tasks"), icon: Download, active: true },
    { label: t("navigation.queue"), icon: Clock3 },
    { label: t("navigation.files"), icon: Files },
    { label: t("navigation.history"), icon: History },
    { label: t("navigation.settings"), icon: Settings2 },
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
          aria-label={t("topbar.searchAria")}
          className="h-11 rounded-2xl border-white/10 bg-white/[0.04] pr-12 pl-10 text-slate-200 placeholder:text-slate-500"
          placeholder={t("topbar.searchPlaceholder")}
        />
        <kbd className="absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[0.65rem] text-slate-500 sm:block">
          /
        </kbd>
      </div>
      <Button className="hidden bg-cyan-300 text-slate-950 hover:bg-cyan-200 sm:inline-flex">
        <Plus />
        {t("topbar.newTask")}
      </Button>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("topbar.filters")}
            />
          }
        >
          <ListFilter />
        </TooltipTrigger>
        <TooltipContent>{t("topbar.filters")}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("topbar.notifications")}
            />
          }
        >
          <Bell />
        </TooltipTrigger>
        <TooltipContent>{t("topbar.notifications")}</TooltipContent>
      </Tooltip>
    </header>
  )
}

function Hero({
  tasks,
  globalStat,
}: {
  tasks: DownloadTask[]
  globalStat: DownloadGlobalStat | null
}) {
  const { t } = useI18n()
  const completedCount = tasks.filter(
    (task) => task.status === "completed"
  ).length
  const downloadedBytes = tasks.reduce((total, task) => {
    const value = Number.parseFloat(task.downloaded)
    if (!Number.isFinite(value)) return total

    if (task.downloaded.endsWith("TB")) return total + value * 1024 ** 4
    if (task.downloaded.endsWith("GB")) return total + value * 1024 ** 3
    if (task.downloaded.endsWith("MB")) return total + value * 1024 ** 2
    if (task.downloaded.endsWith("KB")) return total + value * 1024
    return total + value
  }, 0)

  return (
    <Card className="overflow-hidden border-white/10 bg-white/[0.04] text-slate-50 shadow-xl shadow-black/20">
      <CardContent className="flex flex-col gap-5 p-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge
            variant="outline"
            className="gap-2 border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
          >
            <Sparkles className="size-3.5" />
            {t("hero.badge")}
          </Badge>
          <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            {t("hero.title")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            {t("hero.description")}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-3xl border border-white/10 bg-slate-950/60 p-2 text-center">
          <MiniMetric
            value={`${globalStat?.numActive ?? 0}`}
            label={t("hero.metrics.active")}
          />
          <MiniMetric
            value={`${completedCount}`}
            label={t("hero.metrics.done")}
          />
          <MiniMetric
            value={formatBytes(downloadedBytes)}
            label={t("hero.metrics.saved")}
          />
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

function StatsGrid({
  globalStat,
  tasks,
}: {
  globalStat: DownloadGlobalStat | null
  tasks: DownloadTask[]
}) {
  const { t } = useI18n()
  const totalConnections = tasks.reduce(
    (total, task) => total + task.connections,
    0
  )
  const stats: StatItem[] = [
    {
      label: t("stats.download"),
      value: formatSpeed(globalStat?.downloadSpeed ?? 0),
      detail: `${globalStat?.numActive ?? 0} active`,
      icon: Download,
    },
    {
      label: t("stats.upload"),
      value: formatSpeed(globalStat?.uploadSpeed ?? 0),
      detail: `${totalConnections} connections`,
      icon: Upload,
    },
    {
      label: t("stats.disk"),
      value: `${tasks.length}`,
      detail: "total tasks",
      icon: HardDrive,
    },
    {
      label: t("stats.rpc"),
      value: `${globalStat?.numWaiting ?? 0}`,
      detail: "waiting tasks",
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

function RpcError({ message }: { message: string }) {
  return (
    <Card className="border-red-400/20 bg-red-400/10 text-red-100 shadow-lg shadow-black/15">
      <CardContent className="p-4 text-sm">
        aria2 RPC error: {message}
      </CardContent>
    </Card>
  )
}

function TaskPanel({
  tasks,
  onPauseAll,
  onResume,
  onRemove,
}: {
  tasks: DownloadTask[]
  onPauseAll: () => void
  onResume: (gid: string) => void
  onRemove: (gid: string) => void
}) {
  const { t } = useI18n()
  const statusLabels: Record<TaskStatus, string> = {
    downloading: t("status.downloading"),
    queued: t("status.queued"),
    paused: t("status.paused"),
    seeding: t("status.seeding"),
    completed: t("status.completed"),
    error: "Error",
    removed: "Removed",
  }

  return (
    <Card className="overflow-hidden border-white/10 bg-white/[0.045] text-slate-50 shadow-lg shadow-black/15">
      <CardHeader className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg text-white">
            {t("taskPanel.title")}
          </CardTitle>
          <CardDescription className="text-slate-500">
            {t("taskPanel.description")}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onPauseAll}>
            <Pause />
            {t("taskPanel.pauseAll")}
          </Button>
          <Button variant="ghost" size="sm">
            <RotateCcw />
            {t("taskPanel.retryFailed")}
          </Button>
        </div>
      </CardHeader>

      <Table>
        <TableHeader className="hidden lg:table-header-group">
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead className="px-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {t("taskPanel.columns.name")}
            </TableHead>
            <TableHead className="w-32 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {t("taskPanel.columns.status")}
            </TableHead>
            <TableHead className="w-32 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {t("taskPanel.columns.speed")}
            </TableHead>
            <TableHead className="w-28 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {t("taskPanel.columns.eta")}
            </TableHead>
            <TableHead className="w-24 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {t("taskPanel.columns.action")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableCell
                className="p-6 text-center text-sm text-slate-500 lg:table-cell"
                colSpan={5}
              >
                No downloads yet. Add a URL or magnet link to start.
              </TableCell>
            </TableRow>
          ) : null}
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
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
                      <span>{task.protocol.toUpperCase()}</span>
                      <span>•</span>
                      <span>{task.connections} peers</span>
                      <span>•</span>
                      <span>ratio {task.ratio}</span>
                    </div>
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
                        aria-label={t("taskPanel.resume")}
                        onClick={() => onResume(task.id)}
                      />
                    }
                  >
                    <Play />
                  </TooltipTrigger>
                  <TooltipContent>{t("taskPanel.resume")}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("taskPanel.moreActions")}
                        onClick={() => onRemove(task.id)}
                      />
                    }
                  >
                    <MoreHorizontal />
                  </TooltipTrigger>
                  <TooltipContent>{t("taskPanel.moreActions")}</TooltipContent>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

function AddDownloadDialog({
  onAdd,
}: {
  onAdd: (source: string, savePath: string, connections: number) => void
}) {
  const { t } = useI18n()
  const [source, setSource] = useState("")
  const [savePath, setSavePath] = useState("~/Downloads/grabbit")
  const [connections, setConnections] = useState([16])

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button className="w-full bg-cyan-300 text-slate-950 hover:bg-cyan-200" />
        }
      >
        <Plus />
        {t("addDialog.button")}
      </DialogTrigger>
      <DialogContent className="max-w-xl border-white/10 bg-slate-950 text-slate-50">
        <DialogHeader>
          <DialogTitle>{t("addDialog.title")}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {t("addDialog.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>{t("addDialog.source")}</Label>
            <Input
              className="border-white/10 bg-white/[0.04]"
              placeholder={t("addDialog.sourcePlaceholder")}
              value={source}
              onChange={(event) => setSource(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>{t("addDialog.saveTo")}</Label>
            <Input
              className="border-white/10 bg-white/[0.04]"
              value={savePath}
              onChange={(event) => setSavePath(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>{t("addDialog.comment")}</Label>
            <Textarea
              className="min-h-24 border-white/10 bg-white/[0.04]"
              placeholder={t("addDialog.commentPlaceholder")}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>{t("addDialog.connections")}</span>
              <span>{connections[0]}</span>
            </div>
            <Slider
              value={connections}
              max={32}
              step={1}
              onValueChange={(value) =>
                setConnections(Array.isArray(value) ? [...value] : [value])
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>{t("addDialog.priority")}</Label>
            <Select defaultValue="normal">
              <SelectTrigger className="w-full border-white/10 bg-white/[0.04]">
                <SelectValue placeholder={t("addDialog.priorityPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t("addDialog.low")}</SelectItem>
                <SelectItem value="normal">{t("addDialog.normal")}</SelectItem>
                <SelectItem value="high">{t("addDialog.high")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 border-white/10">
              {t("addDialog.cancel")}
            </Button>
            <Button
              className="flex-1 bg-cyan-300 text-slate-950 hover:bg-cyan-200"
              disabled={!source.trim()}
              onClick={() => {
                onAdd(source.trim(), savePath.trim(), connections[0] ?? 16)
                setSource("")
              }}
            >
              {t("addDialog.queueTask")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TaskDetails({ task }: { task: DownloadTask | null }) {
  const { t } = useI18n()

  return (
    <Card className="border-white/10 bg-white/[0.045] text-slate-50 shadow-lg shadow-black/15">
      <CardHeader className="flex flex-row items-center justify-between gap-3 p-4 pb-0">
        <div>
          <CardTitle className="text-lg text-white">
            {t("taskDetails.title")}
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            {task ? `GID ${task.id}` : "No selected task"}
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("taskDetails.actionLabel")}
        >
          <ChevronRight />
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4 p-4">
        <Card className="rounded-2xl border-white/10 bg-white/[0.03] text-slate-50 shadow-none">
          <CardContent className="p-3">
            {task ? (
              <>
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
                        className={cn(
                          "rounded-full bg-gradient-to-r",
                          task.accent
                        )}
                      />
                    </ProgressTrack>
                  </Progress>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <DetailStat label="Downloaded" value={task.downloaded} />
                  <DetailStat label="Uploaded" value={task.uploaded} />
                  <DetailStat
                    label="Protocol"
                    value={task.protocol.toUpperCase()}
                  />
                  <DetailStat label="Ratio" value={task.ratio} />
                </div>
              </>
            ) : (
              <div className="py-6 text-center text-sm text-slate-500">
                Real task details will appear after aria2 returns a download.
              </div>
            )}
          </CardContent>
        </Card>
        <div className="grid grid-cols-3 gap-2">
          <IconAction icon={Pause} label={t("taskDetails.pause")} />
          <IconAction icon={RotateCcw} label={t("taskDetails.retry")} />
          <IconAction icon={Trash2} label={t("taskDetails.remove")} danger />
        </div>
      </CardContent>
    </Card>
  )
}

function QuickControls({
  globalStat,
  onPauseAll,
  onResumeAll,
}: {
  globalStat: DownloadGlobalStat | null
  onPauseAll: () => void
  onResumeAll: () => void
}) {
  const { t } = useI18n()

  return (
    <Card className="border-white/10 bg-white/[0.045] text-slate-50 shadow-lg shadow-black/15">
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-lg text-white">
          {t("quickControls.title")}
        </CardTitle>
        <CardDescription className="text-slate-500">
          {t("quickControls.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 p-4">
        <div className="grid gap-2">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>{t("quickControls.queueLimit")}</span>
            <span>
              {globalStat?.numActive ?? 0} {t("quickControls.active")}
            </span>
          </div>
          <Slider defaultValue={[5]} max={10} step={1} />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>{t("quickControls.downloadCap")}</span>
            <span>{formatSpeed(globalStat?.downloadSpeed ?? 0)}</span>
          </div>
          <Slider defaultValue={[51]} max={100} step={1} />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onPauseAll}>
            <Pause />
            {t("quickControls.pauseAll")}
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-white/10"
            onClick={onResumeAll}
          >
            <RotateCcw />
            {t("quickControls.resumeAll")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function HistoryPanel({ tasks }: { tasks: DownloadTask[] }) {
  const { t } = useI18n()
  const completedTasks = tasks.filter((task) => task.status === "completed")

  return (
    <Card className="border-white/10 bg-white/[0.045] text-slate-50 shadow-lg shadow-black/15">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-0">
        <div>
          <CardTitle className="text-lg text-white">
            {t("history.title")}
          </CardTitle>
          <CardDescription className="text-slate-500">
            {t("history.description")}
          </CardDescription>
        </div>
        <FileArchive className="size-5 text-slate-500" />
      </CardHeader>
      <CardContent className="p-4">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-slate-500">
                {t("history.columns.name")}
              </TableHead>
              <TableHead className="text-slate-500">
                {t("history.columns.size")}
              </TableHead>
              <TableHead className="text-slate-500">
                {t("history.columns.when")}
              </TableHead>
              <TableHead className="text-slate-500">
                {t("history.columns.status")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {completedTasks.length === 0 ? (
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableCell
                  className="p-6 text-center text-sm text-slate-500"
                  colSpan={4}
                >
                  No completed downloads returned by aria2.
                </TableCell>
              </TableRow>
            ) : null}
            {completedTasks.map((task) => (
              <TableRow
                key={task.id}
                className="border-white/10 hover:bg-white/[0.03]"
              >
                <TableCell className="font-medium text-slate-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-300" />
                    {task.name}
                  </div>
                </TableCell>
                <TableCell className="text-slate-400">{task.size}</TableCell>
                <TableCell className="text-slate-400">--</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
                  >
                    {t("history.completed")}
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

function SettingsPanel({
  globalOptions,
}: {
  globalOptions: Record<string, string>
}) {
  const { locale, setLocale, t, labels } = useI18n()
  const engineProfiles = [
    [
      "Concurrent tasks",
      globalOptions["max-concurrent-downloads"] ?? "--",
      "aria2 max-concurrent-downloads",
    ],
    [
      "Connections per server",
      globalOptions["max-connection-per-server"] ?? "--",
      "aria2 max-connection-per-server",
    ],
    [
      "Download limit",
      globalOptions["max-overall-download-limit"] ?? "0",
      "0 means unlimited",
    ],
    [
      "Upload limit",
      globalOptions["max-overall-upload-limit"] ?? "0",
      "0 means unlimited",
    ],
  ]
  const btOptions = [
    ["DHT network", globalOptions["enable-dht"] ?? "--", "aria2 enable-dht"],
    [
      "Peer exchange",
      globalOptions["enable-peer-exchange"] ?? "--",
      "aria2 enable-peer-exchange",
    ],
    [
      "Local peer discovery",
      globalOptions["bt-enable-lpd"] ?? "--",
      "aria2 bt-enable-lpd",
    ],
    ["Seed ratio", globalOptions["seed-ratio"] ?? "--", "aria2 seed-ratio"],
  ]
  const integrationOptions = [
    ["User agent", globalOptions["user-agent"] ?? "--", "aria2 user-agent"],
    ["Referer", globalOptions.referer ?? "--", "aria2 referer"],
    ["Continue", globalOptions.continue ?? "--", "aria2 continue"],
    [
      "Auto file renaming",
      globalOptions["auto-file-renaming"] ?? "--",
      "aria2 auto-file-renaming",
    ],
  ]

  return (
    <Card className="border-white/10 bg-white/[0.045] text-slate-50 shadow-lg shadow-black/15">
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-lg text-white">
          {t("settings.title")}
        </CardTitle>
        <CardDescription className="text-slate-500">
          {t("settings.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 p-4">
        <div className="grid gap-2">
          <Label>{t("settings.theme")}</Label>
          <Select defaultValue="system">
            <SelectTrigger className="w-full border-white/10 bg-white/[0.04]">
              <SelectValue placeholder={t("settings.themePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dark">{t("settings.dark")}</SelectItem>
              <SelectItem value="light">{t("settings.light")}</SelectItem>
              <SelectItem value="system">{t("settings.system")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>{t("settings.language")}</Label>
          <Select
            value={locale}
            onValueChange={(value) => setLocale(value as typeof locale)}
          >
            <SelectTrigger className="w-full border-white/10 bg-white/[0.04]">
              <SelectValue placeholder={t("settings.language")} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(labels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>{t("settings.defaultFolder")}</Label>
          <Input
            className="border-white/10 bg-white/[0.04]"
            value={globalOptions.dir ?? ""}
            readOnly
          />
        </div>
        <div className="grid gap-2">
          <Label>{t("settings.rpcSecret")}</Label>
          <Textarea
            className="min-h-20 border-white/10 bg-white/[0.04]"
            value={
              globalOptions["rpc-secret"] ? "Configured" : "Not configured"
            }
            readOnly
          />
        </div>
        <section className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <div>
            <div className="text-sm font-semibold text-white">Engine</div>
            <div className="text-xs text-slate-500">
              Queue, speed, and concurrency controls
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {engineProfiles.map(([label, value, detail]) => (
              <Card
                key={label}
                className="border-white/10 bg-white/[0.03] shadow-none"
              >
                <CardContent className="p-3">
                  <div className="text-xs text-slate-500">{label}</div>
                  <div className="text-base font-semibold text-white">
                    {value}
                  </div>
                  <div className="text-xs text-slate-500">{detail}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        <section className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <div>
            <div className="text-sm font-semibold text-white">BitTorrent</div>
            <div className="text-xs text-slate-500">
              Tracker, DHT, and swarm discovery
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {btOptions.map(([label, value, detail]) => (
              <Card
                key={label}
                className="border-white/10 bg-white/[0.03] shadow-none"
              >
                <CardContent className="p-3">
                  <div className="text-xs text-slate-500">{label}</div>
                  <div className="text-base font-semibold text-white">
                    {value}
                  </div>
                  <div className="text-xs text-slate-500">{detail}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        <section className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <div>
            <div className="text-sm font-semibold text-white">Integration</div>
            <div className="text-xs text-slate-500">
              Browser, tray, and notifications
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {integrationOptions.map(([label, value, detail]) => (
              <Card
                key={label}
                className="border-white/10 bg-white/[0.03] shadow-none"
              >
                <CardContent className="p-3">
                  <div className="text-xs text-slate-500">{label}</div>
                  <div className="text-base font-semibold text-white">
                    {value}
                  </div>
                  <div className="text-xs text-slate-500">{detail}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  )
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="text-[11px] tracking-wide text-slate-500 uppercase">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  )
}

function LiveLog({
  serviceStatus,
  globalStat,
  tasks,
}: {
  serviceStatus: DownloadServiceStatus
  globalStat: DownloadGlobalStat | null
  tasks: DownloadTask[]
}) {
  const { t } = useI18n()

  const lines = [
    [
      t("liveLog.scopes.aria2c"),
      serviceStatus.running
        ? `RPC ready on port ${serviceStatus.rpcPort ?? "--"}`
        : "aria2c service stopped",
    ],
    [
      t("liveLog.scopes.queue"),
      `${globalStat?.numWaiting ?? 0} tasks waiting, ${globalStat?.numActive ?? 0} active`,
    ],
    [t("liveLog.scopes.disk"), `${tasks.length} tasks loaded from aria2`],
    [
      t("liveLog.scopes.net"),
      `${tasks.reduce((total, task) => total + task.connections, 0)} active connections`,
    ],
  ]

  return (
    <Card className="border-white/10 bg-white/[0.045] text-slate-50 shadow-lg shadow-black/15">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-0">
        <div>
          <CardTitle className="text-lg text-white">
            {t("liveLog.title")}
          </CardTitle>
          <CardDescription className="text-slate-500">
            {t("liveLog.description")}
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

function QueueSummary({
  globalStat,
  globalOptions,
}: {
  globalStat: DownloadGlobalStat | null
  globalOptions: Record<string, string>
}) {
  const { t } = useI18n()
  const waiting = globalStat?.numWaiting ?? 0
  const active = globalStat?.numActive ?? 0
  const total = waiting + active
  const waitingPercent = total > 0 ? Math.round((waiting / total) * 100) : 0

  return (
    <Card className="border-white/10 bg-white/[0.045] text-slate-50 shadow-lg shadow-black/15">
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-lg text-white">
          {t("queueSummary.title")}
        </CardTitle>
        <CardDescription className="text-slate-500">
          {t("queueSummary.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 p-4">
        <div className="grid gap-2">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>{t("queueSummary.waiting")}</span>
            <span>
              {waiting} {t("queueSummary.tasks")}
            </span>
          </div>
          <Progress value={waitingPercent} className="flex-1">
            <ProgressTrack className="h-2 bg-white/[0.07]">
              <ProgressIndicator className="rounded-full bg-gradient-to-r from-cyan-300 to-blue-500" />
            </ProgressTrack>
          </Progress>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-white/10 bg-white/[0.03] shadow-none">
            <CardContent className="p-3">
              <div className="text-xs text-slate-500">
                {t("queueSummary.retryWait")}
              </div>
              <div className="text-base font-semibold text-white">
                {globalOptions["retry-wait"] ?? "--"}
              </div>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/[0.03] shadow-none">
            <CardContent className="p-3">
              <div className="text-xs text-slate-500">
                {t("queueSummary.diskCache")}
              </div>
              <div className="text-base font-semibold text-white">
                {globalOptions["disk-cache"] ?? "--"}
              </div>
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
