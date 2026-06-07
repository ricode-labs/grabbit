import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Clipboard,
  ExternalLink,
  FileText,
  FileUp,
  Film,
  Folder,
  Image,
  Loader2,
  Music,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RotateCw,
  Search,
  Settings,
  Sparkles,
  Trash2,
} from "lucide-react"

import { useTheme } from "@/components/theme-provider"
import {
  EmptyTasks,
  MetricChip,
  NoticeBanner,
  PrimaryAside,
  Speedometer,
  TaskSubnav,
} from "@/components/app-shell"
import { AboutPage } from "@/components/about-page"
import { PreferencesPage } from "@/components/preferences-page"
import { LabeledTextarea } from "@/components/form-fields"
import type { Notice, Page } from "./lib/app-types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  buildAddTaskOptions,
  buildInitialAddTaskForm,
  buildTorrentSelectFileOption,
  calculateProgress,
  defaultGrabbitPreferences,
  flattenAnnounceList,
  isMediaTorrentFile,
  parseCurlCommand,
  splitTaskLinks,
  summarizeFiles,
  summarizePeers,
  toFiniteNumber,
  type AddTaskForm,
  type EnginePathInfo,
  type ExternalTaskIntent,
  type GrabbitPreferences,
  type ParsedTorrentInfo,
  type TaskSchedulerRule,
} from "../shared/grabbit"
import type {
  Aria2Peer,
  Aria2Server,
  Aria2Task,
  TaskListStatus,
} from "../preload/preload"

import {
  describeDeleteFilesResult,
  formatBytes,
  getProgress,
  getTaskName,
  getTaskUris,
  mergeDeleteResults,
  statusLabels,
  statusMeta,
  statusText,
  statusVariant,
  toNumber,
} from "./lib/task-display"

const fallbackInitialForm = buildInitialAddTaskForm(
  defaultGrabbitPreferences("")
)

export function App() {
  const [page, setPage] = useState<Page>("tasks")
  const [status, setStatus] = useState<TaskListStatus>("active")
  const [tasks, setTasks] = useState<Aria2Task[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [form, setForm] = useState<AddTaskForm>(fallbackInitialForm)
  const [preferences, setPreferences] = useState<GrabbitPreferences | null>(
    null
  )
  const [schedulerRule, setSchedulerRule] = useState<TaskSchedulerRule | null>(
    null
  )
  const [enginePaths, setEnginePaths] = useState<EnginePathInfo[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [notice, setNotice] = useState<Notice | null>(null)
  const [addTaskError, setAddTaskError] = useState<string | null>(null)
  const [torrentInfo, setTorrentInfo] = useState<ParsedTorrentInfo | null>(null)
  const [selectedTorrentIndexes, setSelectedTorrentIndexes] = useState<
    Set<number>
  >(new Set())
  const [torrentLoading, setTorrentLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Aria2Task | null>(null)
  const [deleteBatchTargets, setDeleteBatchTargets] = useState<Aria2Task[]>([])
  const [deleteFiles, setDeleteFiles] = useState(false)
  const [detailTask, setDetailTask] = useState<Aria2Task | null>(null)

  const loadTasks = useCallback(async () => {
    setLoading(true)
    try {
      const nextTasks = await window.grabbit.listTasks(status)
      setTasks(nextTasks)
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "读取任务列表失败",
      })
    } finally {
      setLoading(false)
    }
  }, [status])

  const { setTheme } = useTheme()

  useEffect(() => {
    void window.grabbit.getPreferences().then((nextPreferences) => {
      setPreferences(nextPreferences)
      setTheme(nextPreferences.theme)
      setForm(buildInitialAddTaskForm(nextPreferences))
    })
    void window.grabbit.getScheduler().then(setSchedulerRule)
    void window.grabbit.getEnginePaths().then(setEnginePaths)
  }, [setTheme])

  useEffect(() => {
    const load = () => {
      void loadTasks()
    }
    load()
    const timer = window.setInterval(load, 2000)
    return () => window.clearInterval(timer)
  }, [loadTasks])

  const totalSpeed = useMemo(
    () => tasks.reduce((sum, task) => sum + toNumber(task.downloadSpeed), 0),
    [tasks]
  )

  const visibleTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      return tasks
    }

    return tasks.filter((task) => {
      const haystack = [
        task.gid,
        getTaskName(task),
        task.dir,
        ...(task.files?.flatMap((file) => [
          file.path,
          ...(file.uris?.map((uri) => uri.uri) ?? []),
        ]) ?? []),
      ]
        .join("\n")
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [searchQuery, tasks])

  const submitTask = async () => {
    const uris = splitTaskLinks(form.uris)
    const torrentSelectFile = torrentInfo
      ? buildTorrentSelectFileOption(
          [...selectedTorrentIndexes],
          torrentInfo.files.length
        )
      : ""
    const taskOptions = buildAddTaskOptions({
      ...form,
      selectedTorrentFiles: torrentSelectFile,
    })

    if (uris.length === 0 && !form.torrentPath) {
      setAddTaskError("请输入至少一个下载链接，或选择一个 .torrent 文件")
      return
    }

    try {
      if (form.torrentPath) {
        if (torrentInfo && selectedTorrentIndexes.size === 0) {
          setAddTaskError("请至少选择一个种子文件")
          return
        }
        await window.grabbit.addTorrent({
          torrentPath: form.torrentPath,
          options: taskOptions,
        })
      }
      if (uris.length > 0) {
        await window.grabbit.addUri({ uris, options: taskOptions })
      }
      setAddTaskError(null)
      setNotice({ tone: "success", message: "任务已添加" })
      setAddOpen(false)
      const nextForm = buildInitialAddTaskForm(
        preferences ?? defaultGrabbitPreferences(form.dir)
      )
      setForm({ ...nextForm, dir: form.dir })
      setTorrentInfo(null)
      setSelectedTorrentIndexes(new Set())
      if (form.showDownloading) {
        setStatus("active")
      }
      await loadTasks()
    } catch (error) {
      setAddTaskError(error instanceof Error ? error.message : "添加任务失败")
    }
  }

  const copyText = async (text: string, successMessage: string) => {
    if (!text) {
      setNotice({ tone: "error", message: "没有可复制的内容" })
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      setNotice({ tone: "success", message: successMessage })
    } catch {
      setNotice({ tone: "error", message: "复制失败，请检查剪贴板权限" })
    }
  }

  const copyTaskLinks = async (task: Aria2Task) => {
    const links = getTaskUris(task)
    await copyText(links.join("\n"), "任务链接已复制")
  }

  const openLocalPath = async (targetPath: string) => {
    if (!targetPath) {
      setNotice({ tone: "error", message: "没有可打开的路径" })
      return
    }

    try {
      const errorMessage = await window.grabbit.openPath(targetPath)
      if (errorMessage) {
        setNotice({ tone: "error", message: errorMessage })
      }
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "打开路径失败",
      })
    }
  }

  const runTaskAction = async (
    task: Aria2Task,
    action: "pause" | "resume" | "remove" | "restart"
  ) => {
    try {
      if (action === "pause") {
        await window.grabbit.pauseTask(task.gid)
      } else if (action === "resume") {
        await window.grabbit.resumeTask(task.gid)
      } else if (action === "restart") {
        await window.grabbit.restartTask(task, { dir: task.dir })
        setNotice({ tone: "success", message: "已重新添加任务" })
      } else {
        await confirmRemoveTasks([task])
        return
      }

      await loadTasks()
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "操作失败",
      })
    }
  }

  const confirmRemoveTasks = async (targets: Aria2Task[]) => {
    try {
      const results = []
      for (const task of targets) {
        const result =
          task.status === "complete" ||
          task.status === "error" ||
          task.status === "removed"
            ? await window.grabbit.removeTaskResult(task, deleteFiles)
            : await window.grabbit.removeTask(task, deleteFiles)
        results.push(result)
      }

      setNotice({
        tone: "success",
        message: `已移除 ${targets.length} 个任务${describeDeleteFilesResult(mergeDeleteResults(results))}`,
      })
      setDeleteTarget(null)
      setDeleteBatchTargets([])
      setDeleteFiles(false)
      setSelected(new Set())
      await loadTasks()
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "移除任务失败",
      })
    }
  }

  const runBatchAction = async (action: "pause" | "resume" | "remove") => {
    const selectedTasks = tasks.filter((task) => selected.has(task.gid))
    if (action === "remove") {
      if (preferences?.noConfirmBeforeDeleteTask) {
        await confirmRemoveTasks(selectedTasks)
      } else {
        setDeleteBatchTargets(selectedTasks)
        setDeleteFiles(false)
      }
      return
    }

    for (const task of selectedTasks) {
      await runTaskAction(task, action)
    }
    setSelected(new Set())
  }

  const loadTorrentInfo = useCallback(async (torrentPath: string) => {
    setTorrentLoading(true)
    try {
      const parsed = await window.grabbit.parseTorrent(torrentPath)
      setTorrentInfo(parsed)
      setSelectedTorrentIndexes(new Set(parsed.files.map((file) => file.index)))
      setForm((current) => ({
        ...current,
        torrentPath,
        selectedTorrentFiles: "",
      }))
      setAddTaskError(null)
    } catch (error) {
      setTorrentInfo(null)
      setSelectedTorrentIndexes(new Set())
      setAddTaskError(
        error instanceof Error ? error.message : "解析种子文件失败"
      )
    } finally {
      setTorrentLoading(false)
    }
  }, [])

  const chooseTorrent = async () => {
    const torrentPath = await window.grabbit.selectTorrent()
    if (torrentPath) {
      await loadTorrentInfo(torrentPath)
    }
  }

  const clearTorrent = () => {
    setTorrentInfo(null)
    setSelectedTorrentIndexes(new Set())
    setForm((current) => ({
      ...current,
      torrentPath: "",
      selectedTorrentFiles: "",
    }))
  }

  const chooseDirectory = async () => {
    const directory = await window.grabbit.selectDirectory()
    if (directory) {
      setForm((current) => ({ ...current, dir: directory }))
    }
  }

  const savePreferences = async (nextPreferences: GrabbitPreferences) => {
    try {
      const savedPreferences =
        await window.grabbit.setPreferences(nextPreferences)
      setPreferences(savedPreferences)
      setTheme(savedPreferences.theme)
      setForm(buildInitialAddTaskForm(savedPreferences))
      setNotice({
        tone: "success",
        message: "偏好设置已保存，新任务会使用新的默认目录",
      })
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "保存偏好设置失败",
      })
    }
  }

  const saveScheduler = async (rule: TaskSchedulerRule) => {
    try {
      const savedRule = await window.grabbit.setScheduler(rule)
      setSchedulerRule(savedRule)
      setNotice({
        tone: "success",
        message: "速度计划已保存，并已应用到 aria2 引擎",
      })
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "保存速度计划失败",
      })
    }
  }

  const chooseDefaultDirectory = async () => {
    const directory = await window.grabbit.selectDirectory()
    if (directory) {
      const nextPreferences =
        preferences ?? defaultGrabbitPreferences(directory)
      await savePreferences({ ...nextPreferences, downloadDir: directory })
    }
  }

  const openAddTaskDialogWithIntents = useCallback(
    async (intents: ExternalTaskIntent[] = []) => {
      setAddOpen(true)
      setAddTaskError(null)
      const torrentIntent = intents.find((intent) => intent.kind === "torrent")
      const uriIntents = intents
        .filter((intent) => intent.kind === "uri")
        .map((intent) => intent.value)

      if (torrentIntent) {
        await loadTorrentInfo(torrentIntent.value)
      }

      if (uriIntents.length > 0) {
        setForm((current) => ({
          ...current,
          uris: Array.from(
            new Set([current.uris, ...uriIntents].filter(Boolean))
          ).join("\n"),
        }))
      }
    },
    [loadTorrentInfo]
  )

  const openAddTaskDialog = async () => {
    setAddOpen(true)
    const clipboardText = await navigator.clipboard.readText().catch(() => "")
    const parsedCurl = parseCurlCommand(clipboardText)
    const detectedUris = parsedCurl?.uris ?? splitTaskLinks(clipboardText)

    if (parsedCurl) {
      setForm((current) => ({
        ...current,
        uris: parsedCurl.uris.join("\n"),
        out: parsedCurl.out || current.out,
        userAgent: parsedCurl.userAgent || current.userAgent,
        authorization: parsedCurl.authorization || current.authorization,
        referer: parsedCurl.referer || current.referer,
        cookie: parsedCurl.cookie || current.cookie,
      }))
      return
    }

    if (detectedUris.length > 0) {
      setForm((current) => ({
        ...current,
        uris: current.uris || detectedUris.join("\n"),
      }))
    }
  }

  useEffect(() => {
    return window.grabbit.onExternalTaskIntents((intents) => {
      const shouldOpen = intents.some(
        (intent) =>
          intent.kind === "uri" ||
          intent.kind === "torrent" ||
          intent.command === "new-task"
      )
      if (shouldOpen) {
        void openAddTaskDialogWithIntents(intents)
      }
    })
  }, [openAddTaskDialogWithIntents])

  return (
    <div className="app-shell-bg relative flex h-screen overflow-hidden bg-background text-foreground">
      <div className="noise-overlay pointer-events-none absolute inset-0 opacity-35" />
      <PrimaryAside
        page={page}
        onNavigate={setPage}
        onAddTask={() => void openAddTaskDialog()}
      />

      {page === "tasks" ? (
        <main className="relative z-10 flex min-w-0 flex-1 gap-4 p-4 pl-0">
          <TaskSubnav
            status={status}
            onStatusChange={(nextStatus) => {
              setSelected(new Set())
              setStatus(nextStatus)
            }}
          />
          <section className="glass-panel flex min-w-0 flex-1 flex-col overflow-hidden rounded-[28px] border">
            <header className="relative overflow-hidden border-b px-6 py-5">
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${statusMeta[status].gradient}`} />
              <div className="relative flex items-center justify-between gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                    <Sparkles className="size-3.5 text-primary" /> Grabbit Command Center
                  </div>
                  <h1 className="text-3xl font-semibold tracking-[-0.04em]">
                    {statusLabels[status]}
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {statusMeta[status].caption}
                  </p>
                </div>
                <div className="hidden items-center gap-3 xl:flex">
                  <MetricChip label="可见任务" value={`${visibleTasks.length}/${tasks.length}`} />
                  <MetricChip label="实时速度" value={`${formatBytes(totalSpeed)}/s`} accent />
                </div>
              </div>
              <div className="relative mt-5 flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void loadTasks()}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <RotateCw />
                  )}
                  刷新
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void window.grabbit.pauseAll().then(loadTasks)}
                >
                  <Pause />
                  全部暂停
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void window.grabbit.resumeAll().then(loadTasks)
                  }
                >
                  <Play />
                  全部开始
                </Button>
                {status === "stopped" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      void window.grabbit.purgeResults().then(loadTasks)
                    }
                  >
                    <Trash2 />
                    清空记录
                  </Button>
                ) : null}
                <Button size="sm" onClick={() => void openAddTaskDialog()}>
                  <Plus />
                  新建任务
                </Button>
              </div>
            </header>

            {selected.size > 0 ? (
              <div className="mx-4 mt-4 flex items-center justify-between rounded-2xl border bg-primary/10 px-4 py-3 text-sm text-primary shadow-sm">
                <span>已选择 {selected.size} 个任务</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void runBatchAction("pause")}
                  >
                    暂停
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void runBatchAction("resume")}
                  >
                    开始
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => void runBatchAction("remove")}
                  >
                    移除
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="mx-4 mt-4 flex items-center gap-2 rounded-2xl border bg-background/55 px-4 py-3 shadow-sm backdrop-blur">
              <Search className="size-4 text-muted-foreground" />
              <Input
                className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                aria-label="搜索任务"
                placeholder="搜索任务名、GID、保存目录或原始链接"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              {searchQuery ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                >
                  清除
                </Button>
              ) : null}
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-4 p-4 pb-44">
                {notice ? (
                  <NoticeBanner
                    notice={notice}
                    onClose={() => setNotice(null)}
                  />
                ) : null}
                {loading && tasks.length === 0 ? (
                  <div className="flex h-72 items-center justify-center text-muted-foreground">
                    <Loader2 className="mr-2 animate-spin" /> 正在读取 aria2
                    任务...
                  </div>
                ) : visibleTasks.length > 0 ? (
                  visibleTasks.map((task) => (
                    <TaskCard
                      key={task.gid}
                      task={task}
                      selected={selected.has(task.gid)}
                      onSelectedChange={(checked) => {
                        setSelected((current) => {
                          const next = new Set(current)
                          if (checked) {
                            next.add(task.gid)
                          } else {
                            next.delete(task.gid)
                          }
                          return next
                        })
                      }}
                      onShowDetails={setDetailTask}
                      onCopyLinks={copyTaskLinks}
                      onOpenPath={openLocalPath}
                      onAction={(task, action) => {
                        if (action === "remove") {
                          if (preferences?.noConfirmBeforeDeleteTask) {
                            return runTaskAction(task, action)
                          }
                          setDeleteTarget(task)
                          setDeleteFiles(false)
                          return Promise.resolve()
                        }
                        return runTaskAction(task, action)
                      }}
                    />
                  ))
                ) : (
                  <EmptyTasks onAddTask={() => void openAddTaskDialog()} />
                )}
              </div>
            </ScrollArea>
          </section>
        </main>
      ) : null}

      {page === "preferences" ? (
        <PreferencesPage
          preferences={preferences}
          schedulerRule={schedulerRule}
          enginePaths={enginePaths}
          onChange={setPreferences}
          onSchedulerChange={setSchedulerRule}
          onSave={savePreferences}
          onSaveScheduler={saveScheduler}
          onChooseDirectory={chooseDefaultDirectory}
          onOpenPath={openLocalPath}
        />
      ) : null}
      {page === "about" ? <AboutPage /> : null}

      <Speedometer
        speed={totalSpeed}
        activeCount={tasks.filter((task) => task.status === "active").length}
      />

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open)
          if (!open) {
            setAddTaskError(null)
          }
        }}
      >
        <DialogContent className="flex h-[88vh] w-[min(720px,calc(100vw-2rem))] max-w-none grid-rows-none flex-col overflow-hidden p-0">
          <DialogHeader className="shrink-0 p-4 pb-0">
            <DialogTitle>新建下载任务</DialogTitle>
            <DialogDescription>
              支持 HTTP、HTTPS、FTP、磁力链接。每行一个链接。
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="min-h-0 flex-1 overflow-hidden px-4">
            <Tabs defaultValue="uri" className="min-h-0 pb-4">
              <TabsList>
                <TabsTrigger value="uri">链接任务</TabsTrigger>
                <TabsTrigger value="torrent">种子任务</TabsTrigger>
              </TabsList>
              <TabsContent value="uri" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="uris">任务链接</Label>
                  <Textarea
                    id="uris"
                    className="min-h-28"
                    placeholder="https://example.com/file.zip\nmagnet:?xt=urn:btih:...\n或粘贴 curl 命令自动解析"
                    value={form.uris}
                    onChange={(event) =>
                      setForm({ ...form, uris: event.target.value })
                    }
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-[1fr_160px]">
                  <div className="space-y-2">
                    <Label htmlFor="out">文件名</Label>
                    <Input
                      id="out"
                      placeholder="留空使用远程文件名"
                      value={form.out}
                      onChange={(event) =>
                        setForm({ ...form, out: event.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="split">连接数</Label>
                    <Input
                      id="split"
                      type="number"
                      min={1}
                      max={64}
                      value={form.split}
                      onChange={(event) =>
                        setForm({ ...form, split: Number(event.target.value) })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dir">保存目录</Label>
                  <div className="flex gap-2">
                    <Input
                      id="dir"
                      value={form.dir}
                      onChange={(event) =>
                        setForm({ ...form, dir: event.target.value })
                      }
                    />
                    <Button
                      variant="outline"
                      onClick={() => void chooseDirectory()}
                    >
                      <Folder />
                      选择
                    </Button>
                  </div>
                  <DirectoryHistory
                    directories={preferences?.downloadDirectoryHistory ?? []}
                    currentDirectory={form.dir}
                    onChoose={(directory) =>
                      setForm({ ...form, dir: directory })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-downloading"
                    checked={form.showDownloading}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, showDownloading: checked === true })
                    }
                  />
                  <Label htmlFor="show-downloading">添加后跳转到正在下载</Label>
                </div>
                <Button
                  variant="ghost"
                  className="px-0"
                  onClick={() => setAdvancedOpen(!advancedOpen)}
                >
                  <Settings />
                  {advancedOpen ? "隐藏高级选项" : "显示高级选项"}
                </Button>
                {advancedOpen ? (
                  <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 md:grid-cols-2">
                    <LabeledTextarea
                      id="user-agent"
                      label="User-Agent"
                      value={form.userAgent}
                      onChange={(value) =>
                        setForm({ ...form, userAgent: value })
                      }
                    />
                    <LabeledTextarea
                      id="authorization"
                      label="Authorization"
                      value={form.authorization}
                      onChange={(value) =>
                        setForm({ ...form, authorization: value })
                      }
                    />
                    <LabeledTextarea
                      id="referer"
                      label="Referer"
                      value={form.referer}
                      onChange={(value) => setForm({ ...form, referer: value })}
                    />
                    <LabeledTextarea
                      id="cookie"
                      label="Cookie"
                      value={form.cookie}
                      onChange={(value) => setForm({ ...form, cookie: value })}
                    />
                    <div className="space-y-2 md:col-span-2">
                      <Label>代理</Label>
                      <Input
                        placeholder="[http://][USER:PASSWORD@]HOST[:PORT]"
                        value={form.allProxy}
                        onChange={(event) =>
                          setForm({ ...form, allProxy: event.target.value })
                        }
                      />
                    </div>
                  </div>
                ) : null}
              </TabsContent>
              <TabsContent value="torrent" className="space-y-4 pt-4">
                <TorrentSelector
                  torrentPath={form.torrentPath}
                  torrentInfo={torrentInfo}
                  selectedIndexes={selectedTorrentIndexes}
                  loading={torrentLoading}
                  onChoose={() => void chooseTorrent()}
                  onClear={clearTorrent}
                  onSelectionChange={(indexes) =>
                    setSelectedTorrentIndexes(indexes)
                  }
                />
                <div className="grid gap-4 md:grid-cols-[1fr_160px]">
                  <div className="space-y-2">
                    <Label htmlFor="torrent-out">另存为</Label>
                    <Input
                      id="torrent-out"
                      placeholder="留空使用种子内名称"
                      value={form.out}
                      onChange={(event) =>
                        setForm({ ...form, out: event.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="torrent-split">连接数</Label>
                    <Input
                      id="torrent-split"
                      type="number"
                      min={1}
                      max={64}
                      value={form.split}
                      onChange={(event) =>
                        setForm({ ...form, split: Number(event.target.value) })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="torrent-dir">保存目录</Label>
                  <div className="flex gap-2">
                    <Input
                      id="torrent-dir"
                      value={form.dir}
                      onChange={(event) =>
                        setForm({ ...form, dir: event.target.value })
                      }
                    />
                    <Button
                      variant="outline"
                      onClick={() => void chooseDirectory()}
                    >
                      <Folder />
                      选择
                    </Button>
                  </div>
                  <DirectoryHistory
                    directories={preferences?.downloadDirectoryHistory ?? []}
                    currentDirectory={form.dir}
                    onChoose={(directory) =>
                      setForm({ ...form, dir: directory })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="torrent-show-downloading"
                    checked={form.showDownloading}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, showDownloading: checked === true })
                    }
                  />
                  <Label htmlFor="torrent-show-downloading">
                    添加后跳转到正在下载
                  </Label>
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>
          {addTaskError ? (
            <div className="mx-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {addTaskError}
            </div>
          ) : null}
          <DialogFooter className="mx-0 mb-0 shrink-0 border-t bg-background p-4">
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              取消
            </Button>
            <Button onClick={() => void submitTask()}>提交</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={detailTask !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailTask(null)
          }
        }}
      >
        <DialogContent className="flex h-[86vh] w-[min(760px,calc(100vw-2rem))] max-w-none grid-rows-none flex-col overflow-hidden p-0">
          <DialogHeader className="shrink-0 p-4 pb-0">
            <DialogTitle>任务详情</DialogTitle>
            <DialogDescription>
              {detailTask
                ? getTaskName(detailTask)
                : "查看任务的下载信息、原始链接和文件列表。"}
            </DialogDescription>
          </DialogHeader>
          {detailTask ? (
            <TaskDetails
              task={detailTask}
              onCopy={(text, message) => void copyText(text, message)}
              onOpenPath={(targetPath) => {
                void openLocalPath(targetPath)
              }}
            />
          ) : null}
          <DialogFooter className="mx-0 mb-0 shrink-0 border-t bg-background p-4">
            <Button variant="outline" onClick={() => setDetailTask(null)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null || deleteBatchTargets.length > 0}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
            setDeleteBatchTargets([])
            setDeleteFiles(false)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认移除任务？</DialogTitle>
            <DialogDescription>
              {deleteBatchTargets.length > 0
                ? `将从列表中移除选中的 ${deleteBatchTargets.length} 个任务。`
                : deleteTarget
                  ? `将从列表中移除“${getTaskName(deleteTarget)}”。`
                  : "将从列表中移除该任务。"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start space-x-2 rounded-lg border p-3">
            <Checkbox
              id="delete-files"
              checked={deleteFiles}
              onCheckedChange={(checked) => setDeleteFiles(checked === true)}
            />
            <div className="space-y-1">
              <Label htmlFor="delete-files" className="text-sm">
                同时删除本地文件
              </Label>
              <p className="text-xs text-muted-foreground">
                文件会被移动到系统回收站。为避免误删，仅处理 aria2
                返回且位于任务保存目录内的文件，目录会跳过。
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteTarget(null)
                setDeleteBatchTargets([])
                setDeleteFiles(false)
              }}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const targets =
                  deleteBatchTargets.length > 0
                    ? deleteBatchTargets
                    : deleteTarget
                      ? [deleteTarget]
                      : []
                if (targets.length > 0) {
                  void confirmRemoveTasks(targets)
                }
              }}
            >
              移除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DirectoryHistory({
  directories,
  currentDirectory,
  onChoose,
}: {
  directories: string[]
  currentDirectory: string
  onChoose: (directory: string) => void
}) {
  const options = directories.filter(
    (directory) => directory && directory !== currentDirectory
  )

  if (options.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {options.map((directory) => (
        <Button
          key={directory}
          type="button"
          variant="secondary"
          size="sm"
          className="max-w-full justify-start truncate text-xs"
          title={directory}
          onClick={() => onChoose(directory)}
        >
          {directory}
        </Button>
      ))}
    </div>
  )
}

function TorrentSelector({
  torrentPath,
  torrentInfo,
  selectedIndexes,
  loading,
  onChoose,
  onClear,
  onSelectionChange,
}: {
  torrentPath: string
  torrentInfo: ParsedTorrentInfo | null
  selectedIndexes: Set<number>
  loading: boolean
  onChoose: () => void
  onClear: () => void
  onSelectionChange: (indexes: Set<number>) => void
}) {
  const selectedFiles =
    torrentInfo?.files.filter((file) => selectedIndexes.has(file.index)) ?? []
  const selectedSize = selectedFiles.reduce((sum, file) => sum + file.length, 0)
  const allSelected =
    Boolean(torrentInfo?.files.length) &&
    selectedIndexes.size === torrentInfo?.files.length

  const toggleIndex = (index: number, checked: boolean) => {
    const next = new Set(selectedIndexes)
    if (checked) {
      next.add(index)
    } else {
      next.delete(index)
    }
    onSelectionChange(next)
  }

  const selectFiles = (indexes: number[]) => onSelectionChange(new Set(indexes))
  const selectByKind = (kind: "video" | "audio" | "image" | "document") => {
    selectFiles(
      torrentInfo?.files
        .filter((file) => isMediaTorrentFile(file, kind))
        .map((file) => file.index) ?? []
    )
  }

  return (
    <div className="space-y-3 rounded-lg border border-dashed p-4">
      <div className="flex items-start gap-3">
        <FileUp className="mt-1 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Label>种子文件</Label>
              <p className="mt-1 text-sm text-muted-foreground">
                选择本地 .torrent 后会先解析文件列表，可选择部分文件再通过
                aria2.addTorrent 提交。
              </p>
            </div>
            {torrentPath ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClear}
                title="清除种子"
              >
                <Trash2 />
              </Button>
            ) : null}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              value={torrentPath}
              placeholder="尚未选择 .torrent 文件"
              readOnly
            />
            <Button variant="outline" onClick={onChoose} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : null}
              选择文件
            </Button>
          </div>
        </div>
      </div>

      {torrentInfo ? (
        <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-medium break-all">
                {torrentInfo.name}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                已选择 {selectedFiles.length} / {torrentInfo.files.length}{" "}
                个文件 · {formatBytes(selectedSize)} /{" "}
                {formatBytes(torrentInfo.totalLength)}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  selectFiles(torrentInfo.files.map((file) => file.index))
                }
              >
                全选
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectFiles([])}
              >
                全不选
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectByKind("video")}
            >
              <Film /> 视频
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectByKind("audio")}
            >
              <Music /> 音频
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectByKind("image")}
            >
              <Image /> 图片
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectByKind("document")}
            >
              <FileText /> 文档
            </Button>
            <Badge variant={allSelected ? "secondary" : "outline"}>
              {allSelected ? "全部文件" : "部分文件"}
            </Badge>
          </div>

          <div className="max-h-64 overflow-auto rounded-md border bg-background">
            <div className="divide-y">
              {torrentInfo.files.map((file) => (
                <label
                  key={`${file.index}-${file.path}`}
                  className="flex cursor-pointer items-start gap-3 p-3 text-sm hover:bg-muted/40"
                >
                  <Checkbox
                    checked={selectedIndexes.has(file.index)}
                    onCheckedChange={(checked) =>
                      toggleIndex(file.index, checked === true)
                    }
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium break-all">{file.path}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      #{file.index} ·{" "}
                      {file.extension
                        ? file.extension.replace(/^\./, "").toUpperCase()
                        : "无扩展名"}{" "}
                      · {formatBytes(file.length)}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function TaskCard({
  task,
  selected,
  onSelectedChange,
  onShowDetails,
  onCopyLinks,
  onOpenPath,
  onAction,
}: {
  task: Aria2Task
  selected: boolean
  onSelectedChange: (checked: boolean) => void
  onShowDetails: (task: Aria2Task) => void
  onCopyLinks: (task: Aria2Task) => Promise<void>
  onOpenPath: (targetPath: string) => Promise<void>
  onAction: (
    task: Aria2Task,
    action: "pause" | "resume" | "remove" | "restart"
  ) => Promise<void>
}) {
  const progress = getProgress(task)
  const taskPath = task.files?.[0]?.path || task.dir

  return (
    <Card className={`aurora-card glass-panel rounded-3xl transition-all hover:-translate-y-0.5 ${selected ? "border-primary shadow-primary/20" : ""}`}>
      <CardContent className="relative p-5">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelectedChange(checked === true)}
            className="mt-1"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="line-clamp-2 text-base leading-6 font-semibold tracking-tight break-all">
                  {getTaskName(task)}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant={statusVariant[task.status] ?? "outline"}>
                    {statusText[task.status] ?? task.status}
                  </Badge>
                  <span>
                    {formatBytes(task.completedLength)} /{" "}
                    {formatBytes(task.totalLength)}
                  </span>
                  <span>{formatBytes(task.downloadSpeed)}/s</span>
                  <span>{task.connections || "0"} 连接</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {task.status === "active" ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void onAction(task, "pause")}
                    title="暂停"
                  >
                    <Pause />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void onAction(task, "resume")}
                    title="开始"
                  >
                    <Play />
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <MoreHorizontal />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onShowDetails(task)}>
                      <FileText /> 查看详情
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void onCopyLinks(task)}>
                      <Clipboard /> 复制链接
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void onOpenPath(taskPath)}>
                      <Folder /> 打开位置
                    </DropdownMenuItem>
                    {task.status === "complete" ||
                    task.status === "error" ||
                    task.status === "removed" ? (
                      <DropdownMenuItem
                        onClick={() => void onAction(task, "restart")}
                      >
                        <RotateCw /> 重新下载
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => void onAction(task, "remove")}
                    >
                      <Trash2 /> 移除任务
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="mt-5 space-y-2 rounded-2xl bg-background/45 p-3">
              <Progress value={progress} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{progress}%</span>
                <span className="truncate pl-4">{taskPath}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TaskDetails({
  task,
  onCopy,
  onOpenPath,
}: {
  task: Aria2Task
  onCopy: (text: string, message: string) => void
  onOpenPath: (targetPath: string) => void
}) {
  const [peers, setPeers] = useState<Aria2Peer[]>([])
  const [servers, setServers] = useState<Aria2Server[]>([])
  const [networkLoading, setNetworkLoading] = useState(false)
  const [networkError, setNetworkError] = useState<string | null>(null)
  const taskUris = getTaskUris(task)
  const progress = getProgress(task)
  const taskPath = task.files?.[0]?.path || task.dir
  const fileSummary = summarizeFiles(task.files ?? [])
  const trackers = flattenAnnounceList(task.bittorrent?.announceList)
  const peerSummary = summarizePeers(peers)
  const activityRows = [
    { label: "任务 GID", value: task.gid },
    { label: "当前状态", value: statusText[task.status] ?? task.status },
    { label: "下载速度", value: `${formatBytes(task.downloadSpeed)}/s` },
    { label: "上传速度", value: `${formatBytes(task.uploadSpeed)}/s` },
    { label: "连接数", value: task.connections || "0" },
    { label: "做种数", value: task.numSeeders || "0" },
    { label: "校验完成", value: formatBytes(task.verifiedLength) },
    {
      label: "等待校验",
      value: task.verifyIntegrityPending === "true" ? "是" : "否",
    },
  ]

  useEffect(() => {
    let cancelled = false

    const loadNetworkDetails = async () => {
      setNetworkLoading(true)
      setNetworkError(null)
      try {
        const [nextPeers, nextServers] = await Promise.all([
          window.grabbit.getTaskPeers(task.gid),
          window.grabbit.getTaskServers(task.gid),
        ])
        if (!cancelled) {
          setPeers(nextPeers)
          setServers(nextServers)
        }
      } catch (error) {
        if (!cancelled) {
          setPeers([])
          setServers([])
          setNetworkError(
            error instanceof Error ? error.message : "读取 BT 网络详情失败"
          )
        }
      } finally {
        if (!cancelled) {
          setNetworkLoading(false)
        }
      }
    }

    void loadNetworkDetails()
    const timer = window.setInterval(loadNetworkDetails, 3000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [task.gid])

  return (
    <Tabs defaultValue="activity" className="min-h-0 flex-1 px-4 py-4">
      <TabsList className="shrink-0">
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="files">Files</TabsTrigger>
        <TabsTrigger value="trackers">Trackers</TabsTrigger>
        <TabsTrigger value="peers">Peers</TabsTrigger>
      </TabsList>
      <ScrollArea className="mt-4 h-[calc(86vh-210px)] pr-3">
        <TabsContent value="activity" className="mt-0 space-y-4">
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <DetailItem label="名称" value={getTaskName(task)} />
            <DetailItem label="保存目录" value={task.dir || "-"} />
            <DetailItem label="总大小" value={formatBytes(task.totalLength)} />
            <DetailItem
              label="已完成"
              value={formatBytes(task.completedLength)}
            />
            <DetailItem
              label="文件"
              value={`${fileSummary.selectedCount}/${fileSummary.count} 已选择`}
            />
            <DetailItem label="BT 模式" value={task.bittorrent?.mode || "-"} />
          </div>

          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium">进度</h3>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(task.completedLength)} /{" "}
                  {formatBytes(task.totalLength)}
                </p>
              </div>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            {activityRows.map((row) => (
              <DetailItem key={row.label} label={row.label} value={row.value} />
            ))}
          </div>

          {task.errorCode || task.errorMessage ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <div className="font-medium">错误 {task.errorCode || ""}</div>
              <div className="mt-1 break-all">
                {task.errorMessage || "aria2 未返回错误详情"}
              </div>
            </div>
          ) : null}

          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium">原始链接</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCopy(taskUris.join("\n"), "任务链接已复制")}
                disabled={taskUris.length === 0}
              >
                <Clipboard /> 复制全部
              </Button>
            </div>
            {taskUris.length > 0 ? (
              <div className="space-y-2">
                {taskUris.map((uri) => (
                  <div
                    key={uri}
                    className="flex items-start justify-between gap-2 rounded-md bg-muted/40 p-2 text-xs"
                  >
                    <code className="min-w-0 break-all">{uri}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0"
                      onClick={() => onCopy(uri, "链接已复制")}
                    >
                      <Clipboard />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                aria2
                没有返回原始链接；种子任务或部分历史记录可能只包含文件信息。
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="files" className="mt-0 space-y-3">
          <div className="grid gap-3 text-sm md:grid-cols-4">
            <DetailItem label="文件数" value={String(fileSummary.count)} />
            <DetailItem
              label="已选"
              value={String(fileSummary.selectedCount)}
            />
            <DetailItem
              label="总大小"
              value={formatBytes(fileSummary.totalLength)}
            />
            <DetailItem label="完成" value={`${fileSummary.progress}%`} />
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenPath(taskPath)}
              disabled={!taskPath}
            >
              <ExternalLink /> 打开位置
            </Button>
          </div>
          {task.files?.length ? (
            <div className="divide-y rounded-md border">
              {task.files.map((file, index) => {
                const fileProgress = calculateProgress(
                  file.completedLength,
                  file.length
                )
                const fileUris =
                  file.uris?.map((uri) => uri.uri).filter(Boolean) ?? []
                return (
                  <div
                    key={`${file.path}-${index}`}
                    className="space-y-2 p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium break-all">
                          {file.path || `文件 ${file.index ?? index + 1}`}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          #{file.index ?? index + 1} ·{" "}
                          {formatBytes(file.completedLength)} /{" "}
                          {formatBytes(file.length)} ·{" "}
                          {file.selected === "true" ? "已选择" : "未选择"}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0"
                        onClick={() => onCopy(file.path, "文件路径已复制")}
                      >
                        <Clipboard />
                      </Button>
                    </div>
                    <Progress value={fileProgress} />
                    {fileUris.length > 0 ? (
                      <div className="space-y-1 rounded-md bg-muted/30 p-2 text-xs">
                        {fileUris.map((uri) => (
                          <div key={uri} className="break-all">
                            {uri}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">暂无文件信息。</p>
          )}
        </TabsContent>

        <TabsContent value="trackers" className="mt-0 space-y-3">
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <DetailItem label="Tracker 数" value={String(trackers.length)} />
            <DetailItem
              label="BT 名称"
              value={task.bittorrent?.info?.name || "-"}
            />
            <DetailItem
              label="创建时间"
              value={
                task.bittorrent?.creationDate
                  ? new Date(
                      toFiniteNumber(task.bittorrent.creationDate) * 1000
                    ).toLocaleString()
                  : "-"
              }
            />
          </div>
          {task.bittorrent?.comment ? (
            <div className="rounded-lg border p-3 text-sm">
              <div className="text-xs text-muted-foreground">Comment</div>
              <div className="mt-1 break-all">{task.bittorrent.comment}</div>
            </div>
          ) : null}
          {trackers.length > 0 ? (
            <div className="divide-y rounded-md border">
              {trackers.map((tracker) => (
                <div
                  key={tracker}
                  className="flex items-start justify-between gap-2 p-3 text-sm"
                >
                  <code className="min-w-0 break-all">{tracker}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    onClick={() => onCopy(tracker, "Tracker 已复制")}
                  >
                    <Clipboard />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              aria2 暂未返回 Tracker 列表；HTTP 任务不会包含该信息。
            </p>
          )}
        </TabsContent>

        <TabsContent value="peers" className="mt-0 space-y-3">
          <div className="grid gap-3 text-sm md:grid-cols-4">
            <DetailItem
              label="Peer 数"
              value={networkLoading ? "读取中..." : String(peerSummary.count)}
            />
            <DetailItem label="Seeder" value={String(peerSummary.seeders)} />
            <DetailItem
              label="下行"
              value={`${formatBytes(peerSummary.downloadSpeed)}/s`}
            />
            <DetailItem
              label="上行"
              value={`${formatBytes(peerSummary.uploadSpeed)}/s`}
            />
          </div>
          {networkError ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {networkError}
            </p>
          ) : null}
          {peers.length > 0 ? (
            <div className="divide-y rounded-md border">
              {peers.map((peer, index) => (
                <div
                  key={`${peer.ip}-${peer.port}-${index}`}
                  className="grid gap-2 p-3 text-sm md:grid-cols-[1fr_auto]"
                >
                  <div className="min-w-0">
                    <div className="font-medium break-all">
                      {peer.ip}:{peer.port}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {peer.peerId || "未知客户端"} ·{" "}
                      {peer.seeder === "true" ? "Seeder" : "Leecher"}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground md:text-right">
                    ↓ {formatBytes(peer.downloadSpeed)}/s · ↑{" "}
                    {formatBytes(peer.uploadSpeed)}/s
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              暂无 Peer 信息；非 BT 任务或无活动连接时为空。
            </p>
          )}
          {servers.length > 0 ? (
            <div className="space-y-2 rounded-lg border p-3">
              <h3 className="text-sm font-medium">HTTP/FTP Servers</h3>
              {servers
                .flatMap((entry) =>
                  entry.servers.map((server) => ({
                    ...server,
                    index: entry.index,
                  }))
                )
                .map((server) => (
                  <div
                    key={`${server.index}-${server.uri}`}
                    className="rounded-md bg-muted/30 p-2 text-xs"
                  >
                    <div className="font-medium break-all">
                      #{server.index} {server.currentUri || server.uri}
                    </div>
                    <div className="mt-1 text-muted-foreground">
                      {formatBytes(server.downloadSpeed)}/s
                    </div>
                  </div>
                ))}
            </div>
          ) : null}
        </TabsContent>
      </ScrollArea>
    </Tabs>
  )
}
function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium break-all">{value || "-"}</div>
    </div>
  )
}


export default App
